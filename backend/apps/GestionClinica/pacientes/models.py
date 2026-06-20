from django.db import models
from django.utils import timezone


class SexoPaciente(models.TextChoices):
    FEMENINO = 'F', 'Femenino'
    MASCULINO = 'M', 'Masculino'
    OTRO = 'O', 'Otro'


class Paciente(models.Model):
    id_paciente = models.BigAutoField(primary_key=True)
    nombres = models.CharField(max_length=120)
    apellidos = models.CharField(max_length=120)
    documento_identidad = models.CharField(max_length=30, unique=True)
    fecha_nacimiento = models.DateField()
    sexo = models.CharField(max_length=1, choices=SexoPaciente.choices)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(max_length=120, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pacientes'
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'
        ordering = ['apellidos', 'nombres']

    def __str__(self):
        return f'{self.nombres} {self.apellidos} ({self.documento_identidad})'
