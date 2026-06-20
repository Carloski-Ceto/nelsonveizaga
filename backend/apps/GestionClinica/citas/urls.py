from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AgendaMedicaViewSet, CitaViewSet, HorarioEspecialistaViewSet

router = DefaultRouter(trailing_slash=False)
router.register('horarios-especialista', HorarioEspecialistaViewSet, basename='horarios-especialista')
router.register('citas', CitaViewSet, basename='citas')
router.register('agenda-medica', AgendaMedicaViewSet, basename='agenda-medica')

urlpatterns = [
    path('', include(router.urls)),
]
