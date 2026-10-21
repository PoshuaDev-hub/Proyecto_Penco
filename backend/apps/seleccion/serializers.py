from rest_framework import serializers
from .models import (
    PerfilCargo, ProcesoSeleccion, Postulante, Postulacion,
    DocumentoPostulacion, HitoProceso, RegistroAuditoria,
)


class PerfilCargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilCargo
        fields = '__all__'


class DocumentoPostulacionSerializer(serializers.ModelSerializer):
    tipo_display = serializers.ReadOnlyField(source='get_tipo_display')

    class Meta:
        model = DocumentoPostulacion
        fields = '__all__'


class PostulacionSerializer(serializers.ModelSerializer):
    postulante_nombre = serializers.ReadOnlyField(source='postulante.__str__')
    postulante_rut = serializers.ReadOnlyField(source='postulante.rut')
    postulante_email = serializers.ReadOnlyField(source='postulante.email')
    postulante_telefono = serializers.ReadOnlyField(source='postulante.telefono')
    postulante_experiencia = serializers.ReadOnlyField(source='postulante.experiencia')
    postulante_formacion = serializers.ReadOnlyField(source='postulante.formacion_academica')
    postulante_titulo = serializers.ReadOnlyField(source='postulante.titulo_profesional')
    postulante_sis = serializers.ReadOnlyField(source='postulante.registro_sis')
    postulante_anios_exp = serializers.ReadOnlyField(source='postulante.anios_experiencia')
    proceso_cargo = serializers.ReadOnlyField(source='proceso.perfil_cargo.nombre')
    proceso_area = serializers.ReadOnlyField(source='proceso.area_usuaria')
    estado_display = serializers.ReadOnlyField(source='get_estado_display')
    documentos = DocumentoPostulacionSerializer(many=True, read_only=True)

    class Meta:
        model = Postulacion
        fields = '__all__'


class ProcesoSeleccionSerializer(serializers.ModelSerializer):
    perfil_cargo_nombre = serializers.ReadOnlyField(source='perfil_cargo.nombre')
    estado_display = serializers.ReadOnlyField(source='get_estado_display')
    postulaciones_count = serializers.IntegerField(source='postulaciones.count', read_only=True)

    class Meta:
        model = ProcesoSeleccion
        fields = '__all__'


class PostulanteSerializer(serializers.ModelSerializer):
    postulaciones = PostulacionSerializer(many=True, read_only=True)

    class Meta:
        model = Postulante
        fields = '__all__'


class HitoProcesoSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.ReadOnlyField(source='responsable.get_full_name')

    class Meta:
        model = HitoProceso
        fields = '__all__'


class RegistroAuditoriaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.get_full_name')

    class Meta:
        model = RegistroAuditoria
        fields = '__all__'
