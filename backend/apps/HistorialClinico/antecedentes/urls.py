from django.urls import path
from .views import AntecedentePacienteViewSet

urlpatterns = [
    path(
        'historial-clinico/<int:historial_id>/antecedentes',
        AntecedentePacienteViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='historial-clinico-antecedentes-list',
    ),
    path(
        'historial-clinico/<int:historial_id>/antecedentes/<int:pk>',
        AntecedentePacienteViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
        name='historial-clinico-antecedentes-detail',
    ),
]
