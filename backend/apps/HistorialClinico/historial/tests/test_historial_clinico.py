from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.GestionClinica.pacientes.models import Paciente
from apps.GestionClinica.medicos.models import Medico
from apps.GestionClinica.especialistas.models import Especialista
from apps.HistorialClinico.historial.models import HistorialClinico, EstadoHistorial
from apps.GestionClinica.evoluciones.models import EvolucionPaciente
from apps.Usuarios.users.models import Usuario
from apps.bitacora.models import Bitacora, AccionBitacora


class HistorialClinicoTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Crear usuarios
        self.admin = Usuario.objects.create_user(
            username='admin.test',
            email='admin.test@mail.com',
            password='R4ndomXa',
            nombres='Admin',
            apellidos='Test',
            tipo_usuario='ADMIN',
            estado='ACTIVO',
        )
        self.medico_user = Usuario.objects.create_user(
            username='medico.test',
            email='medico.test@mail.com',
            password='R4ndomXa',
            nombres='Medico',
            apellidos='Test',
            tipo_usuario='MEDICO',
            estado='ACTIVO',
        )
        self.especialista_user = Usuario.objects.create_user(
            username='esp.test',
            email='esp.test@mail.com',
            password='R4ndomXa',
            nombres='Especialista',
            apellidos='Test',
            tipo_usuario='ESPECIALISTA',
            estado='ACTIVO',
        )
        self.recepcion_user = Usuario.objects.create_user(
            username='recep.test',
            email='recep.test@mail.com',
            password='R4ndomXa',
            nombres='Recepción',
            apellidos='Test',
            tipo_usuario='ADMINISTRATIVO',
            estado='ACTIVO',
        )

        # Crear perfiles clínicos
        self.medico_profile = Medico.objects.create(
            id_usuario=self.medico_user,
            matricula='MED-TEST-001',
            anios_experiencia=10,
            activo=True,
        )
        self.especialista_profile = Especialista.objects.create(
            id_medico=self.medico_profile,
            especialidad='Oftalmologia',
            registro_profesional='RP-TEST-001',
            activo=True,
        )

        # Crear pacientes
        self.paciente1 = Paciente.objects.create(
            nombres='Carlos',
            apellidos='Perez',
            documento_identidad='CI-111111',
            fecha_nacimiento='1980-05-15',
            sexo='M',
            activo=True,
        )
        self.paciente2 = Paciente.objects.create(
            nombres='Maria',
            apellidos='Gomez',
            documento_identidad='CI-222222',
            fecha_nacimiento='1990-08-20',
            sexo='F',
            activo=True,
        )

    def test_crear_historial_exito(self):
        self.client.force_authenticate(user=self.medico_user)
        url = '/api/historial-clinico'
        data = {'id_paciente': self.paciente1.id_paciente}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['id_paciente'], self.paciente1.id_paciente)
        self.assertEqual(response.data['estado'], 'ACTIVO')
        
        # Verificar bitácora
        log = Bitacora.objects.filter(
            modulo='historial_clinico',
            accion=AccionBitacora.CREAR,
            id_registro_afectado=response.data['id_historial']
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.id_usuario, self.medico_user)

    def test_crear_historial_error_duplicado(self):
        self.client.force_authenticate(user=self.medico_user)
        # Crear primer historial activo
        HistorialClinico.objects.create(
            id_paciente=self.paciente1,
            estado=EstadoHistorial.ACTIVO,
            registrado_por=self.medico_user
        )
        
        url = '/api/historial-clinico'
        data = {'id_paciente': self.paciente1.id_paciente}
        
        response = self.client.post(url, data)
        # Unique constraint unique_historial_activo_por_paciente must return validation error (HTTP 400)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_editar_historial_exito(self):
        self.client.force_authenticate(user=self.medico_user)
        historial = HistorialClinico.objects.create(
            id_paciente=self.paciente1,
            estado=EstadoHistorial.ACTIVO,
            registrado_por=self.medico_user
        )
        
        url = f'/api/historial-clinico/{historial.id_historial}'
        # Cambiar el paciente a paciente2
        data = {'id_paciente': self.paciente2.id_paciente}
        
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id_paciente'], self.paciente2.id_paciente)
        
        # Verificar bitácora
        log = Bitacora.objects.filter(
            modulo='historial_clinico',
            accion=AccionBitacora.EDITAR,
            id_registro_afectado=historial.id_historial
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.id_usuario, self.medico_user)

    def test_eliminar_historial_sin_evoluciones(self):
        self.client.force_authenticate(user=self.medico_user)
        historial = HistorialClinico.objects.create(
            id_paciente=self.paciente1,
            estado=EstadoHistorial.ACTIVO,
            registrado_por=self.medico_user
        )
        
        url = f'/api/historial-clinico/{historial.id_historial}'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar que ya no existe
        self.assertFalse(HistorialClinico.objects.filter(pk=historial.id_historial).exists())
        
        # Verificar bitácora
        log = Bitacora.objects.filter(
            modulo='historial_clinico',
            accion=AccionBitacora.ELIMINAR,
            id_registro_afectado=historial.id_historial
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.id_usuario, self.medico_user)

    def test_eliminar_historial_con_evoluciones_error(self):
        self.client.force_authenticate(user=self.medico_user)
        historial = HistorialClinico.objects.create(
            id_paciente=self.paciente1,
            estado=EstadoHistorial.ACTIVO,
            registrado_por=self.medico_user
        )
        
        # Registrar una evolución para proteger el historial
        EvolucionPaciente.objects.create(
            id_historial=historial,
            id_especialista=self.especialista_profile,
            nota_evolucion='Paciente evoluciona bien.',
            registrado_por=self.medico_user
        )
        
        url = f'/api/historial-clinico/{historial.id_historial}'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        
        # Verificar que el historial sigue existiendo
        self.assertTrue(HistorialClinico.objects.filter(pk=historial.id_historial).exists())

    def test_buscar_historial_por_nombre(self):
        self.client.force_authenticate(user=self.medico_user)
        HistorialClinico.objects.create(
            id_paciente=self.paciente1,
            registrado_por=self.medico_user
        )
        HistorialClinico.objects.create(
            id_paciente=self.paciente2,
            registrado_por=self.medico_user
        )

        response = self.client.get('/api/historial-clinico?search=Carlos')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id_paciente'], self.paciente1.id_paciente)

    def test_buscar_historial_por_id_paciente(self):
        self.client.force_authenticate(user=self.medico_user)
        HistorialClinico.objects.create(
            id_paciente=self.paciente1,
            registrado_por=self.medico_user
        )
        HistorialClinico.objects.create(
            id_paciente=self.paciente2,
            registrado_por=self.medico_user
        )

        response = self.client.get(f'/api/historial-clinico?search={self.paciente1.id_paciente}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id_paciente'], self.paciente1.id_paciente)
