from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import HistorialClinicoViewSet

router = DefaultRouter(trailing_slash=False)
router.register('historial-clinico', HistorialClinicoViewSet, basename='historial-clinico')

urlpatterns = [path('', include(router.urls))]
