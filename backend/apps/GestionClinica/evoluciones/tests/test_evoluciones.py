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


class EvolucionPacienteTests(TestCase):
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

        # 2. Crear perfiles clínicos necesarios
        self.medico_profile = Medico.objects.create(
            id_usuario=self.medico_user,
            matricula='MED-TEST-001',
            anios_experiencia=5,
            activo=True,
        )
        self.especialista_medico_profile = Medico.objects.create(
            id_usuario=self.especialista_user,
            matricula='MED-TEST-002',
            anios_experiencia=10,
            activo=True,
        )
        self.especialista = Especialista.objects.create(
            id_medico=self.especialista_medico_profile,
            especialidad='Cardiologia',
            registro_profesional='RP-TEST-002',
            activo=True,
        )

        # 3. Crear Paciente e Historiales Clínicos (Activo y Archivado)
        self.paciente = Paciente.objects.create(
            nombres='Juan',
            apellidos='Perez',
            documento_identidad='CI-EVO-001',
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
            documento_identidad='CI-EVO-002',
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
    def test_crear_evolucion_exitosa(self):
        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/evoluciones'
        data = {
            'id_especialista': self.especialista.id_especialista,
            'nota_evolucion': 'El paciente muestra una mejoría notable en la presión arterial.',
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nota_evolucion'], data['nota_evolucion'])
        self.assertEqual(response.data['id_especialista'], self.especialista.id_especialista)
        
        # Verificar creación en BD
        evolucion = EvolucionPaciente.objects.get(pk=response.data['id_evolucion'])
        self.assertEqual(evolucion.registrado_por, self.medico_user)
        
        # Verificar bitácora
        log = Bitacora.objects.filter(accion=AccionBitacora.CREAR, modulo='evoluciones').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.id_usuario, self.medico_user)
        self.assertEqual(log.tabla_afectada, 'evoluciones_paciente')
        self.assertEqual(log.id_registro_afectado, evolucion.id_evolucion)

    # --- CAMINOS TRISTES (CREACIÓN) ---
    def test_crear_evolucion_historial_inexistente(self):
        self.client.force_authenticate(user=self.medico_user)
        url = '/api/historial-clinico/999999/evoluciones'
        data = {
            'id_especialista': self.especialista.id_especialista,
            'nota_evolucion': 'Prueba historial inexistente.',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('El historial clínico especificado no existe.', str(response.data))

    def test_crear_evolucion_historial_archivado(self):
        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_archivado.id_historial}/evoluciones'
        data = {
            'id_especialista': self.especialista.id_especialista,
            'nota_evolucion': 'Intento de registro en historial archivado.',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No se pueden registrar o modificar evoluciones en un historial clínico archivado.', str(response.data))

    def test_crear_evolucion_especialista_inactivo(self):
        # Desactivar especialista
        self.especialista.activo = False
        self.especialista.save()

        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/evoluciones'
        data = {
            'id_especialista': self.especialista.id_especialista,
            'nota_evolucion': 'Intento con especialista inactivo.',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('El especialista seleccionado no está activo.', response.data['id_especialista'])

    # --- CONSULTA Y FILTRADO ---
    def test_listar_evoluciones_filtrado_y_orden(self):
        self.client.force_authenticate(user=self.medico_user)
        
        # Crear 2 evoluciones
        ev1 = EvolucionPaciente.objects.create(
            id_historial=self.historial_activo,
            id_especialista=self.especialista,
            nota_evolucion='Evolución 1',
            registrado_por=self.medico_user,
        )
        ev2 = EvolucionPaciente.objects.create(
            id_historial=self.historial_activo,
            id_especialista=self.especialista,
            nota_evolucion='Evolución 2',
            registrado_por=self.medico_user,
        )

        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/evoluciones'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Orden descendente por defecto
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['id_evolucion'], ev2.id_evolucion)
        self.assertEqual(response.data['results'][1]['id_evolucion'], ev1.id_evolucion)

        # Probar filtro por especialista
        response_filtered = self.client.get(f'{url}?id_especialista={self.especialista.id_especialista}')
        self.assertEqual(response_filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_filtered.data['results']), 2)

    def test_listar_evoluciones_scoped_por_historial(self):
        # Crear otra historia clínica activa
        paciente_otro = Paciente.objects.create(
            nombres='Maria',
            apellidos='Lopez',
            documento_identidad='CI-EVO-999',
            fecha_nacimiento='1995-10-10',
            sexo='F',
            activo=True,
        )
        historial_otro = HistorialClinico.objects.create(
            id_paciente=paciente_otro,
            estado=EstadoHistorial.ACTIVO,
            registrado_por=self.admin,
        )

        # Crear evolución para la primera historia
        EvolucionPaciente.objects.create(
            id_historial=self.historial_activo,
            id_especialista=self.especialista,
            nota_evolucion='Evolución Historial 1',
            registrado_por=self.medico_user,
        )

        # Crear evolución para la segunda historia
        EvolucionPaciente.objects.create(
            id_historial=historial_otro,
            id_especialista=self.especialista,
            nota_evolucion='Evolución Historial 2',
            registrado_por=self.medico_user,
        )

        self.client.force_authenticate(user=self.medico_user)
        # Consultar la historia 1
        url_1 = f'/api/historial-clinico/{self.historial_activo.id_historial}/evoluciones'
        response_1 = self.client.get(url_1)
        self.assertEqual(response_1.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_1.data['results']), 1)
        self.assertEqual(response_1.data['results'][0]['nota_evolucion'], 'Evolución Historial 1')

    # --- MODIFICACIÓN Y ELIMINACIÓN ---
    def test_editar_evolucion_exitosa(self):
        ev = EvolucionPaciente.objects.create(
            id_historial=self.historial_activo,
            id_especialista=self.especialista,
            nota_evolucion='Nota inicial',
            registrado_por=self.medico_user,
        )

        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/evoluciones/{ev.id_evolucion}'
        data = {
            'id_especialista': self.especialista.id_especialista,
            'nota_evolucion': 'Nota editada con éxito.',
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nota_evolucion'], 'Nota editada con éxito.')

        # Verificar bitácora
        log = Bitacora.objects.filter(accion=AccionBitacora.EDITAR, modulo='evoluciones').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.id_usuario, self.medico_user)
        self.assertEqual(log.id_registro_afectado, ev.id_evolucion)

    def test_eliminar_evolucion_exitosa(self):
        ev = EvolucionPaciente.objects.create(
            id_historial=self.historial_activo,
            id_especialista=self.especialista,
            nota_evolucion='Nota a eliminar',
            registrado_por=self.medico_user,
        )

        self.client.force_authenticate(user=self.medico_user)
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/evoluciones/{ev.id_evolucion}'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verificar eliminación física
        self.assertFalse(EvolucionPaciente.objects.filter(pk=ev.id_evolucion).exists())

        # Verificar bitácora
        log = Bitacora.objects.filter(accion=AccionBitacora.ELIMINAR, modulo='evoluciones').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.id_usuario, self.medico_user)
        self.assertEqual(log.id_registro_afectado, ev.id_evolucion)

    # --- PERMISOS Y SEGURIDAD (RBAC) ---
    def test_permisos_recepcion_solo_lectura(self):
        ev = EvolucionPaciente.objects.create(
            id_historial=self.historial_activo,
            id_especialista=self.especialista,
            nota_evolucion='Nota para recepcion',
            registrado_por=self.medico_user,
        )

        self.client.force_authenticate(user=self.recepcion_user)
        url_list = f'/api/historial-clinico/{self.historial_activo.id_historial}/evoluciones'
        url_detail = f'{url_list}/{ev.id_evolucion}'

        # Recepción SÍ puede listar
        res_list = self.client.get(url_list)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data['results']), 1)

        # Recepción SÍ puede ver detalle
        res_detail = self.client.get(url_detail)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

        # Recepción NO puede crear
        res_create = self.client.post(url_list, {'id_especialista': self.especialista.id_especialista, 'nota_evolucion': 'No permitido'}, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_403_FORBIDDEN)

        # Recepción NO puede editar
        res_update = self.client.put(url_detail, {'id_especialista': self.especialista.id_especialista, 'nota_evolucion': 'Edit no permitido'}, format='json')
        self.assertEqual(res_update.status_code, status.HTTP_403_FORBIDDEN)

        # Recepción NO puede eliminar
        res_delete = self.client.delete(url_detail)
        self.assertEqual(res_delete.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_autenticado_deniega_acceso(self):
        url = f'/api/historial-clinico/{self.historial_activo.id_historial}/evoluciones'
        
        response_get = self.client.get(url)
        self.assertEqual(response_get.status_code, status.HTTP_401_UNAUTHORIZED)

        response_post = self.client.post(url, {'nota_evolucion': 'Anonimo'}, format='json')
        self.assertEqual(response_post.status_code, status.HTTP_401_UNAUTHORIZED)
