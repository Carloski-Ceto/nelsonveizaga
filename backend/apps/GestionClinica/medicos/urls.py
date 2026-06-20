from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicoViewSet

router = DefaultRouter(trailing_slash=False)
router.register('medicos', MedicoViewSet, basename='medicos')

urlpatterns = [
    path('', include(router.urls)),
]
