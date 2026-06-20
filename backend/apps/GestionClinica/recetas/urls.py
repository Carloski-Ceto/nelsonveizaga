from django.urls import path
from .views import RecetaMedicamentoViewSet

urlpatterns = [
    path(
        'historial-clinico/<int:historial_id>/recetas',
        RecetaMedicamentoViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='historial-clinico-recetas-list',
    ),
    path(
        'historial-clinico/<int:historial_id>/recetas/<int:pk>',
        RecetaMedicamentoViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
        name='historial-clinico-recetas-detail',
    ),
]
