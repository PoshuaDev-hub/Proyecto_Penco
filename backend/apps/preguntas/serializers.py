from rest_framework import serializers
from .models import Pregunta, ConexionPregunta


class PreguntaSerializer(serializers.ModelSerializer):
    hijas_count = serializers.IntegerField(source='hijas.count', read_only=True)
    dificultad_display = serializers.ReadOnlyField(source='get_dificultad_display')

    class Meta:
        model = Pregunta
        fields = '__all__'


class ConexionPreguntaSerializer(serializers.ModelSerializer):
    condicion_display = serializers.ReadOnlyField(source='get_condicion_display')
    origen_texto = serializers.ReadOnlyField(source='pregunta_origen.texto')
    destino_texto = serializers.ReadOnlyField(source='pregunta_destino.texto')

    class Meta:
        model = ConexionPregunta
        fields = '__all__'
