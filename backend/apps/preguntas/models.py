from django.db import models


class Pregunta(models.Model):
    DIFICULTAD_BAJA = 'baja'
    DIFICULTAD_MEDIA = 'media'
    DIFICULTAD_ALTA = 'alta'
    DIFICULTAD_CHOICES = [
        (DIFICULTAD_BAJA, 'Baja'),
        (DIFICULTAD_MEDIA, 'Media'),
        (DIFICULTAD_ALTA, 'Alta'),
    ]

    texto = models.TextField('Texto de la pregunta')
    competencia = models.CharField('Competencia', max_length=120, db_index=True, blank=True)
    dificultad = models.CharField('Dificultad', max_length=10, choices=DIFICULTAD_CHOICES,
                                 default=DIFICULTAD_MEDIA, db_index=True)
    etapa_sugerida = models.CharField('Etapa sugerida', max_length=60, blank=True, db_index=True)
    madre = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='hijas',
        verbose_name='Pregunta madre (profundizacion)', db_index=True)
    pautas = models.ManyToManyField(
        'pautas.PautaAbordaje', blank=True, related_name='preguntas',
        verbose_name='Pautas de abordaje')
    activa = models.BooleanField('Activa', default=True, db_index=True)
    creado_en = models.DateTimeField('Creado en', auto_now_add=True)

    class Meta:
        verbose_name = 'Pregunta'
        verbose_name_plural = 'Preguntas'
        ordering = ['competencia', 'dificultad']

    def __str__(self):
        return self.texto[:80]


class ConexionPregunta(models.Model):
    CONDICION_SIEMPRE = 'siempre'
    CONDICION_SI_BAJO = 'si_puntaje_bajo'
    CONDICION_SI_ALTO = 'si_puntaje_alto'
    CONDICION_RESPUESTA = 'si_respuesta'
    CONDICION_CHOICES = [
        (CONDICION_SIEMPRE, 'Siempre'),
        (CONDICION_SI_BAJO, 'Si puntaje bajo'),
        (CONDICION_SI_ALTO, 'Si puntaje alto'),
        (CONDICION_RESPUESTA, 'Si respuesta especifica'),
    ]

    pregunta_origen = models.ForeignKey(
        Pregunta, on_delete=models.CASCADE, related_name='conexiones_salida',
        verbose_name='Pregunta origen', db_index=True)
    pregunta_destino = models.ForeignKey(
        Pregunta, on_delete=models.CASCADE, related_name='conexiones_entrada',
        verbose_name='Pregunta destino', db_index=True)
    condicion = models.CharField('Condicion', max_length=30, choices=CONDICION_CHOICES,
                                 default=CONDICION_SIEMPRE, db_index=True)
    criterio = models.CharField('Criterio/umbral', max_length=200, blank=True)
    prioridad = models.PositiveIntegerField('Prioridad', default=1)
    creado_en = models.DateTimeField('Creado en', auto_now_add=True)

    class Meta:
        verbose_name = 'Conexion de pregunta'
        verbose_name_plural = 'Conexiones de pregunta'
        ordering = ['pregunta_origen', 'prioridad']
        unique_together = [('pregunta_origen', 'pregunta_destino', 'condicion')]

    def __str__(self):
        return f'{self.pregunta_origen} -> {self.pregunta_destino} ({self.condicion})'
