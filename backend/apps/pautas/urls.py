from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlantillaFlujoViewSet, EtapaProcesoViewSet, PautaAbordajeViewSet, EvaluacionCandidatoViewSet

router = DefaultRouter()
router.register('plantillas-flujo', PlantillaFlujoViewSet)
router.register('etapas', EtapaProcesoViewSet)
router.register('pautas', PautaAbordajeViewSet)
router.register('evaluaciones', EvaluacionCandidatoViewSet)

urlpatterns = [path('', include(router.urls))]
