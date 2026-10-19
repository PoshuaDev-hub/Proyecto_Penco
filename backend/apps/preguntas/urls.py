from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PreguntaViewSet, ConexionPreguntaViewSet

router = DefaultRouter()
router.register('preguntas', PreguntaViewSet)
router.register('conexiones', ConexionPreguntaViewSet)

urlpatterns = [path('', include(router.urls))]
