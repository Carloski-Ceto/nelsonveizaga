from django.urls import path

from .views import RecetaOpticaViewSet


urlpatterns = [
    path(
        'historial-clinico/<int:historial_id>/recetas-opticas',
        RecetaOpticaViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='historial-clinico-recetas-opticas-list',
    ),
    path(
        'historial-clinico/<int:historial_id>/recetas-opticas/<int:pk>',
        RecetaOpticaViewSet.as_view({
            'get': 'retrieve', 'put': 'update', 'patch': 'partial_update',
        }),
        name='historial-clinico-recetas-opticas-detail',
    ),
]
