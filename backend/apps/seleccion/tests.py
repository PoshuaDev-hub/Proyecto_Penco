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
