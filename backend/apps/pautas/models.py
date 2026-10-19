from django.db import models


class PlantillaFlujo(models.Model):
    perfil_cargo = models.ForeignKey(
        'seleccion.PerfilCargo', on_delete=models.CASCADE, related_name='plantillas_flujo',
        verbose_name='Perfil de cargo', db_index=True)
    nombre = models.CharField('Nombre de la plantilla', max_length=150, db_index=True)
    descripcion = models.TextField('Descripcion', blank=True)
    version = models.CharField('Version', max_length=20, default='1.0')
    activa = models.BooleanField('Activa', default=True, db_index=True)
    creado_en = models.DateTimeField('Creado en', auto_now_add=True)

    class Meta:
        verbose_name = 'Plantilla de flujo (reglamento)'
        verbose_name_plural = 'Plantillas de flujo (reglamento)'
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} ({self.perfil_cargo})'


class EtapaProceso(models.Model):
    plantilla = models.ForeignKey(
        PlantillaFlujo, on_delete=models.CASCADE, related_name='etapas',
        verbose_name='Plantilla de flujo', db_index=True)
    orden = models.PositiveIntegerField('Orden', default=1, db_index=True)
    nombre = models.CharField('Nombre de la etapa', max_length=120, db_index=True)
    descripcion = models.TextField('Descripcion', blank=True)
    duracion_estimada_min = models.PositiveIntegerField('Duracion estimada (min)', default=0)

    class Meta:
        verbose_name = 'Etapa de proceso'
        verbose_name_plural = 'Etapas de proceso'
        ordering = ['plantilla', 'orden']
        unique_together = [('plantilla', 'orden')]

    def __str__(self):
        return f'{self.orden}. {self.nombre}'


class PautaAbordaje(models.Model):
    etapa = models.ForeignKey(
        EtapaProceso, on_delete=models.CASCADE, related_name='pautas',
        verbose_name='Etapa de proceso', db_index=True)
    titulo = models.CharField('Titulo', max_length=150, db_index=True)
    objetivo = models.TextField('Objetivo', blank=True)
    criterios_observacion = models.TextField('Criterios de observacion', blank=True)
    indicadores_alerta = models.TextField('Indicadores de alerta', blank=True)
    tiempos_sugeridos = models.CharField('Tiempos sugeridos', max_length=120, blank=True)
    rubrica = models.TextField('Rubrica', blank=True)
    creado_en = models.DateTimeField('Creado en', auto_now_add=True)

    class Meta:
        verbose_name = 'Pauta de abordaje'
        verbose_name_plural = 'Pautas de abordaje'
        ordering = ['etapa', 'titulo']

    def __str__(self):
        return self.titulo


class EvaluacionCandidato(models.Model):
    proceso = models.ForeignKey(
        'seleccion.ProcesoSeleccion', on_delete=models.CASCADE, related_name='evaluaciones',
        verbose_name='Proceso', db_index=True)
    pauta = models.ForeignKey(
        PautaAbordaje, on_delete=models.PROTECT, related_name='evaluaciones',
        verbose_name='Pauta', db_index=True)
    postulacion = models.ForeignKey(
        'seleccion.Postulacion', on_delete=models.CASCADE, related_name='evaluaciones',
        verbose_name='Postulacion', db_index=True)
    evaluador = models.ForeignKey(
        'auth.User', on_delete=models.PROTECT, related_name='evaluaciones_realizadas',
        verbose_name='Psicologo evaluador', db_index=True)
    puntaje = models.DecimalField('Puntaje', max_digits=5, decimal_places=2, null=True, blank=True)
    observaciones = models.TextField('Observaciones', blank=True)
    fecha = models.DateTimeField('Fecha', auto_now_add=True)

    class Meta:
        verbose_name = 'Evaluacion de candidato'
        verbose_name_plural = 'Evaluaciones de candidato'
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.postulacion} - {self.pauta}'
