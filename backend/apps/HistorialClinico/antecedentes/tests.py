from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.GestionClinica.pacientes.models import Paciente
from apps.HistorialClinico.historial.models import HistorialClinico, EstadoHistorial
from apps.HistorialClinico.antecedentes.models import AntecedentePaciente, TipoAntecedente
from apps.Usuarios.users.models import Usuario
from apps.bitacora.models import Bitacora, AccionBitacora


class AntecedentePacienteTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Crear usuarios con diferentes roles para pruebas de RBAC
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
        self.recepcion_user = Usuario.objects.create_user(
            username='recep.test',
            email='recep.test@mail.com',
            password='R4ndomXa',
            nombres='Recepción',
            apellidos='Test',
            tipo_usuario='ADMINISTRATIVO',
            estado='ACTIVO',
        )

        # 2. Crear Paciente e Historiales Clínicos (Activo y Archivado)
        self.paciente = Paciente.objects.create(
            nombres='Juan',
            apellidos='Perez',
            documento_identidad='CI-ANT-001',
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
            documento_identidad='CI-ANT-002',
            fecha_nacimiento='1985-05-15',
            sexo='F',
            activo=True,
        )
        self.historial_archivado = HistorialClinico.objects.create(
            id_paciente=self.paciente_archivado,
            estado=EstadoHistorial.ARCHIVADO,
            motivo_archivo='Paciente dado de alta',
            fecha_archivo=timezone.now(),
            archivado_por=self.admin,
            registrado_por=self.admin,
        )

    # --- CAMINO FELIZ (CREACIÓN) ---
    def test_crear_antecedente_exitoso(self):
        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/antecedentes'
        data = {
            'tipo_antecedente': 'ALERGICO',
            'descripcion': 'Alergia severa a la penicilina y mariscos.',
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tipo_antecedente'], data['tipo_antecedente'])
        self.assertEqual(response.data['descripcion'], data['descripcion'])
        self.assertEqual(response.data['registrado_por_nombre'], f"{self.medico_user.nombres} {self.medico_user.apellidos}")
        
        # Verificar creación en BD
        antecedente = AntecedentePaciente.objects.get(pk=response.data['id_antecedente'])
        self.assertEqual(antecedente.registrado_por, self.medico_user)
        
        # Verificar bitácora
        log = Bitacora.objects.filter(accion=AccionBitacora.CREAR, modulo='antecedentes').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.id_usuario, self.medico_user)
        self.assertEqual(log.tabla_afectada, 'antecedentes_paciente')
        self.assertEqual(log.id_registro_afectado, antecedente.id_antecedente)

    # --- CAMINOS TRISTES (CREACIÓN) ---
    def test_crear_antecedente_historial_inexistente(self):
        self.client.force_authenticate(user=self.medico_user)
        url = '/api/historial-clinico/999999/antecedentes'
        data = {
            'tipo_antecedente': 'PATOLOGICO',
            'descripcion': 'Prueba historial inexistente.',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('El historial clínico especificado no existe.', str(response.data))

    def test_crear_antecedente_historial_archivado(self):
        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_archivado.id_historial}/antecedentes'
        data = {
            'tipo_antecedente': 'FAMILIAR',
            'descripcion': 'Diabetes tipo 2 en abuelo materno.',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No se pueden registrar o modificar antecedentes en un historial clínico archivado.', str(response.data))

    def test_crear_antecedente_tipo_invalido(self):
        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/antecedentes'
        data = {
            'tipo_antecedente': 'INVALID_TYPE',
            'descripcion': 'Intento de registro con tipo inválido.',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tipo_antecedente', response.data)

    # --- CONSULTA Y FILTRADO ---
    def test_listar_antecedentes_filtrado_y_orden(self):
        self.client.force_authenticate(user=self.medico_user)
        
        # Crear 2 antecedentes
        ant1 = AntecedentePaciente.objects.create(
            id_historial=self.historial_activo,
            tipo_antecedente='ALERGICO',
            descripcion='Alergia a la penicilina',
            registrado_por=self.medico_user,
        )
        ant2 = AntecedentePaciente.objects.create(
            id_historial=self.historial_activo,
            tipo_antecedente='PATOLOGICO',
            descripcion='Hipertensión arterial',
            registrado_por=self.medico_user,
        )

        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/antecedentes'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Orden descendente por defecto (fecha_creacion)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['id_antecedente'], ant2.id_antecedente)
        self.assertEqual(response.data['results'][1]['id_antecedente'], ant1.id_antecedente)

        # Probar filtro por tipo_antecedente
        response_filtered = self.client.get(f'{url}?tipo_antecedente=ALERGICO')
        self.assertEqual(response_filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_filtered.data['results']), 1)
        self.assertEqual(response_filtered.data['results'][0]['id_antecedente'], ant1.id_antecedente)

    # --- MODIFICACIÓN Y ELIMINACIÓN ---
    def test_editar_antecedente_exitoso(self):
        ant = AntecedentePaciente.objects.create(
            id_historial=self.historial_activo,
            tipo_antecedente='PATOLOGICO',
            descripcion='Miopía leve',
            registrado_por=self.medico_user,
        )

        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/antecedentes/{ant.id_antecedente}'
        data = {
            'tipo_antecedente': 'PATOLOGICO',
            'descripcion': 'Miopía severa con astigmatismo.',
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['descripcion'], 'Miopía severa con astigmatismo.')

        # Verificar bitácora
        log = Bitacora.objects.filter(accion=AccionBitacora.EDITAR, modulo='antecedentes').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.id_usuario, self.medico_user)
        self.assertEqual(log.id_registro_afectado, ant.id_antecedente)

    def test_eliminar_antecedente_exitoso(self):
        ant = AntecedentePaciente.objects.create(
            id_historial=self.historial_activo,
            tipo_antecedente='QUIRURGICO',
            descripcion='Apendicectomía en 2018',
            registrado_por=self.medico_user,
        )

        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/antecedentes/{ant.id_antecedente}'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verificar eliminación física
        self.assertFalse(AntecedentePaciente.objects.filter(pk=ant.id_antecedente).exists())

        # Verificar bitácora
        log = Bitacora.objects.filter(accion=AccionBitacora.ELIMINAR, modulo='antecedentes').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.id_usuario, self.medico_user)
        self.assertEqual(log.id_registro_afectado, ant.id_antecedente)

    # --- PERMISOS Y SEGURIDAD (RBAC) ---
    def test_permisos_recepcion_solo_lectura(self):
        ant = AntecedentePaciente.objects.create(
            id_historial=self.historial_activo,
            tipo_antecedente='NO_PATOLOGICO',
            descripcion='Fumador social',
            registrado_por=self.medico_user,
        )

        self.client.force_authenticate(user=self.recepcion_user)
        url_list = f'/api/historial-clinico/{self.historial_activo.id_historial}/antecedentes'
        url_detail = f'{url_list}/{ant.id_antecedente}'

        # Recepción SÍ puede listar
        res_list = self.client.get(url_list)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data['results']), 1)

        # Recepción SÍ puede ver detalle
        res_detail = self.client.get(url_detail)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

        # Recepción NO puede crear
        res_create = self.client.post(url_list, {'tipo_antecedente': 'ALERGICO', 'descripcion': 'No permitido'}, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_403_FORBIDDEN)

        # Recepción NO puede editar
        res_update = self.client.put(url_detail, {'tipo_antecedente': 'NO_PATOLOGICO', 'descripcion': 'Edit no permitido'}, format='json')
        self.assertEqual(res_update.status_code, status.HTTP_403_FORBIDDEN)

        # Recepción NO puede eliminar
        res_delete = self.client.delete(url_detail)
        self.assertEqual(res_delete.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_autenticado_deniega_acceso(self):
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/antecedentes'
        
        response_get = self.client.get(url)
        self.assertEqual(response_get.status_code, status.HTTP_401_UNAUTHORIZED)

        response_post = self.client.post(url, {'tipo_antecedente': 'PATOLOGICO', 'descripcion': 'Anonimo'}, format='json')
        self.assertEqual(response_post.status_code, status.HTTP_401_UNAUTHORIZED)
