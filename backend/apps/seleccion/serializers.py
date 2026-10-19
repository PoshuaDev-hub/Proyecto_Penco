from rest_framework import serializers
from .models import (
    PerfilCargo, ProcesoSeleccion, Postulante, Postulacion,
    DocumentoPostulacion, HitoProceso, RegistroAuditoria,
)


class PerfilCargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilCargo
        fields = '__all__'


class ProcesoSeleccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcesoSeleccion
        fields = '__all__'


class PostulanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Postulante
        fields = '__all__'


class PostulacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Postulacion
        fields = '__all__'


class DocumentoPostulacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoPostulacion
        fields = '__all__'


class HitoProcesoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HitoProceso
        fields = '__all__'


class RegistroAuditoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroAuditoria
        fields = '__all__'
