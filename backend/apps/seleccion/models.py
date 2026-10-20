from django.conf import settings
from django.db import models


class PerfilCargo(models.Model):
    nombre = models.CharField('Nombre del cargo', max_length=150, db_index=True)
    area_usuaria = models.CharField('Area usuaria', max_length=150, db_index=True)
    descripcion = models.TextField('Descripcion', blank=True)
    requisitos_minimos = models.TextField('Requisitos minimos', blank=True)
    requisitos_deseables = models.TextField('Requisitos deseables', blank=True)
    competencias_clave = models.TextField('Competencias clave', blank=True)
    funciones_principales = models.TextField('Funciones principales', blank=True)
    activo = models.BooleanField('Activo', default=True, db_index=True)
    creado_en = models.DateTimeField('Creado en', auto_now_add=True)
    actualizado_en = models.DateTimeField('Actualizado en', auto_now=True)

    class Meta:
        verbose_name = 'Perfil de cargo'
        verbose_name_plural = 'Perfiles de cargo'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class ProcesoSeleccion(models.Model):
    ESTADO_SOLICITUD = 'solicitud'
    ESTADO_PERFIL = 'perfil'
    ESTADO_AVISO = 'aviso'
    ESTADO_RECEPCION = 'recepcion'
    ESTADO_REVISION = 'revision_curricular'
    ESTADO_ENTREVISTAS = 'entrevistas_tecnicas'
    ESTADO_PSICO = 'evaluacion_psicolaboral'
    ESTADO_INFORME = 'informe_directora'
    ESTADO_INTEGRACION = 'integracion'

    # 9 Etapas oficiales del DESAFIO_PROYECTO_ABP.pdf (Pag. 3)
    ESTADO_CHOICES = [
        (ESTADO_SOLICITUD,   'Solicitud de Llamado'),
        (ESTADO_PERFIL,      'Perfil del Cargo'),
        (ESTADO_AVISO,       'Aviso de Postulacion'),
        (ESTADO_RECEPCION,   'Recepcion de Antecedentes'),
        (ESTADO_REVISION,    'Revision Curricular en Comite'),
        (ESTADO_ENTREVISTAS, 'Entrevistas Tecnicas'),
        (ESTADO_PSICO,       'Evaluacion Psicolaboral'),
        (ESTADO_INFORME,     'Informe a la Directora'),
        (ESTADO_INTEGRACION, 'Integracion y Cierre'),
    ]

    perfil_cargo = models.ForeignKey(
        PerfilCargo, on_delete=models.PROTECT, related_name='procesos',
        verbose_name='Perfil de cargo', db_index=True)
    area_usuaria = models.CharField('Area usuaria', max_length=150, db_index=True)
    estado = models.CharField('Estado', max_length=40, choices=ESTADO_CHOICES,
                              default=ESTADO_SOLICITUD, db_index=True)
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='procesos_responsable',
        verbose_name='Responsable', null=True, blank=True)
    fecha_inicio = models.DateField('Fecha de inicio', null=True, blank=True)
    fecha_cierre = models.DateField('Fecha de cierre', null=True, blank=True)
    observaciones = models.TextField('Observaciones', blank=True)
    creado_en = models.DateTimeField('Creado en', auto_now_add=True)
    actualizado_en = models.DateTimeField('Actualizado en', auto_now=True)

    class Meta:
        verbose_name = 'Proceso de seleccion'
        verbose_name_plural = 'Procesos de seleccion'
        ordering = ['-creado_en']
        indexes = [models.Index(fields=['estado', 'area_usuaria'])]

    TRANSICIONES = {
        'solicitud': ['perfil'],
        'perfil': ['aviso'],
        'aviso': ['recepcion'],
        'recepcion': ['revision_curricular'],
        'revision_curricular': ['entrevistas_tecnicas'],
        'entrevistas_tecnicas': ['evaluacion_psicolaboral'],
        'evaluacion_psicolaboral': ['informe_directora'],
        'informe_directora': ['integracion'],
        'integracion': ['cerrado'],
        'cerrado': [],
    }

    def puede_transicionar_a(self, nuevo_estado):
        return nuevo_estado in self.TRANSICIONES.get(self.estado, [])

    def transicionar(self, nuevo_estado):
        if not self.puede_transicionar_a(nuevo_estado):
            raise ValueError(f'Transicion invalida: {self.estado} -> {nuevo_estado}')
        self.estado = nuevo_estado
        self.save(update_fields=['estado', 'actualizado_en'])

    def __str__(self):
        return f'{self.perfil_cargo} - {self.get_estado_display()}'


