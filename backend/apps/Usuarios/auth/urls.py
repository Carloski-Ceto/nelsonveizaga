"""
apps/auth/urls.py
Rutas de sesión, tokens JWT (refresh/verify) y seguridad de login.

Roles → apps/roles/urls.py
Usuarios (CRUD) → apps/users/urls.py
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    ChangePasswordView,
    LoginSeguridadConfigView,
    LoginView,
    LogoutView,
    MeView,
    MePermissionsView,
    ResetPasswordConfirmView,
    ResetPasswordVerifyCodeView,
    ResetPasswordView,
)

urlpatterns = [
    path('security/login-config/', LoginSeguridadConfigView.as_view(), name='security-login-config'),
    path('security/login-config', LoginSeguridadConfigView.as_view()),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/login', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/logout', LogoutView.as_view()),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/me', MeView.as_view()),
    path('auth/permissions/', MePermissionsView.as_view(), name='auth-permissions'),
    path('auth/permissions', MePermissionsView.as_view()),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('auth/change-password', ChangePasswordView.as_view()),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('auth/reset-password', ResetPasswordView.as_view()),
    path(
        'auth/reset-password/verify-code/',
        ResetPasswordVerifyCodeView.as_view(),
        name='auth-reset-verify-code',
    ),
    path('auth/reset-password/verify-code', ResetPasswordVerifyCodeView.as_view()),
    path('auth/reset-password/confirm/', ResetPasswordConfirmView.as_view(), name='auth-reset-confirm'),
    path('auth/reset-password/confirm', ResetPasswordConfirmView.as_view()),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/token/refresh', TokenRefreshView.as_view()),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('auth/token/verify', TokenVerifyView.as_view()),
]
