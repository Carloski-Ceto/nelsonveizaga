from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.GestionClinica.citas.models import Cita, EstadoCita
from apps.GestionClinica.consultas.models import ConsultaMedica
from apps.GestionClinica.especialistas.models import Especialista
from apps.GestionClinica.medicos.models import Medico
from apps.GestionClinica.pacientes.models import Paciente
from apps.GestionClinica.recetas_opticas.models import DetalleRecetaOptica, RecetaOptica
from apps.HistorialClinico.historial.models import EstadoHistorial, HistorialClinico
from apps.Usuarios.users.models import Usuario
from apps.bitacora.models import AccionBitacora, Bitacora


class RecetaOpticaTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = self._crear_usuario('admin.opt', 'ADMIN')
        self.especialista_user = self._crear_usuario('especialista.opt', 'ESPECIALISTA')
        self.medico_user = self._crear_usuario('medico.opt', 'MEDICO')
        self.recepcion = self._crear_usuario('recepcion.opt', 'ADMINISTRATIVO')
        medico = Medico.objects.create(
            id_usuario=self.especialista_user,
            matricula='MAT-OPT-001',
            anios_experiencia=5,
        )
        self.especialista = Especialista.objects.create(
            id_medico=medico,
            especialidad='Oftalmología',
            registro_profesional='REG-OPT-001',
        )
        self.paciente = self._crear_paciente('CI-OPT-001')
        self.historial = HistorialClinico.objects.create(
            id_paciente=self.paciente,
            estado=EstadoHistorial.ACTIVO,
            registrado_por=self.admin,
        )
        self.consulta = self._crear_consulta(self.paciente, con_refraccion=True)
        self.url = f'/api/historial-clinico/{self.historial.id_historial}/recetas-opticas'

    def _crear_usuario(self, username, tipo):
        return Usuario.objects.create_user(
            username=username,
            email=f'{username}@mail.com',
            password='R4ndomXa',
            nombres=username,
            apellidos='Prueba',
            tipo_usuario=tipo,
            estado='ACTIVO',
        )

    def _crear_paciente(self, documento):
        return Paciente.objects.create(
            nombres='Paciente',
            apellidos=documento,
            documento_identidad=documento,
            fecha_nacimiento='1990-01-01',
            sexo='F',
            activo=True,
        )

    def _crear_consulta(self, paciente, *, con_refraccion):
        inicio = timezone.now() + timedelta(days=Cita.objects.count() + 1)
        cita = Cita.objects.create(
            id_paciente=paciente,
            id_especialista=self.especialista,
            fecha_hora_inicio=inicio,
            fecha_hora_fin=inicio + timedelta(minutes=30),
            motivo='Evaluación visual',
            estado=EstadoCita.ATENDIDA,
            registrado_por=self.admin,
        )
        return ConsultaMedica.objects.create(
            id_cita=cita,
            id_paciente=paciente,
            id_especialista=self.especialista,
            motivo_consulta='Visión borrosa',
            diagnostico='Miopía',
            refraccion_od_esfera='-1.25' if con_refraccion else None,
            refraccion_od_cilindro='-0.50' if con_refraccion else None,
            refraccion_od_eje=90 if con_refraccion else None,
            refraccion_oi_esfera='-1.00' if con_refraccion else None,
            refraccion_oi_cilindro='0.00' if con_refraccion else None,
            refraccion_oi_eje=None,
            registrado_por=self.especialista_user,
        )

    def _detalle(self, tipo, ojo):
        detalle = {
            'tipo_correccion': tipo,
            'ojo': ojo,
            'esfera': '-1.25' if ojo == 'OD' else '-1.00',
            'cilindro': '-0.50' if ojo == 'OD' else '0.00',
            'eje': 90 if ojo == 'OD' else None,
        }
        if tipo == 'CONTACTO':
            detalle.update({
                'curva_base_mm': '8.6',
                'diametro_mm': '14.2',
                'marca': 'Marca clínica',
                'modelo': 'Modelo mensual',
                'material': 'Silicona hidrogel',
                'modalidad_reemplazo': 'Mensual',
            })
        else:
            detalle['distancia_pupilar_mm'] = '31.5'
        return detalle

    def _payload(self, tipo='ANTEOJOS', consulta=None):
        tipos = ['ANTEOJOS', 'CONTACTO'] if tipo == 'AMBOS' else [tipo]
        return {
            'id_consulta': (consulta or self.consulta).id_consulta,
            'tipo': tipo,
            'indicaciones': 'Usar según indicación médica.',
            'detalles': [
                self._detalle(tipo_detalle, ojo)
                for tipo_detalle in tipos
                for ojo in ('OD', 'OI')
            ],
        }

    def test_especialista_asignado_emite_y_registra_bitacora(self):
        self.client.force_authenticate(self.especialista_user)
        response = self.client.post(self.url, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RecetaOptica.objects.count(), 1)
        self.assertEqual(DetalleRecetaOptica.objects.count(), 2)
        self.assertTrue(Bitacora.objects.filter(
            modulo='recetas_opticas', accion=AccionBitacora.CREAR
        ).exists())

    def test_administrador_puede_emitir_para_pruebas(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.post(self.url, self._payload(), format='json').status_code,
            status.HTTP_201_CREATED,
        )

    def test_medico_no_especialista_no_puede_emitir(self):
        self.client.force_authenticate(self.medico_user)
        self.assertEqual(
            self.client.post(self.url, self._payload(), format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_especialista_no_asignado_no_puede_emitir(self):
        otro = self._crear_usuario('otro.especialista', 'ESPECIALISTA')
        self.client.force_authenticate(otro)
        self.assertEqual(
            self.client.post(self.url, self._payload(), format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_una_receta_puede_incluir_anteojos_y_contacto(self):
        self.client.force_authenticate(self.especialista_user)
        response = self.client.post(self.url, self._payload('AMBOS'), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['detalles']), 4)

    def test_consulta_solo_puede_tener_una_receta(self):
        self.client.force_authenticate(self.especialista_user)
        self.assertEqual(self.client.post(self.url, self._payload(), format='json').status_code, 201)
        response = self.client.post(self.url, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(RecetaOptica.objects.count(), 1)

    def test_reconsulta_crea_nueva_receta_sin_reemplazar_anterior(self):
        self.client.force_authenticate(self.especialista_user)
        self.client.post(self.url, self._payload(), format='json')
        reconsulta = self._crear_consulta(self.paciente, con_refraccion=True)
        response = self.client.post(self.url, self._payload(consulta=reconsulta), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RecetaOptica.objects.filter(id_historial=self.historial).count(), 2)

    def test_requiere_examen_de_refraccion(self):
        consulta = self._crear_consulta(self.paciente, con_refraccion=False)
        self.client.force_authenticate(self.especialista_user)
        response = self.client.post(self.url, self._payload(consulta=consulta), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_consulta_debe_pertenecer_al_paciente_del_historial(self):
        otro_paciente = self._crear_paciente('CI-OPT-002')
        consulta = self._crear_consulta(otro_paciente, con_refraccion=True)
        self.client.force_authenticate(self.especialista_user)
        response = self.client.post(self.url, self._payload(consulta=consulta), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_contacto_requiere_curva_diametro_marca_y_modelo(self):
        payload = self._payload('CONTACTO')
        payload['detalles'][0].pop('marca')
        self.client.force_authenticate(self.especialista_user)
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_recepcion_puede_listar_pero_no_emitir(self):
        self.client.force_authenticate(self.recepcion)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.post(self.url, self._payload(), format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_receta_emitida_puede_editarse_sin_crear_otra(self):
        self.client.force_authenticate(self.especialista_user)
        creada = self.client.post(self.url, self._payload(), format='json')
        detalle_url = f"{self.url}/{creada.data['id_receta_optica']}"
        fecha_emision = creada.data['fecha_emision']
        response = self.client.put(detalle_url, self._payload('AMBOS'), format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['tipo'], 'AMBOS')
        self.assertEqual(response.data['fecha_emision'], fecha_emision)
        self.assertEqual(RecetaOptica.objects.count(), 1)
        self.assertEqual(DetalleRecetaOptica.objects.count(), 4)
        self.assertTrue(Bitacora.objects.filter(
            modulo='recetas_opticas', accion=AccionBitacora.EDITAR
        ).exists())

    def test_edicion_parcial_de_indicaciones_conserva_detalles(self):
        self.client.force_authenticate(self.especialista_user)
        creada = self.client.post(self.url, self._payload(), format='json')
        detalle_url = f"{self.url}/{creada.data['id_receta_optica']}"

        response = self.client.patch(
            detalle_url, {'indicaciones': 'Usar solo para lectura.'}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['indicaciones'], 'Usar solo para lectura.')
        self.assertEqual(len(response.data['detalles']), 2)

    def test_edicion_no_puede_cambiar_la_consulta_original(self):
        self.client.force_authenticate(self.especialista_user)
        creada = self.client.post(self.url, self._payload(), format='json')
        otra_consulta = self._crear_consulta(self.paciente, con_refraccion=True)
        payload = self._payload(consulta=otra_consulta)
        detalle_url = f"{self.url}/{creada.data['id_receta_optica']}"

        response = self.client.put(detalle_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(RecetaOptica.objects.get().id_consulta_id, self.consulta.id_consulta)

    def test_medico_no_especialista_no_puede_editar(self):
        self.client.force_authenticate(self.especialista_user)
        creada = self.client.post(self.url, self._payload(), format='json')
        detalle_url = f"{self.url}/{creada.data['id_receta_optica']}"
        self.client.force_authenticate(self.medico_user)

        response = self.client.patch(detalle_url, {'indicaciones': 'Cambio'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_receta_emitida_no_puede_eliminarse(self):
        self.client.force_authenticate(self.especialista_user)
        creada = self.client.post(self.url, self._payload(), format='json')
        detalle_url = f"{self.url}/{creada.data['id_receta_optica']}"
        self.assertEqual(self.client.delete(detalle_url).status_code, 405)
