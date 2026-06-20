from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.GestionClinica.citas.models import Cita
from apps.GestionClinica.especialistas.models import Especialista
from apps.GestionClinica.medicos.models import Medico
from apps.GestionClinica.pacientes.models import Paciente
from apps.Usuarios.users.models import Usuario


class DeletePacienteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Usuario.objects.create_user(
            username='admin.pac',
            email='admin.pac@mail.com',
            password='R4ndomXa',
            nombres='Admin',
            apellidos='Pac',
            tipo_usuario='ADMIN',
            estado='ACTIVO',
        )
        self.client.force_authenticate(user=self.admin)

    def _create_paciente(self, doc='CI-PAC-DEL'):
        return Paciente.objects.create(
            nombres='Paciente',
            apellidos='Demo',
            documento_identidad=doc,
            fecha_nacimiento='1991-01-01',
            sexo='F',
            activo=True,
        )

    def _create_especialista(self):
        u = Usuario.objects.create_user(
            username='esp.pac.test',
            email='esp.pac.test@mail.com',
            password='R4ndomXa',
            nombres='Esp',
            apellidos='Pac',
            tipo_usuario='ESPECIALISTA',
            estado='ACTIVO',
        )
        med = Medico.objects.create(
            id_usuario=u,
            matricula='MED-PAC-DEL',
            anios_experiencia=5,
            activo=True,
        )
        return Especialista.objects.create(
            id_medico=med,
            especialidad='Oftalmologia',
            registro_profesional='RP-PAC-DEL',
            activo=True,
        )

    def test_delete_paciente_without_dependencies(self):
        pac = self._create_paciente('CI-PAC-OK')
        res = self.client.delete(f'/api/pacientes/{pac.id_paciente}')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_paciente_with_citas_returns_409(self):
        pac = self._create_paciente('CI-PAC-409')
        esp = self._create_especialista()
        inicio = timezone.now() + timedelta(days=3)
        Cita.objects.create(
            id_paciente=pac,
            id_especialista=esp,
            fecha_hora_inicio=inicio,
            fecha_hora_fin=inicio + timedelta(minutes=30),
            motivo='Control',
            estado='PROGRAMADA',
            registrado_por=self.admin,
        )

        res = self.client.delete(f'/api/pacientes/{pac.id_paciente}')
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', res.data)
