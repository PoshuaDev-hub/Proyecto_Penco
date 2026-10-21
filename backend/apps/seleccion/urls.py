from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PerfilCargoViewSet, ProcesoSeleccionViewSet, PostulanteViewSet,
    PostulacionViewSet, DocumentoPostulacionViewSet, HitoProcesoViewSet,
    RegistroAuditoriaViewSet, PortalPostulanteView,
)

router = DefaultRouter()
router.register('perfiles-cargo', PerfilCargoViewSet)
router.register('procesos', ProcesoSeleccionViewSet)
router.register('postulantes', PostulanteViewSet)
router.register('postulaciones', PostulacionViewSet)
router.register('documentos', DocumentoPostulacionViewSet)
router.register('hitos', HitoProcesoViewSet)
router.register('auditoria', RegistroAuditoriaViewSet)

urlpatterns = [
    path('portal-postulante/<uuid:token>/', PortalPostulanteView.as_view(), name='portal-postulante'),
    path('', include(router.urls)),
]

