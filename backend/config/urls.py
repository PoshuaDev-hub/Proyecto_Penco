import json
from django.contrib import admin
from django.contrib.auth import authenticate
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt


def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'sistema': 'Hospital_Penco_IA',
        'version': '1.0.0',
        'entorno': 'desarrollo' if settings.DEBUG else 'produccion',
        'hospital': 'Hospital Penco Lirquen - Servicio de Salud Talcahuano',
        'modulo': 'RRHH - Seleccion Psicolaboral Abreviada'
    })


from rest_framework.authtoken.models import Token


@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Metodo no permitido'}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        user = authenticate(request, username=username, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            grupos = list(user.groups.values_list('name', flat=True))
            if user.is_superuser or 'Admin' in grupos or user.username == 'admin':
                rol = 'Administrador General TI'
                rol_code = 'admin'
            elif 'Mesa' in grupos or user.username in ['mesa.entrada', 'mesa', 'maria.jose']:
                rol = 'Mesa de Entradas & Admisión'
                rol_code = 'mesa'
            elif 'Jefatura' in grupos or 'RRHH' in grupos or user.username in ['jefatura', 'carolina.ruiz']:
                rol = 'Jefa de Gestión de Personas'
                rol_code = 'jefatura'
            else:
                rol = 'Mesa de Entradas & Admisión'
                rol_code = 'mesa'

            return JsonResponse({
                'status': 'ok',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'nombre': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'email': user.email,
                    'rol': rol,
                    'roleCode': rol_code,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser
                }
            })
        return JsonResponse({'status': 'error', 'message': 'Credenciales institucionales no validas.'}, status=401)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', api_login, name='api_login'),
    path('api/', include('apps.seleccion.urls')),
    path('api/', include('apps.pautas.urls')),
    path('api/', include('apps.preguntas.urls')),
    path('api/health/', health_check, name='health_check'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
