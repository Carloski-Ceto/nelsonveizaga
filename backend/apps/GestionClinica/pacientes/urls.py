from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PacienteViewSet

router = DefaultRouter(trailing_slash=False)
router.register('pacientes', PacienteViewSet, basename='pacientes')

urlpatterns = [
    path('', include(router.urls)),
]
