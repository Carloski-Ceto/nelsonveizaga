from django.urls import path
from .views import EvolucionPacienteViewSet

urlpatterns = [
    path(
        'historial-clinico/<int:historial_id>/evoluciones',
        EvolucionPacienteViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='historial-clinico-evoluciones-list',
    ),
    path(
        'historial-clinico/<int:historial_id>/evoluciones/<int:pk>',
        EvolucionPacienteViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
        name='historial-clinico-evoluciones-detail',
    ),
]
