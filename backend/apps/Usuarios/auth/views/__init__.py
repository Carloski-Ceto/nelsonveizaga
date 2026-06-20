"""
Vistas HTTP de autenticación (submódulos por responsabilidad).
Las rutas se registran en apps.auth.urls.
"""
from .login import LoginView
from .logout import LogoutView
from .password_change import ChangePasswordView
from .password_reset import (
    ResetPasswordConfirmView,
    ResetPasswordVerifyCodeView,
    ResetPasswordView,
)
from .permissions import MePermissionsView
from .profile import MeView
from .security import LoginSeguridadConfigView

__all__ = [
    'ChangePasswordView',
    'LoginSeguridadConfigView',
    'LoginView',
    'LogoutView',
    'MeView',
    'MePermissionsView',
    'ResetPasswordConfirmView',
    'ResetPasswordVerifyCodeView',
    'ResetPasswordView',
]
