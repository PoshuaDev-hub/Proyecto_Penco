from django.core.management.base import BaseCommand
from apps.seleccion.models import PerfilCargo
from apps.pautas.models import PlantillaFlujo, EtapaProceso, PautaAbordaje
from apps.preguntas.models import Pregunta, ConexionPregunta


class Command(BaseCommand):
    help = 'Carga datos semilla del Hospital Penco Lirquen (idempotente).'

    def handle(self, *args, **options):
        perfiles = [
            ('Enfermero/a UCI', 'Unidad de Cuidados Intensivos', 'Enfermeria'),
            ('Administrativo/a', 'Administracion', 'Administracion'),
            ('Medico/a', 'Servicio Clinico', 'Medicina'),
        ]
        objs = {}
        for nombre, area, _ in perfiles:
            p, _ = PerfilCargo.objects.get_or_create(
                nombre=nombre, defaults={'area_usuaria': area, 'activo': True})
            objs[nombre] = p

        # Plantilla para Enfermero UCI
        perfil = objs['Enfermero/a UCI']
        plantilla, _ = PlantillaFlujo.objects.get_or_create(
            perfil_cargo=perfil, nombre='Flujo Estandar Hospital Penco Lirquen',
            defaults={'descripcion': 'Flujo normado de seleccion abreviada.', 'version': '1.0', 'activa': True})

        etapas_data = [
            (1, 'Filtro Curricular', 'Revision de antecedentes y requisitos minimos.', 30),
            (2, 'Entrevista Psicolaboral', 'Evaluacion de competencias conductuales.', 45),
            (3, 'Test Tecnico', 'Evaluacion de conocimientos clinicos.', 60),
            (4, 'Terna Final', 'Consolidacion y decision del comite.', 30),
        ]
        etapas = {}
        for orden, nombre, desc, dur in etapas_data:
            e, _ = EtapaProceso.objects.get_or_create(
                plantilla=plantilla, orden=orden,
                defaults={'nombre': nombre, 'descripcion': desc, 'duracion_estimada_min': dur})
            etapas[nombre] = e

        # Pautas
        pauta_entrevista, _ = PautaAbordaje.objects.get_or_create(
            etapa=etapas['Entrevista Psicolaboral'],
            titulo='Pauta de abordaje - Entrevista Psicolaboral',
            defaults={
                'objetivo': 'Explorar competencias conductuales y motivacion.',
                'criterios_observacion': 'Claridad, empatia, trabajo en equipo.',
                'indicadores_alerta': 'Evasion, contradicciones, agresividad.',
                'tiempos_sugeridos': '45 min',
                'rubrica': '1-5 por competencia.',
            })

        # Preguntas
        q1, _ = Pregunta.objects.get_or_create(
            texto='Describa una situacion de alto estres en UCI y como la manejo.',
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

        self.stdout.write(self.style.SUCCESS('Seed Hospital Penco Lirquen cargado.'))
