from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'sistema': 'Hospital_Penco_IA',
        'version': '1.0.0',
        'entorno': 'desarrollo' if settings.DEBUG else 'produccion',
        'hospital': 'Hospital Penco Lirquen - Servicio de Salud Talcahuano',
        'modulo': 'RRHH - Seleccion Psicolaboral Abreviada'
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.seleccion.urls')),
    path('api/', include('apps.pautas.urls')),
    path('api/', include('apps.preguntas.urls')),
    path('api/health/', health_check, name='health_check'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
