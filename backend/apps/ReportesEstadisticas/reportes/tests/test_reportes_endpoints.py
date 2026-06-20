from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.GestionClinica.citas.models import Cita
from apps.GestionClinica.consultas.models import ConsultaMedica
from apps.GestionClinica.especialistas.models import Especialista
from apps.GestionClinica.pacientes.models import Paciente
from apps.Usuarios.users.models import Usuario


class ReportesEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Usuario.objects.create_user(
            username='admin.reportes',
            email='admin.reportes@mail.com',
            password='R4ndomXa',
            nombres='Admin',
            apellidos='Reportes',
            tipo_usuario='ADMIN',
            estado='ACTIVO',
        )
        self.client.force_authenticate(user=self.admin)

        especialista_user = Usuario.objects.create_user(
            username='esp.reportes',
            email='esp.reportes@mail.com',
            password='R4ndomXa',
            nombres='Andrea',
            apellidos='Medina',
            tipo_usuario='ESPECIALISTA',
            estado='ACTIVO',
        )
        self.especialista = Especialista.objects.create(
            id_usuario=especialista_user,
            especialidad='Oftalmologia',
            registro_profesional='RP-REP-001',
            activo=True,
        )
        self.paciente = Paciente.objects.create(
            nombres='Luis',
            apellidos='Perez',
            documento_identidad='CI-REP-001',
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

    def test_reporte_citas_por_periodo_returns_summary(self):
        cita = self._create_cita()
        date_from = cita.fecha_hora_inicio.date().isoformat()
        date_to = date_from
        res = self.client.get(f'/api/reportes/citas-por-periodo?date_from={date_from}&date_to={date_to}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('summary', res.data)
        self.assertIn('items', res.data)

    def test_reporte_consultas_por_especialista_returns_items(self):
        cita = self._create_cita()
        ConsultaMedica.objects.create(
            id_cita=cita,
            id_paciente=self.paciente,
            id_especialista=self.especialista,
            motivo_consulta='Molestia ocular',
            diagnostico='Diagnostico test',
            registrado_por=self.admin,
        )
        date_from = timezone.localtime(timezone.now() - timedelta(days=1)).date().isoformat()
        date_to = timezone.localtime(timezone.now() + timedelta(days=1)).date().isoformat()
        res = self.client.get(f'/api/reportes/consultas-por-especialista?date_from={date_from}&date_to={date_to}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data.get('items', [])), 1)

    def test_reporte_pacientes_atendidos_returns_items(self):
        cita = self._create_cita()
        ConsultaMedica.objects.create(
            id_cita=cita,
            id_paciente=self.paciente,
            id_especialista=self.especialista,
            motivo_consulta='Control',
            diagnostico='Diagnostico',
            registrado_por=self.admin,
        )
        date_from = timezone.localtime(timezone.now() - timedelta(days=1)).date().isoformat()
        date_to = timezone.localtime(timezone.now() + timedelta(days=1)).date().isoformat()
        res = self.client.get(f'/api/reportes/pacientes-atendidos?date_from={date_from}&date_to={date_to}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data.get('items', [])), 1)
        first_item = res.data['items'][0]
        self.assertIn('primera_atencion', first_item)
        self.assertIn('ultima_atencion', first_item)
        self.assertIn('total_consultas', first_item)

    def test_reporte_export_formats(self):
        cita = self._create_cita()
        ConsultaMedica.objects.create(
            id_cita=cita,
            id_paciente=self.paciente,
            id_especialista=self.especialista,
            motivo_consulta='Control',
            diagnostico='Diagnostico',
            registrado_por=self.admin,
        )
        date_from = timezone.localtime(timezone.now() - timedelta(days=1)).date().isoformat()
        date_to = timezone.localtime(timezone.now() + timedelta(days=1)).date().isoformat()

        csv_res = self.client.get(
            f'/api/reportes/pacientes-atendidos/export?date_from={date_from}&date_to={date_to}&file_format=csv'
        )
        self.assertEqual(csv_res.status_code, status.HTTP_200_OK)
        self.assertEqual(csv_res['Content-Type'], 'text/csv; charset=utf-8')

        xlsx_res = self.client.get(
            f'/api/reportes/pacientes-atendidos/export?date_from={date_from}&date_to={date_to}&file_format=xlsx'
        )
        self.assertEqual(xlsx_res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            xlsx_res['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )

        pdf_res = self.client.get(
            f'/api/reportes/pacientes-atendidos/export?date_from={date_from}&date_to={date_to}&file_format=pdf'
        )
        self.assertEqual(pdf_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pdf_res['Content-Type'], 'application/pdf')