class Postulante(models.Model):
    rut = models.CharField('RUT', max_length=20, unique=True, db_index=True)
    nombres = models.CharField('Nombres', max_length=120)
    apellidos = models.CharField('Apellidos', max_length=120, db_index=True)
    email = models.EmailField('Email', blank=True)
    telefono = models.CharField('Telefono', max_length=40, blank=True)
    formacion_academica = models.TextField('Formacion academica', blank=True)
    experiencia = models.TextField('Experiencia', blank=True)
    creado_en = models.DateTimeField('Creado en', auto_now_add=True)

    class Meta:
        verbose_name = 'Postulante'
        verbose_name_plural = 'Postulantes'
        ordering = ['apellidos', 'nombres']

    def __str__(self):
        return f'{self.nombres} {self.apellidos}'


class Postulacion(models.Model):
    ESTADO_RECIBIDA = 'recibida'
    ESTADO_EN_REVISION = 'en_revision'
    ESTADO_PRESELECCIONADA = 'preseleccionada'
    ESTADO_DESCARTADA = 'descartada'
    ESTADO_APROBADA = 'aprobada'

    ESTADO_CHOICES = [
        (ESTADO_RECIBIDA, 'Recibida'),
        (ESTADO_EN_REVISION, 'En revision'),
        (ESTADO_PRESELECCIONADA, 'Preseleccionada'),
        (ESTADO_DESCARTADA, 'Descartada'),
        (ESTADO_APROBADA, 'Aprobada'),
    ]

    proceso = models.ForeignKey(
        ProcesoSeleccion, on_delete=models.CASCADE, related_name='postulaciones',
        verbose_name='Proceso', db_index=True)
    postulante = models.ForeignKey(
        Postulante, on_delete=models.PROTECT, related_name='postulaciones',
        verbose_name='Postulante', db_index=True)
    fecha_postulacion = models.DateTimeField('Fecha de postulacion', auto_now_add=True)
    estado = models.CharField('Estado', max_length=30, choices=ESTADO_CHOICES,
                             default=ESTADO_RECIBIDA, db_index=True)
    observaciones = models.TextField('Observaciones', blank=True)
    documentos_completos = models.BooleanField('Documentos completos', default=False)

    class Meta:
        verbose_name = 'Postulacion'
        verbose_name_plural = 'Postulaciones'
        ordering = ['-fecha_postulacion']
        unique_together = [('proceso', 'postulante')]

    def __str__(self):
        return f'{self.postulante} - {self.proceso}'


class DocumentoPostulacion(models.Model):
    TIPO_CV = 'cv'
    TIPO_CERTIFICADO = 'certificado'
    TIPO_OTRO = 'otro'
    TIPO_CHOICES = [
        (TIPO_CV, 'Curriculum'),
        (TIPO_CERTIFICADO, 'Certificado'),
        (TIPO_OTRO, 'Otro'),
    ]

    postulacion = models.ForeignKey(
        Postulacion, on_delete=models.CASCADE, related_name='documentos',
        verbose_name='Postulacion', db_index=True)
    tipo = models.CharField('Tipo', max_length=30, choices=TIPO_CHOICES, default=TIPO_OTRO)
    nombre = models.CharField('Nombre', max_length=200)
    archivo = models.FileField('Archivo', upload_to='postulaciones/%Y/%m/', blank=True, null=True)
    recibido = models.BooleanField('Recibido', default=True)
    subido_en = models.DateTimeField('Subido en', auto_now_add=True)

    class Meta:
        verbose_name = 'Documento de postulacion'
        verbose_name_plural = 'Documentos de postulacion'

    def __str__(self):
        return self.nombre


class HitoProceso(models.Model):
    proceso = models.ForeignKey(
        ProcesoSeleccion, on_delete=models.CASCADE, related_name='hitos',
        verbose_name='Proceso', db_index=True)
    etapa = models.CharField('Etapa', max_length=60, db_index=True)
    fecha = models.DateTimeField('Fecha', auto_now_add=True)
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='hitos',
        verbose_name='Responsable', null=True, blank=True)
    observacion = models.TextField('Observacion', blank=True)
    decision = models.CharField('Decision', max_length=60, blank=True)

    class Meta:
        verbose_name = 'Hito de proceso'
        verbose_name_plural = 'Hitos de proceso'
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.proceso} - {self.etapa}'


class RegistroAuditoria(models.Model):
    proceso = models.ForeignKey(
        ProcesoSeleccion, on_delete=models.CASCADE, related_name='auditoria',
        verbose_name='Proceso', null=True, blank=True, db_index=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='auditoria',
        verbose_name='Usuario', null=True, blank=True)
    accion = models.CharField('Accion', max_length=120, db_index=True)
    detalle = models.TextField('Detalle', blank=True)
    fecha = models.DateTimeField('Fecha', auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Registro de auditoria'
        verbose_name_plural = 'Registros de auditoria'
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.accion} - {self.fecha}'
