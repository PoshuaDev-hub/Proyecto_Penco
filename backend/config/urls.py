from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.seleccion.urls')),
    path('api/', include('apps.pautas.urls')),
    path('api/', include('apps.preguntas.urls')),
    path('api/health/', lambda r: __import__('django.http', fromlist=['JsonResponse']).JsonResponse({'status': 'ok'})),
]
