from django.contrib import admin
from .models import (
    PerfilCargo, ProcesoSeleccion, Postulante, Postulacion,
    DocumentoPostulacion, HitoProceso, RegistroAuditoria,
)

admin.site.register(PerfilCargo)
admin.site.register(ProcesoSeleccion)
admin.site.register(Postulante)
admin.site.register(Postulacion)
admin.site.register(DocumentoPostulacion)
admin.site.register(HitoProceso)
admin.site.register(RegistroAuditoria)
