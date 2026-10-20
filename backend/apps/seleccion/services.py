from django.db import transaction
from .models import ProcesoSeleccion, Postulacion, Postulante


@transaction.atomic
def crear_proceso_con_postulante(perfil_cargo, area_usuaria, responsable, postulante_data, documentos=None):
    proceso = ProcesoSeleccion.objects.create(
        perfil_cargo=perfil_cargo,
        area_usuaria=area_usuaria,
        responsable=responsable,
        estado=ProcesoSeleccion.ESTADO_SOLICITUD,
    )
    postulante, _ = Postulante.objects.get_or_create(
        rut=postulante_data['rut'], defaults=postulante_data)
    postulacion = Postulacion.objects.create(
        proceso=proceso, postulante=postulante)
    return proceso, postulacion
