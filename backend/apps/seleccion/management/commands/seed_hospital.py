from datetime import date
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.seleccion.models import (
    PerfilCargo, ProcesoSeleccion, Postulante, Postulacion,
    DocumentoPostulacion, HitoProceso, RegistroAuditoria
)
from apps.pautas.models import PlantillaFlujo, EtapaProceso, PautaAbordaje, EvaluacionCandidato
from apps.preguntas.models import Pregunta, ConexionPregunta


class Command(BaseCommand):
    help = 'Carga datos semilla del Hospital Penco Lirquen (idempotente) con logica de negocio real.'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando carga de datos semilla para Hospital Penco Lirquen...')
        User = get_user_model()

        # 1. Superusuario y usuario institucional para Carolina Ruiz Parra
        admin_user, created_admin = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@hospitalpenco.cl',
                'is_staff': True,
                'is_superuser': True,
                'first_name': 'Administrador',
                'last_name': 'Hospital Penco'
            }
        )
        if created_admin:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Superusuario "admin" creado con clave "admin123".'))

        carolina_user, _ = User.objects.get_or_create(
            username='carolina.ruiz',
            defaults={
                'email': 'carolina.ruiz@redsalud.gob.cl',
                'is_staff': True,
                'first_name': 'Carolina',
                'last_name': 'Ruiz Parra'
            }
        )
        if _:
            carolina_user.set_password('penco2026')
            carolina_user.save()

        # 2. Perfiles de Cargo con descriptores normativos
        perfiles_data = [
            {
                'nombre': 'Enfermero/a UCI - Servicio Paciente Critico',
                'area_usuaria': 'Unidad de Cuidados Intensivos (UCI)',
                'descripcion': 'Atencion directa a pacientes criticos de alta complejidad, monitoreo hemodinamico y manejo avanzado de via aerea.',
                'requisitos_minimos': 'Titulo profesional de Enfermero/a reconocido por SIS. Al menos 1 ano de experiencia en UPC o UCI.',
                'requisitos_deseables': 'Diplomado en Paciente Critico o Cuidados Intensivos. Curso ACLS/BLS vigente.',
                'competencias_clave': 'Toma de decisiones bajo presion, Trabajo en equipo multidisciplinario, Empatia clinica, Comunicacion asertiva.',
                'funciones_principales': 'Administracion de farmacos vasoactivos, monitoreo invasivo, liderazgo de turnos clinicos.',
                'activo': True
            },
            {
                'nombre': 'Administrativo/a SOME',
                'area_usuaria': 'Servicio de Orientacion Medico-Estadistica (SOME)',
                'descripcion': 'Gestion y recepcion de usuarios, admision hospitalaria, citaciones y registro en fichas clinicas.',
                'requisitos_minimos': 'Licencia de Ensenanza Media o Tecnico de Nivel Superior en Administracion.',
                'requisitos_deseables': 'Manejo de sistema SIDRA/Rayen, computacion nivel intermedio.',
                'competencias_clave': 'Orientacion al usuario, Manejo de situaciones de conflicto, Precision documental.',
                'funciones_principales': 'Agendamiento ambulatorio, recepcion de interconsultas, gestion de cupos medicos.',
                'activo': True
            },
            {
                'nombre': 'Medico/a de Guardia Urgencias',
                'area_usuaria': 'Servicio de Urgencias',
                'descripcion': 'Atencion medica de urgencia y emergencia de pacientes adultos y pediatricos en turnos rotativos.',
                'requisitos_minimos': 'Titulo de Medico Cirujano habilitado en Chile (EUNACOM aprobado e inscripcion SIS).',
                'requisitos_deseables': 'Cursos PALS, ACLS, ATLS vigentes.',
                'competencias_clave': 'Resolutividad clinica, Liderazgo en reanimacion, Etica profesional.',
                'funciones_principales': 'Categorizacion Manchester, reanimacion, hospitalizaciones abreviadas.',
                'activo': True
            },
            {
                'nombre': 'Psicologo/a Laboral RRHH',
                'area_usuaria': 'Subdireccion de Gestion y Desarrollo de las Personas',
                'descripcion': 'Liderazgo de procesos de seleccion abreviada, aplicacion de pautas psicolaborales y confeccion de informes para la Directora.',
                'requisitos_minimos': 'Titulo profesional de Psicologo/a con mencion Organizacional o Laboral.',
                'requisitos_deseables': 'Experiencia en seleccion del sector publico de salud (Estatuto Administrativo).',
                'competencias_clave': 'Entrevista por competencias, Rigor metodologico, Juicio imparcial.',
                'funciones_principales': 'Diseno de pautas de evaluacion, coordinacion de comites, confeccion de ternas.',
                'activo': True
            }
        ]

        perfiles_map = {}
        for pdata in perfiles_data:
            nombre = pdata.pop('nombre')
            p, _ = PerfilCargo.objects.get_or_create(nombre=nombre, defaults=pdata)
            perfiles_map[nombre] = p

        # 3. Plantilla de Flujo Estandar normado
        perfil_uci = perfiles_map['Enfermero/a UCI - Servicio Paciente Critico']
        plantilla, _ = PlantillaFlujo.objects.get_or_create(
            perfil_cargo=perfil_uci,
            nombre='Flujo Estandar Abreviado - Hospital Penco Lirquen',
            defaults={
                'descripcion': 'Procedimiento normado de seleccion para reemplazos y contrata en servicios criticos.',
                'version': '1.0',
                'activa': True
            }
        )

        etapas_data = [
            (1, 'Filtro Curricular', 'Revision de antecedentes, certificaciones y requisitos legales.', 30),
            (2, 'Entrevistas Tecnicas', 'Evaluacion de conocimientos y pericia procedimental.', 45),
            (3, 'Evaluacion Psicolaboral', 'Entrevista conductual adaptativa basada en competencias hospitalarias.', 45),
            (4, 'Terna Final e Informe a Directora', 'Consolidacion de puntajes y acta de seleccion comite.', 30),
        ]
        etapas_map = {}
        for orden, nombre, desc, dur in etapas_data:
            e, _ = EtapaProceso.objects.get_or_create(
                plantilla=plantilla,
                orden=orden,
                defaults={'nombre': nombre, 'descripcion': desc, 'duracion_estimada_min': dur}
            )
            etapas_map[nombre] = e

        # 4. Pauta de Abordaje para la Entrevista Psicolaboral
        pauta_psico, _ = PautaAbordaje.objects.get_or_create(
            etapa=etapas_map['Evaluacion Psicolaboral'],
            titulo='Pauta Psicolaboral por Competencias Clinicas',
            defaults={
                'objetivo': 'Evaluar tolerancia al estres, contencion emocional y adaptabilidad al servicio UCI.',
                'criterios_observacion': 'Lenguaje no verbal sereno, estructura logica de relato de incidentes criticos, vocacion de servicio publico.',
                'indicadores_alerta': 'Falta de autocrítica, justificacion de negligencias, labilidad emocional ante preguntas complejas.',
                'tiempos_sugeridos': '45 minutos (5 min encuadre, 30 min incidentes criticos, 10 min cierre).',
                'rubrica': 'Escala 1 (No cumple) a 5 (Sobresaliente). Minimo de aprobacion: 3.5.',
            }
        )

        # 5. Banco de Preguntas y Grafo de Conexion Adaptativa
        q1, _ = Pregunta.objects.get_or_create(
            texto='Relate una situacion critica en UCI donde un paciente se despeno rapidamente y como coordino las primeras acciones de rescate.',
            defaults={
                'competencia': 'Manejo de Crisis y Presion',
                'dificultad': 'media',
                'etapa_sugerida': 'Evaluacion Psicolaboral'
            }
        )
        q1.pautas.add(pauta_psico)

        q2_baja, _ = Pregunta.objects.get_or_create(
            texto='En caso de verse sobrepasado/a emocionalmente por el fallecimiento de un paciente o la reaccion agresiva de un familiar, que mecanismos personales de contencion activa?',
            defaults={
                'competencia': 'Autocuidado y Regulacion Emocional',
                'dificultad': 'alta',
                'etapa_sugerida': 'Evaluacion Psicolaboral',
                'madre': q1
            }
        )
        q2_baja.pautas.add(pauta_psico)

        q2_alta, _ = Pregunta.objects.get_or_create(
            texto='Como aborda un desacuerdo tecnico o etico con el medico de turno respecto al tratamiento de un paciente terminal?',
            defaults={
                'competencia': 'Comunicacion Asertiva y Negociacion',
                'dificultad': 'alta',
                'etapa_sugerida': 'Evaluacion Psicolaboral',
                'madre': q1
            }
        )
        q2_alta.pautas.add(pauta_psico)

        # Conexiones condicionales (Logica adaptativa del flujo de entrevista)
        ConexionPregunta.objects.get_or_create(
            pregunta_origen=q1, pregunta_destino=q2_baja,
            condicion='si_puntaje_bajo', criterio='puntaje < 3.0 (evaluar riesgo de desborde)', prioridad=1
        )
        ConexionPregunta.objects.get_or_create(
            pregunta_origen=q1, pregunta_destino=q2_alta,
            condicion='si_puntaje_alto', criterio='puntaje >= 4.0 (profundizar resolucion etica)', prioridad=1
        )

        # 6. Proceso de Seleccion en curso (Demostracion Realista)
        proceso_activo, _ = ProcesoSeleccion.objects.get_or_create(
            perfil_cargo=perfil_uci,
            area_usuaria='Unidad de Cuidados Intensivos',
            defaults={
                'estado': ProcesoSeleccion.ESTADO_REVISION,
                'responsable': carolina_user,
                'fecha_inicio': date(2026, 10, 1),
                'fecha_cierre': date(2026, 10, 30),
                'observaciones': 'Concurso abreviado para 2 cupos de reemplazo prolongado en turno cuarto turno UCI.',
            }
        )

        # 7. Postulantes de Prueba con casos tipicos de mesa de seleccion
        postulantes_data = [
            {
                'rut': '18.452.981-2',
                'nombres': 'Camila Francisca',
                'apellidos': 'Sepulveda Morales',
                'email': 'camila.sepulveda@gmail.com',
                'telefono': '+56 9 8452 9812',
                'formacion_academica': 'Enfermera Universitaria egresada UdeC (2020). Diplomado Cuidados Intensivos Adulto UCSC.',
                'experiencia': '3 anos en UTI Hospital Las Higueras. Reemplazos de verano en UCI Hospital Traumatologico.',
                'estado_postulacion': Postulacion.ESTADO_EN_REVISION,
                'docs_completos': True,
                'obs': 'Cumple con el 100% de los requisitos curriculares y capacitaciones obligatorias.'
            },
            {
                'rut': '17.654.120-K',
                'nombres': 'Jorge Andres',
                'apellidos': 'Valenzuela Rivas',
                'email': 'jvalenzuela.r@gmail.com',
                'telefono': '+56 9 7654 1200',
                'formacion_academica': 'Enfermero Clinico egresado Universidad San Sebastian (2018).',
                'experiencia': '5 anos en Servicio de Medicina y Cirugia general. 6 meses de apoyo en UCI durante contingencia.',
                'estado_postulacion': Postulacion.ESTADO_PRESELECCIONADA,
                'docs_completos': True,
                'obs': 'Excelente recomendacion de jefatura previa; pendiente entrevista tecnica.'
            },
            {
                'rut': '19.123.456-7',
                'nombres': 'Maria Ignacia',
                'apellidos': 'Paz Carvajal',
                'email': 'mpaz.carvajal@hotmail.com',
                'telefono': '+56 9 9123 4567',
                'formacion_academica': 'Enfermera Recien Titulada Universidad de Concepcion (2025).',
                'experiencia': 'Internado clinico en Atencion Primaria de Salud y Urgencia rural.',
                'estado_postulacion': Postulacion.ESTADO_DESCARTADA,
                'docs_completos': False,
                'obs': 'No acredita el ano minimo de experiencia en paciente critico exigido en bases del cargo.'
            }
        ]

        for pdata in postulantes_data:
            rut = pdata['rut']
            postulante, _ = Postulante.objects.get_or_create(
                rut=rut,
                defaults={
                    'nombres': pdata['nombres'],
                    'apellidos': pdata['apellidos'],
                    'email': pdata['email'],
                    'telefono': pdata['telefono'],
                    'formacion_academica': pdata['formacion_academica'],
                    'experiencia': pdata['experiencia']
                }
            )

            postulacion, _ = Postulacion.objects.get_or_create(
                proceso=proceso_activo,
                postulante=postulante,
                defaults={
                    'estado': pdata['estado_postulacion'],
                    'observaciones': pdata['obs'],
                    'documentos_completos': pdata['docs_completos']
                }
            )

            # Documentos
            DocumentoPostulacion.objects.get_or_create(
                postulacion=postulacion,
                tipo=DocumentoPostulacion.TIPO_CV,
                nombre=f'CV_{postulante.apellidos}_{rut}.pdf',
                defaults={'recibido': True}
            )
            DocumentoPostulacion.objects.get_or_create(
                postulacion=postulacion,
                tipo=DocumentoPostulacion.TIPO_CERTIFICADO,
                nombre=f'Certificado_Titulo_SIS_{rut}.pdf',
                defaults={'recibido': pdata['docs_completos']}
            )

        # 8. Hitos y Auditoria
        HitoProceso.objects.get_or_create(
            proceso=proceso_activo,
            etapa='Revision Curricular',
            defaults={
                'responsable': carolina_user,
                'observacion': 'Comite constituido para revision de 3 postulaciones recepcionadas.',
                'decision': '2 preseleccionados, 1 descartado por bases'
            }
        )

        RegistroAuditoria.objects.get_or_create(
            proceso=proceso_activo,
            usuario=carolina_user,
            accion='APERTURA_PROCESO',
            defaults={
                'detalle': f'Proceso ID {proceso_activo.id} aperturado segun requerimiento de Subdireccion Medica.'
            }
        )

        self.stdout.write(self.style.SUCCESS('Seed Hospital Penco Lirquen cargado exitosamente.'))
        self.stdout.write(self.style.SUCCESS('Base de datos inicializada con perfiles, pautas, preguntas, postulantes y auditoria.'))
