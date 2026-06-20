from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.GestionClinica.pacientes.models import Paciente
from apps.HistorialClinico.historial.models import HistorialClinico, EstadoHistorial
from apps.GestionClinica.recetas.models import RecetaMedicamento
from apps.Usuarios.users.models import Usuario
from apps.bitacora.models import Bitacora, AccionBitacora


class RecetaMedicamentoTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Crear usuarios de prueba con roles correspondientes
        self.admin = Usuario.objects.create_user(
            username='admin.test',
            email='admin.test@mail.com',
            password='R4ndomXa',
            nombres='Admin',
            apellidos='Test',
            tipo_usuario='ADMIN',
            estado='ACTIVO',
        )
        self.medico = Usuario.objects.create_user(
            username='medico.test',
            email='medico.test@mail.com',
            password='R4ndomXa',
            nombres='Medico',
            apellidos='Test',
            tipo_usuario='MEDICO',
            estado='ACTIVO',
        )
        self.recepcion = Usuario.objects.create_user(
            username='recep.test',
            email='recep.test@mail.com',
            password='R4ndomXa',
            nombres='Recepción',
            apellidos='Test',
            tipo_usuario='ADMINISTRATIVO',
            estado='ACTIVO',
        )

        # 2. Crear Pacientes e Historiales
        self.paciente = Paciente.objects.create(
            nombres='Juan',
            apellidos='Perez',
            documento_identidad='CI-REC-001',
            fecha_nacimiento='1990-01-01',
            sexo='M',
            activo=True,
        )
        self.historial_activo = HistorialClinico.objects.create(
            id_paciente=self.paciente,
            estado=EstadoHistorial.ACTIVO,
            registrado_por=self.admin,
        )

        self.paciente_archivado = Paciente.objects.create(
            nombres='Ana',
            apellidos='Gomez',
            documento_identidad='CI-REC-002',
            fecha_nacimiento='1985-05-15',
            sexo='F',
            activo=True,
        )
        self.historial_archivado = HistorialClinico.objects.create(
            id_paciente=self.paciente_archivado,
            estado=EstadoHistorial.ARCHIVADO,
            motivo_archivo='Paciente dado de alta',
            archivado_por=self.admin,
            fecha_archivo=timezone.now(),
            registrado_por=self.admin,
        )

        # Payload base válido
        self.valid_payload = {
            'medicamentos': [
                {
                    'nombre': 'Lágrimas Artificiales 0.5%',
                    'dosis': '1 gota',
                    'frecuencia': 'cada 4 horas',
                    'duracion': '7 días',
                }
            ],
            'indicaciones': 'Aplicar en ambos ojos.',
        }

    def test_crear_receta_medico_exito(self):
        """Un médico debería poder emitir recetas para un historial clínico activo."""
        self.client.force_authenticate(user=self.medico)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/recetas'
        response = self.client.post(url, self.valid_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RecetaMedicamento.objects.count(), 1)
        
        # Verificar bitácora
        self.assertTrue(
            Bitacora.objects.filter(
                id_usuario=self.medico,
                modulo='recetas',
                accion=AccionBitacora.CREAR
            ).exists()
        )

    def test_crear_receta_recepcion_denegado(self):
        """Un recepcionista (administrativo) no tiene permisos para crear recetas."""
        self.client.force_authenticate(user=self.recepcion)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/recetas'
        response = self.client.post(url, self.valid_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(RecetaMedicamento.objects.count(), 0)

    def test_crear_receta_payload_invalido(self):
        """Fallas de validación si faltan campos requeridos en el listado de medicamentos."""
        self.client.force_authenticate(user=self.medico)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/recetas'
        
        invalid_payload = {
            'medicamentos': [
                {
                    'nombre': 'Paracetamol',
                    'dosis': '',  # Vacío
                    'frecuencia': 'cada 8 horas',
                    'duracion': '3 días'
                }
            ]
        }
        response = self.client.post(url, invalid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_crear_receta_historial_archivado_error(self):
        """No se puede registrar una receta para un historial clínico archivado."""
        self.client.force_authenticate(user=self.medico)
        url = f'/api/historial-clinico/{self.historial_archivado.id_historial}/recetas'
        response = self.client.post(url, self.valid_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No se pueden emitir recetas para un historial clínico archivado', str(response.data))
