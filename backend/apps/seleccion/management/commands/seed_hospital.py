from django.contrib.auth.models import User, Group
from django.db import transaction
from apps.seleccion.models import (
    PerfilCargo, ProcesoSeleccion, Postulante, Postulacion, DocumentoPostulacion,
    HitoProceso, RegistroAuditoria,
)
from apps.pautas.models import PlantillaFlujo, EtapaProceso, PautaAbordaje
from apps.preguntas.models import Pregunta, ConexionPregunta


GRUPOS = ['Admin', 'RRHH', 'Psicologo', 'Comite']


@transaction.atomic
def run_seed():
    for g in GRUPOS:
        Group.objects.get_or_create(name=g)

    def get_user(username, email, password, groups, is_staff=False, is_super=False):
        u, created = User.objects.get_or_create(
            username=username, defaults={'email': email, 'is_staff': is_staff, 'is_superuser': is_super})
        if created:
            u.set_password(password)
            u.save()
        for gn in groups:
            u.groups.add(Group.objects.get(name=gn))
        return u

    admin = get_user('admin', 'admin@hospital.cl', 'admin123', ['Admin'], True, True)
    carolina = get_user('carolina.ruiz', 'carolina@hospital.cl', 'rrhh123', ['RRHH'], True)
    maria = get_user('maria.jose', 'maria@hospital.cl', 'rrhh123', ['RRHH'], True)
    psico = get_user('psicologa', 'psico@hospital.cl', 'psico123', ['Psicologo'], True)
    comite = get_user('comite1', 'comite@hospital.cl', 'comite123', ['Comite'])

    perfiles = [
        ('Enfermero/a UCI', 'Unidad de Cuidados Intensivos'),
        ('Administrativo/a', 'Administracion'),
        ('Medico/a', 'Servicio Clinico'),
        ('TENS', 'Atencion Primaria'),
    ]
    perfil_objs = {}
    for nombre, area in perfiles:
        p, _ = PerfilCargo.objects.get_or_create(
            nombre=nombre, defaults={'area_usuaria': area, 'activo': True,
                                     'competencias_clave': 'Trabajo en equipo, comunicacion, manejo del estres'})
        perfil_objs[nombre] = p

    postulantes_data = [
        ('11.111.111-1', 'Ana', 'Perez', 'ana@x.cl'),
        ('22.222.222-2', 'Luis', 'Soto', 'luis@x.cl'),
        ('33.333.333-3', 'Maria', 'Lopez', 'maria@x.cl'),
        ('44.444.444-4', 'Juan', 'Rojas', 'juan@x.cl'),
        ('55.555.555-5', 'Carla', 'Munoz', 'carla@x.cl'),
    ]
    postulantes = []
    for rut, n, a, e in postulantes_data:
        p, _ = Postulante.objects.get_or_create(
            rut=rut, defaults={'nombres': n, 'apellidos': a, 'email': e,
                               'formacion_academica': 'Formacion ficticia', 'experiencia': 'Experiencia ficticia'})
        postulantes.append(p)

    for perfil_nombre in ['Enfermero/a UCI', 'Administrativo/a']:
        perfil = perfil_objs[perfil_nombre]
        plantilla, _ = PlantillaFlujo.objects.get_or_create(
            perfil_cargo=perfil, nombre=f'Flujo Estandar {perfil_nombre}',
            defaults={'descripcion': 'Flujo normado de seleccion abreviada.', 'version': '1.0', 'activa': True})

        etapas_data = [
            (1, 'Filtro Curricular', 'Revision de antecedentes y requisitos minimos.', 30),
            (2, 'Entrevista Psicolaboral', 'Evaluacion de competencias conductuales.', 45),
            (3, 'Test Tecnico', 'Evaluacion de conocimientos tecnicos.', 60),
            (4, 'Terna Final', 'Consolidacion y decision del comite.', 30),
            (5, 'Cerrado', 'Cierre formal del proceso.', 15),
        ]
        etapas = {}
        for orden, nombre, desc, dur in etapas_data:
            e, _ = EtapaProceso.objects.get_or_create(
                plantilla=plantilla, orden=orden,
                defaults={'nombre': nombre, 'descripcion': desc, 'duracion_estimada_min': dur})
            etapas[nombre] = e

        pauta_entrevista, _ = PautaAbordaje.objects.get_or_create(
            etapa=etapas['Entrevista Psicolaboral'],
            titulo=f'Pauta de abordaje - Entrevista Psicolaboral ({perfil_nombre})',
            defaults={
                'objetivo': 'Explorar competencias conductuales y motivacion.',
                'criterios_observacion': 'Claridad, empatia, trabajo en equipo.',
                'indicadores_alerta': 'Evasion, contradicciones, agresividad.',
                'tiempos_sugeridos': '45 min',
                'rubrica': '1-5 por competencia.',
            })

        # Preguntas
        q1, _ = Pregunta.objects.get_or_create(
            texto=f'Describa una situacion de alto estres en {perfil_nombre} y como la manejo.',
            defaults={'competencia': 'Manejo del estres', 'dificultad': 'media',
                      'etapa_sugerida': 'Entrevista Psicolaboral'})
        q1.pautas.add(pauta_entrevista)
        q2, _ = Pregunta.objects.get_or_create(
            texto='Que haria si un familiar de paciente se muestra agresivo?',
            defaults={'competencia': 'Comunicacion', 'dificultad': 'alta',
                      'etapa_sugerida': 'Entrevista Psicolaboral', 'madre': q1})
        q2.pautas.add(pauta_entrevista)
        ConexionPregunta.objects.get_or_create(
            pregunta_origen=q1, pregunta_destino=q2,
            condicion='si_puntaje_bajo', criterio='puntaje < 3', prioridad=1)

        # Proceso
        proceso, _ = ProcesoSeleccion.objects.get_or_create(
            perfil_cargo=perfil, area_usuaria=perfil.area_usuaria if hasattr(perfil, 'area_usuaria') else 'RRHH',
            defaults={'responsable': carolina, 'estado': ProcesoSeleccion.ESTADO_RECEPCION,
                      'observaciones': 'Proceso de demostracion'})
        # fix area_usuaria (PerfilCargo has area_usuaria)
        proceso.area_usuaria = perfil.area_usuaria
        proceso.save(update_fields=['area_usuaria'])

        for i, post in enumerate(postulantes[:3]):
            postulacion, _ = Postulacion.objects.get_or_create(
                proceso=proceso, postulante=post,
                defaults={'estado': 'recibida', 'documentos_completos': (i % 2 == 0)})
            DocumentoPostulacion.objects.get_or_create(
                postulacion=postulacion, nombre='CV', tipo='cv', defaults={'recibido': True})
            HitoProceso.objects.get_or_create(
                proceso=proceso, etapa='recepcion', defaults={'responsable': carolina, 'observacion': 'Postulacion recibida'})
        RegistroAuditoria.objects.get_or_create(
            proceso=proceso, accion='seed', defaults={'usuario': admin, 'detalle': 'Datos semilla cargados'})


from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Carga datos semilla del Hospital Penco Lirquen (idempotente).'

    def handle(self, *args, **options):
        run_seed()
        self.stdout.write(self.style.SUCCESS('Seed Hospital Penco Lirquen cargado.'))
