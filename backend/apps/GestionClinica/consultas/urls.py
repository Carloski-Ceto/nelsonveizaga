from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ConsultaMedicaViewSet

router = DefaultRouter(trailing_slash=False)
router.register('consultas-medicas', ConsultaMedicaViewSet, basename='consultas-medicas')

urlpatterns = [
    path('', include(router.urls)),
]
