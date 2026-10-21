from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from apps.seleccion.models import PerfilCargo, ProcesoSeleccion


class AuthTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('t', password='t')
        self.client = APIClient()

    def test_unauthenticated_blocked(self):
        r = self.client.get('/api/procesos/')
        self.assertEqual(r.status_code, 401)

    def test_authenticated_ok(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.get('/api/procesos/')
        self.assertEqual(r.status_code, 200)


class TransitionTests(TestCase):
    def test_invalid_transition(self):
        perfil = PerfilCargo.objects.create(nombre='X', area_usuaria='Y')
        p = ProcesoSeleccion.objects.create(perfil_cargo=perfil, area_usuaria='Y')
        with self.assertRaises(ValueError):
            p.transicionar('cerrado')


class AuditAppendOnlyTests(TestCase):
    def test_audit_no_delete(self):
        from apps.seleccion.models import RegistroAuditoria
        a = RegistroAuditoria.objects.create(accion='x')
        self.client = APIClient()
        u = User.objects.create_user('a', password='a')
        self.client.force_authenticate(user=u)
        r = self.client.delete(f'/api/auditoria/{a.id}/')
        self.assertIn(r.status_code, (403, 405, 404))


class PortalPostulanteTests(TestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user('staff', password='password123')
        self.client = APIClient()
        self.perfil = PerfilCargo.objects.create(
            nombre='Enfermero/a UPC',
            area_usuaria='Unidad de Paciente Crítico',
            requisitos_minimos='Título profesional de Enfermería e inscripción SIS'
        )
        self.proceso = ProcesoSeleccion.objects.create(
            perfil_cargo=self.perfil,
            area_usuaria='Unidad de Paciente Crítico'
        )

    def test_generar_invitacion_token(self):
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.post('/api/postulaciones/generar-invitacion/', {
            'rut': '18.452.981-2',
            'proceso_id': self.proceso.id,
            'nombres': 'Valentina Soto',
            'email': 'valentina.soto@hospital.cl'
        }, format='json')

        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('token', data)
        self.assertIn('url_portal', data)
        self.assertEqual(data['rut'], '18.452.981-2')

    def test_portal_acceso_publico_sin_autenticacion(self):
        # 1. Staff genera token
        self.client.force_authenticate(user=self.staff_user)
        res_gen = self.client.post('/api/postulaciones/generar-invitacion/', {
            'rut': '17.321.456-K',
            'proceso_id': self.proceso.id,
        }, format='json')
        token = res_gen.json()['token']

        anon_client = APIClient()

        # 2a. Si no se provee RUT: responde solicitando verificación de identidad por seguridad
        res_sin_rut = anon_client.get(f'/api/portal-postulante/{token}/')
        self.assertEqual(res_sin_rut.status_code, 200)
        self.assertTrue(res_sin_rut.json().get('requiere_verificacion_rut'))

        # 2b. Si se provee un RUT que NO coincide: bloqueo 403 Forbidden
        res_wrong_rut = anon_client.get(f'/api/portal-postulante/{token}/?rut=99.999.999-9')
        self.assertEqual(res_wrong_rut.status_code, 403)
        self.assertTrue(res_wrong_rut.json().get('rut_invalido'))

        # 2c. Con RUT correcto: acceso exitoso a los antecedentes
        res_portal = anon_client.get(f'/api/portal-postulante/{token}/?rut=17.321.456-K')
        self.assertEqual(res_portal.status_code, 200)
        portal_data = res_portal.json()
        self.assertEqual(portal_data['postulante']['rut'], '17.321.456-K')
        self.assertTrue(portal_data['puede_editar'])

    def test_portal_postulante_guardar_y_enviar_bloquea_edicion(self):
        self.client.force_authenticate(user=self.staff_user)
        res_gen = self.client.post('/api/postulaciones/generar-invitacion/', {
            'rut': '19.876.543-2',
            'proceso_id': self.proceso.id,
        }, format='json')
        token = res_gen.json()['token']

        # Postulante completa y envía su postulación con RUT verificado
        anon_client = APIClient()
        res_submit = anon_client.post(f'/api/portal-postulante/{token}/', {
            'rut': '19.876.543-2',
            'nombres': 'Carlos',
            'apellidos': 'Gómez Parra',
            'email': 'carlos.gomez@correo.cl',
            'telefono': '+56 9 7654 3210',
            'titulo_profesional': 'Médico Cirujano',
            'registro_sis': 'SIS-8921-MC',
            'anios_experiencia': 4,
            'declaracion_jurada': True,
            'accion': 'enviar'
        }, format='json')

        self.assertEqual(res_submit.status_code, 200)
        self.assertTrue(res_submit.json()['enviado'])

        # Al volver a consultar con su RUT, debe reflejar que fue enviado y que la edición está bloqueada
        res_portal2 = anon_client.get(f'/api/portal-postulante/{token}/?rut=19.876.543-2')
        data2 = res_portal2.json()
        self.assertFalse(data2['puede_editar'])
        self.assertIsNotNone(data2['postulacion']['fecha_envio'])

    def test_comision_actualiza_estado_y_reactiva_subsanacion(self):
        self.client.force_authenticate(user=self.staff_user)
        res_gen = self.client.post('/api/postulaciones/generar-invitacion/', {
            'rut': '16.543.210-9',
            'proceso_id': self.proceso.id,
        }, format='json')
        post_id = res_gen.json()['postulacion_id']
        token = res_gen.json()['token']

        # Comisión actualiza estado y solicita subsanación
        res_comision = self.client.post(f'/api/postulaciones/{post_id}/actualizar-estado-comision/', {
            'estado': 'subsanacion',
            'etapa_actual': 'revision_curricular',
            'observacion_postulante': 'Adjuntar certificado de Superintendencia de Salud actualizado.',
            'subsanacion_solicitada': True
        }, format='json')
        self.assertEqual(res_comision.status_code, 200)

        # Postulante verifica su portal y ve que puede editar nuevamente
        anon_client = APIClient()
        res_portal = anon_client.get(f'/api/portal-postulante/{token}/?rut=16.543.210-9')
        portal_data = res_portal.json()
        self.assertTrue(portal_data['puede_editar'])
        self.assertTrue(portal_data['postulacion']['subsanacion_solicitada'])
        self.assertEqual(
            portal_data['postulacion']['observacion_postulante'],
            'Adjuntar certificado de Superintendencia de Salud actualizado.'
        )

