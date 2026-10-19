from rest_framework import serializers
from .models import PlantillaFlujo, EtapaProceso, PautaAbordaje, EvaluacionCandidato

class PlantillaFlujoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantillaFlujo
        fields = '__all__'

class EtapaProcesoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtapaProceso
        fields = '__all__'

class PautaAbordajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PautaAbordaje
        fields = '__all__'

class EvaluacionCandidatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionCandidato
        fields = '__all__'
