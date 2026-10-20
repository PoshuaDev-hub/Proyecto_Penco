from rest_framework import viewsets
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
