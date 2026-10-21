import uuid
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import (
    PerfilCargo, ProcesoSeleccion, Postulante, Postulacion,
    DocumentoPostulacion, HitoProceso, RegistroAuditoria,
)
from .serializers import (
    PerfilCargoSerializer, ProcesoSeleccionSerializer, PostulanteSerializer,
    PostulacionSerializer, DocumentoPostulacionSerializer, HitoProcesoSerializer,
    RegistroAuditoriaSerializer,
)


class PerfilCargoViewSet(viewsets.ModelViewSet):
    queryset = PerfilCargo.objects.all()
    serializer_class = PerfilCargoSerializer


class ProcesoSeleccionViewSet(viewsets.ModelViewSet):
    queryset = ProcesoSeleccion.objects.all()
    serializer_class = ProcesoSeleccionSerializer


class PostulanteViewSet(viewsets.ModelViewSet):
    queryset = Postulante.objects.all()
    serializer_class = PostulanteSerializer


class PostulacionViewSet(viewsets.ModelViewSet):
    queryset = Postulacion.objects.all()
    serializer_class = PostulacionSerializer

    @action(detail=False, methods=['post'], url_path='generar-invitacion')
    def generar_invitacion(self, request):
        """
        Genera un token y enlace seguro de postulación para un RUT y Proceso específico.
        Permite a la Mesa de Entradas o RRHH enviar el link al candidato.
        """
        rut = request.data.get('rut', '').strip()
        proceso_id = request.data.get('proceso_id')
        nombres = request.data.get('nombres', '').strip()
        apellidos = request.data.get('apellidos', '').strip()
        email = request.data.get('email', '').strip()
        telefono = request.data.get('telefono', '').strip()

        if not rut:
            return Response({'error': 'El RUT es obligatorio para generar la invitación.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not proceso_id:
            return Response({'error': 'Debe seleccionar un proceso de selección.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            proceso = ProcesoSeleccion.objects.get(pk=proceso_id)
        except ProcesoSeleccion.DoesNotExist:
            return Response({'error': 'El proceso de selección especificado no existe.'},
                            status=status.HTTP_404_NOT_FOUND)

        # Buscar o crear el postulante
        postulante, creado_post = Postulante.objects.get_or_create(
            rut=rut,
            defaults={
                'nombres': nombres or 'Postulante',
                'apellidos': apellidos or 'Registrado',
                'email': email,
                'telefono': telefono,
            }
        )

        # Si ya existía y vienen datos nuevos, actualizar opcionalmente
        if not creado_post and (nombres or apellidos or email or telefono):
            if nombres: postulante.nombres = nombres
            if apellidos: postulante.apellidos = apellidos
            if email: postulante.email = email
            if telefono: postulante.telefono = telefono
            postulante.save()

        # Buscar o crear la postulación para este concurso
        postulacion, creado_postu = Postulacion.objects.get_or_create(
            proceso=proceso,
            postulante=postulante,
            defaults={
                'estado': Postulacion.ESTADO_PENDIENTE,
                'etapa_actual': 'recepcion',
                'observaciones': 'Invitación generada por Mesa de Entradas.',
            }
        )

        # Registrar auditoría
        usuario = request.user if request.user.is_authenticated else None
        RegistroAuditoria.objects.create(
            proceso=proceso,
            usuario=usuario,
            accion='TOKEN_INVITACION_GENERADO',
            detalle=f'Enlace seguro generado para RUT {rut} ({postulante}). Token: {postulacion.token_acceso}'
        )

        # Construir URL relativa/absoluta
        url_portal = f'/?token={postulacion.token_acceso}'

        return Response({
            'success': True,
            'mensaje': 'Enlace seguro de postulación generado con éxito.',
            'token': str(postulacion.token_acceso),
            'url_portal': url_portal,
            'postulacion_id': postulacion.id,
            'rut': postulante.rut,
            'postulante_nombre': f'{postulante.nombres} {postulante.apellidos}',
            'proceso_cargo': proceso.perfil_cargo.nombre,
            'proceso_area': proceso.area_usuaria,
            'estado': postulacion.estado,
            'estado_display': postulacion.get_estado_display(),
        }, status=status.HTTP_201_CREATED if creado_postu else status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='actualizar-estado-comision')
    def actualizar_estado_comision(self, request, pk=None):
        """
        Permite a la Comisión Evaluadora o Administrador actualizar el estado,
        etapa y notas visibles para el postulante en su portal.
        """
        postulacion = self.get_object()
        nuevo_estado = request.data.get('estado')
        nueva_etapa = request.data.get('etapa_actual')
        obs_interna = request.data.get('observaciones')
        obs_postulante = request.data.get('observacion_postulante')
        subsanacion = request.data.get('subsanacion_solicitada')

        if nuevo_estado:
            postulacion.estado = nuevo_estado
        if nueva_etapa:
            postulacion.etapa_actual = nueva_etapa
        if obs_interna is not None:
            postulacion.observaciones = obs_interna
        if obs_postulante is not None:
            postulacion.observacion_postulante = obs_postulante
        if subsanacion is not None:
            postulacion.subsanacion_solicitada = bool(subsanacion)

        postulacion.save()

        usuario = request.user if request.user.is_authenticated else None
        RegistroAuditoria.objects.create(
            proceso=postulacion.proceso,
            usuario=usuario,
            accion='ESTADO_POSTULACION_ACTUALIZADO',
            detalle=f'Estado cambiado a "{postulacion.get_estado_display()}" para postulante RUT {postulacion.postulante.rut}. Observación: {obs_postulante or "Sin mensaje"}'
        )

        serializer = self.get_serializer(postulacion)
        return Response(serializer.data)


class PortalPostulanteView(APIView):
    """
    Vista pública protegida por token criptográfico único.
    Permite al postulante ver el estado de su postulación en tiempo real,
    rellenar sus datos personales/profesionales, adjuntar documentos
    y enviarla a revisión oficial.
    """
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            token_uuid = uuid.UUID(str(token))
            postulacion = Postulacion.objects.select_related(
                'proceso', 'proceso__perfil_cargo', 'postulante'
            ).prefetch_related('documentos').get(token_acceso=token_uuid)
        except (ValueError, Postulacion.DoesNotExist):
            return Response(
                {'error': 'Enlace de postulación no válido o expirado. Verifique el token provisto.'},
                status=status.HTTP_404_NOT_FOUND
            )

        post = postulacion.postulante
        proc = postulacion.proceso
        perfil = proc.perfil_cargo

        docs = [
            {
                'id': d.id,
                'nombre': d.nombre,
                'tipo': d.tipo,
                'tipo_display': d.get_tipo_display(),
                'recibido': d.recibido,
                'subido_en': d.subido_en,
            }
            for d in postulacion.documentos.all()
        ]

        # Determinar si puede editar:
        # Puede editar si no ha sido enviada (fecha_envio is None o ESTADO_PENDIENTE)
        # O si la comisión evaluadora ha solicitado subsanación
        if postulacion.fecha_envio is None or postulacion.estado == Postulacion.ESTADO_PENDIENTE:
            permite_edicion = True
        elif postulacion.subsanacion_solicitada or postulacion.estado == Postulacion.ESTADO_SUBSANACION:
            permite_edicion = True
        else:
            permite_edicion = False

        data = {
            'success': True,
            'token': str(postulacion.token_acceso),
            'postulacion_id': postulacion.id,
            'estado': postulacion.estado,
            'estado_display': postulacion.get_estado_display(),
            'etapa_actual': postulacion.etapa_actual,
            'fecha_postulacion': postulacion.fecha_postulacion,
            'fecha_envio': postulacion.fecha_envio,
            'documentos_completos': postulacion.documentos_completos,
            'subsanacion_solicitada': postulacion.subsanacion_solicitada,
            'observacion_postulante': postulacion.observacion_postulante,
            'permite_edicion': permite_edicion,
            'puede_editar': permite_edicion,
            'postulacion': {
                'id': postulacion.id,
                'estado': postulacion.estado,
                'estado_display': postulacion.get_estado_display(),
                'etapa_actual': postulacion.etapa_actual,
                'fecha_envio': postulacion.fecha_envio,
                'documentos_completos': postulacion.documentos_completos,
                'subsanacion_solicitada': postulacion.subsanacion_solicitada,
                'observacion_postulante': postulacion.observacion_postulante,
            },
            'postulante': {
                'id': post.id,
                'rut': post.rut,
                'nombres': post.nombres,
                'apellidos': post.apellidos,
                'email': post.email,
                'telefono': post.telefono,
                'formacion_academica': post.formacion_academica,
                'titulo_profesional': post.titulo_profesional,
                'registro_sis': post.registro_sis,
                'anios_experiencia': post.anios_experiencia,
                'experiencia': post.experiencia,
            },
            'proceso': {
                'id': proc.id,
                'cargo_nombre': perfil.nombre,
                'area_usuaria': proc.area_usuaria,
                'descripcion': perfil.descripcion,
                'requisitos_minimos': perfil.requisitos_minimos,
                'requisitos_deseables': perfil.requisitos_deseables,
                'competencias_clave': perfil.competencias_clave,
                'estado_proceso': proc.estado,
                'fecha_cierre': proc.fecha_cierre,
            },
            'documentos': docs,
        }
        return Response(data)

    def post(self, request, token):
        try:
            token_uuid = uuid.UUID(str(token))
            postulacion = Postulacion.objects.select_related('postulante', 'proceso').get(token_acceso=token_uuid)
        except (ValueError, Postulacion.DoesNotExist):
            return Response(
                {'error': 'Enlace de postulación no válido o expirado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        post = postulacion.postulante
        data = request.data

        # Actualizar datos del postulante
        if 'nombres' in data: post.nombres = data['nombres'].strip()
        if 'apellidos' in data: post.apellidos = data['apellidos'].strip()
        if 'email' in data: post.email = data['email'].strip()
        if 'telefono' in data: post.telefono = data['telefono'].strip()
        if 'formacion_academica' in data: post.formacion_academica = data['formacion_academica'].strip()
        if 'titulo_profesional' in data: post.titulo_profesional = data['titulo_profesional'].strip()
        if 'registro_sis' in data: post.registro_sis = data['registro_sis'].strip()
        if 'anios_experiencia' in data:
            try:
                post.anios_experiencia = int(data['anios_experiencia'])
            except (ValueError, TypeError):
                pass
        if 'experiencia' in data: post.experiencia = data['experiencia'].strip()
        post.save()

        # Documentos adjuntos o declarados
        nuevos_docs = data.get('documentos_declarados', [])
        if isinstance(nuevos_docs, list):
            for doc_item in nuevos_docs:
                nombre_doc = doc_item.get('nombre')
                tipo_doc = doc_item.get('tipo', DocumentoPostulacion.TIPO_OTRO)
                if nombre_doc:
                    DocumentoPostulacion.objects.get_or_create(
                        postulacion=postulacion,
                        nombre=nombre_doc,
                        defaults={'tipo': tipo_doc, 'recibido': True}
                    )

        # Acción de envío oficial
        accion = data.get('accion')
        if accion == 'enviar':
            postulacion.fecha_envio = timezone.now()
            postulacion.estado = Postulacion.ESTADO_RECIBIDA
            postulacion.etapa_actual = 'recepcion'
            postulacion.documentos_completos = True
            postulacion.subsanacion_solicitada = False
            postulacion.observacion_postulante = (
                'Su postulación oficial ha sido recibida exitosamente en el sistema de selección del Hospital Penco Lirquén. '
                'Sus antecedentes serán revisados por el Comité en la Etapa de Revisión Curricular.'
            )
            postulacion.save()

            # Auditoría
            RegistroAuditoria.objects.create(
                proceso=postulacion.proceso,
                usuario=None,
                accion='POSTULACION_ENVIADA_PORTAL',
                detalle=f'El postulante RUT {post.rut} ({post.nombres} {post.apellidos}) envió oficialmente su postulación.'
            )
            mensaje = '¡Postulación guardada y enviada exitosamente! Sus antecedentes están en revisión.'
        else:
            postulacion.save()
            mensaje = 'Borrador de postulación guardado correctamente.'

        return Response({
            'success': True,
            'enviado': (accion == 'enviar'),
            'mensaje': mensaje,
            'estado': postulacion.estado,
            'estado_display': postulacion.get_estado_display(),
            'fecha_envio': postulacion.fecha_envio,
        })


class DocumentoPostulacionViewSet(viewsets.ModelViewSet):
    queryset = DocumentoPostulacion.objects.all()
    serializer_class = DocumentoPostulacionSerializer


class HitoProcesoViewSet(viewsets.ModelViewSet):
    queryset = HitoProceso.objects.all()
    serializer_class = HitoProcesoSerializer


class RegistroAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = RegistroAuditoria.objects.all()
    serializer_class = RegistroAuditoriaSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
