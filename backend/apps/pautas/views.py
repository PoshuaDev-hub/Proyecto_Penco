from rest_framework import viewsets
from .models import PlantillaFlujo, EtapaProceso, PautaAbordaje, EvaluacionCandidato
from .serializers import (
    PlantillaFlujoSerializer, EtapaProcesoSerializer, PautaAbordajeSerializer,
    EvaluacionCandidatoSerializer,
)


class PlantillaFlujoViewSet(viewsets.ModelViewSet):
    queryset = PlantillaFlujo.objects.all()
    serializer_class = PlantillaFlujoSerializer


class EtapaProcesoViewSet(viewsets.ModelViewSet):
    queryset = EtapaProceso.objects.all()
    serializer_class = EtapaProcesoSerializer


class PautaAbordajeViewSet(viewsets.ModelViewSet):
    queryset = PautaAbordaje.objects.all()
    serializer_class = PautaAbordajeSerializer


class EvaluacionCandidatoViewSet(viewsets.ModelViewSet):
    queryset = EvaluacionCandidato.objects.all()
    serializer_class = EvaluacionCandidatoSerializer
