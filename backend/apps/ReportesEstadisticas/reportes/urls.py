from django.urls import path

from .views import (
    reporte_citas_por_periodo,
    reporte_citas_por_periodo_export,
    reporte_consultas_por_especialista,
    reporte_consultas_por_especialista_export,
    reporte_pacientes_atendidos,
    reporte_pacientes_atendidos_export,
)

urlpatterns = [
    path('reportes/pacientes-atendidos', reporte_pacientes_atendidos, name='reporte-pacientes-atendidos'),
    path('reportes/pacientes-atendidos/export', reporte_pacientes_atendidos_export, name='reporte-pacientes-atendidos-export'),
    path('reportes/citas-por-periodo', reporte_citas_por_periodo, name='reporte-citas-por-periodo'),
    path('reportes/citas-por-periodo/export', reporte_citas_por_periodo_export, name='reporte-citas-por-periodo-export'),
    path('reportes/consultas-por-especialista', reporte_consultas_por_especialista, name='reporte-consultas-por-especialista'),
    path('reportes/consultas-por-especialista/export', reporte_consultas_por_especialista_export, name='reporte-consultas-por-especialista-export'),
]
