from rest_framework import serializers
from .models import Pregunta, ConexionPregunta

class PreguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pregunta
        fields = '__all__'

class ConexionPreguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConexionPregunta
        fields = '__all__'
