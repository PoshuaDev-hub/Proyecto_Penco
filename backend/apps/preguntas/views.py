from rest_framework import viewsets
from .models import Pregunta, ConexionPregunta
from .serializers import PreguntaSerializer, ConexionPreguntaSerializer


class PreguntaViewSet(viewsets.ModelViewSet):
    queryset = Pregunta.objects.all()
    serializer_class = PreguntaSerializer


class ConexionPreguntaViewSet(viewsets.ModelViewSet):
    queryset = ConexionPregunta.objects.all()
    serializer_class = ConexionPreguntaSerializer
