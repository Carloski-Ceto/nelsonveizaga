"""
apps/users/urls.py
CRUD de usuarios del sistema.

Auth (login, logout, me, tokens, reset) → apps.auth.urls
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import UsuarioViewSet

router = DefaultRouter(trailing_slash=False)
router.register('users', UsuarioViewSet, basename='users')

urlpatterns = [
    path('', include(router.urls)),
]
