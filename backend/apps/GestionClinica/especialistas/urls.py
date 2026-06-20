from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EspecialistaViewSet

router = DefaultRouter(trailing_slash=False)
router.register('especialistas', EspecialistaViewSet, basename='especialistas')

urlpatterns = [
    path('', include(router.urls)),
]
