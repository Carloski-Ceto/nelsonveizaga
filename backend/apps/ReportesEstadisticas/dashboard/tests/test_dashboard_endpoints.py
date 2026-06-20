from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.GestionClinica.citas.models import Cita
from apps.GestionClinica.especialistas.models import Especialista
from apps.GestionClinica.pacientes.models import Paciente
from apps.Usuarios.users.models import Usuario


class DashboardEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Usuario.objects.create_user(
            username='admin.dashboard',
            email='admin.dashboard@mail.com',
            password='R4ndomXa',
            nombres='Admin',
            apellidos='Dashboard',
            tipo_usuario='ADMIN',
            estado='ACTIVO',
        )
        self.client.force_authenticate(user=self.admin)

        especialista_user = Usuario.objects.create_user(
            username='esp.dashboard',
            email='esp.dashboard@mail.com',
            password='R4ndomXa',
            nombres='Andrea',
            apellidos='Medina',
            tipo_usuario='ESPECIALISTA',
            estado='ACTIVO',
        )
        self.especialista = Especialista.objects.create(
            id_usuario=especialista_user,
            especialidad='Oftalmologia',
            registro_profesional='RP-DASH-001',
            activo=True,
        )
        self.paciente = Paciente.objects.create(
            nombres='Luis',
            apellidos='Perez',
            documento_identidad='CI-DASH-001',
            fecha_nacimiento='1990-01-01',
            sexo='M',
            activo=True,
        )

    def _create_cita(self):
        inicio = timezone.now() + timedelta(days=1)
        return Cita.objects.create(
            id_paciente=self.paciente,
            id_especialista=self.especialista,
            fecha_hora_inicio=inicio,
            fecha_hora_fin=inicio + timedelta(minutes=30),
            motivo='Control visual',
            estado='PROGRAMADA',
            registrado_por=self.admin,
        )

    def test_dashboard_summary_returns_400_for_invalid_range(self):
        res = self.client.get('/api/dashboard/summary?date_from=2026-05-10&date_to=2026-05-01')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', res.data)

    def test_dashboard_drilldown_returns_400_for_invalid_page(self):
        self._create_cita()
        res = self.client.get('/api/dashboard/citas-drilldown?page=abc&page_size=10')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', res.data)

    def test_dashboard_drilldown_export_returns_csv_attachment(self):
        cita = self._create_cita()
        date_from = cita.fecha_hora_inicio.date().isoformat()
        date_to = date_from
        res = self.client.get(
            f'/api/dashboard/citas-drilldown/export?date_from={date_from}&date_to={date_to}&estado=PROGRAMADA'
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'text/csv; charset=utf-8')
        self.assertIn('attachment; filename=', res['Content-Disposition'])
        self.assertIn('id_cita,fecha_hora_inicio,estado,motivo,paciente,especialista', res.content.decode('utf-8'))
