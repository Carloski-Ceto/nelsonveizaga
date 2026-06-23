from django.test import TestCase

from apps.GestionClinica.consultas.models import ConsultaMedica
from apps.GestionClinica.especialistas.models import Especialista
from apps.GestionClinica.medicos.models import Medico
from apps.GestionClinica.recetas_opticas.models import (
    DetalleRecetaOptica,
    RecetaOptica,
    TipoCorreccionOptica,
    TipoRecetaOptica,
)
from apps.HistorialClinico.historial.models import HistorialClinico
from apps.Usuarios.users.models import EstadoUsuario, TipoUsuario, Usuario
from seeders.seed_cu17_demo import DEMO_DOCUMENTO, run


class SeedCu17DemoTests(TestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            username='admin.seed.cu17',
            email='admin.seed.cu17@example.com',
            password='AdminDemo123',
            nombres='Admin',
            apellidos='CU17',
            tipo_usuario=TipoUsuario.ADMIN,
            estado=EstadoUsuario.ACTIVO,
        )
        especialista_user = Usuario.objects.create_user(
            username='especialista.seed.cu17',
            email='especialista.seed.cu17@example.com',
            password='EspecialistaDemo123',
            nombres='Especialista',
            apellidos='CU17',
            tipo_usuario=TipoUsuario.ESPECIALISTA,
            estado=EstadoUsuario.ACTIVO,
        )
        medico = Medico.objects.create(
            id_usuario=especialista_user,
            matricula='MAT-SEED-CU17',
            anios_experiencia=5,
            activo=True,
        )
        Especialista.objects.create(
            id_medico=medico,
            especialidad='Oftalmologia',
            registro_profesional='REG-SEED-CU17',
            activo=True,
        )

    def test_repetir_seed_reutiliza_consulta_pendiente(self):
        run()
        run()

        consultas = ConsultaMedica.objects.filter(
            id_paciente__documento_identidad=DEMO_DOCUMENTO
        )
        self.assertEqual(consultas.count(), 1)
        self.assertIsNotNone(consultas.get().refraccion_od_esfera)
        self.assertIsNotNone(consultas.get().refraccion_oi_esfera)

    def test_seed_crea_reconsulta_si_la_anterior_ya_tiene_receta(self):
        run()
        consulta = ConsultaMedica.objects.get(
            id_paciente__documento_identidad=DEMO_DOCUMENTO
        )
        historial = HistorialClinico.objects.get(
            id_paciente=consulta.id_paciente,
            estado='ACTIVO',
        )
        receta = RecetaOptica.objects.create(
            id_historial=historial,
            id_consulta=consulta,
            tipo=TipoRecetaOptica.ANTEOJOS,
            registrado_por=self.admin,
        )
        for ojo, esfera, cilindro, eje in (
            ('OD', '-1.25', '-0.50', 90),
            ('OI', '-1.00', '-0.25', 80),
        ):
            DetalleRecetaOptica.objects.create(
                id_receta_optica=receta,
                tipo_correccion=TipoCorreccionOptica.ANTEOJOS,
                ojo=ojo,
                esfera=esfera,
                cilindro=cilindro,
                eje=eje,
                distancia_pupilar_mm='31.5',
            )

        run()

        consultas = ConsultaMedica.objects.filter(
            id_paciente__documento_identidad=DEMO_DOCUMENTO
        )
        self.assertEqual(consultas.count(), 2)
        self.assertEqual(consultas.filter(receta_optica__isnull=True).count(), 1)
