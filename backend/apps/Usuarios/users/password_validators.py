import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class AlphanumericComplexityValidator:
    """Valida contraseñas alfanuméricas con complejidad básica."""

    def validate(self, password, user=None):
        if not re.fullmatch(r"[A-Za-z0-9]+", password or ""):
            raise ValidationError(
                _("La contraseña solo puede contener letras y números (sin símbolos ni espacios)."),
                code="password_not_alphanumeric_only",
            )

        if not re.search(r"[A-Z]", password):
            raise ValidationError(
                _("La contraseña debe incluir al menos una letra mayúscula."),
                code="password_no_upper",
            )

        if not re.search(r"[a-z]", password):
            raise ValidationError(
                _("La contraseña debe incluir al menos una letra minúscula."),
                code="password_no_lower",
            )

        if not re.search(r"[0-9]", password):
            raise ValidationError(
                _("La contraseña debe incluir al menos un número."),
                code="password_no_digit",
            )

    def get_help_text(self):
        return _(
            "Tu contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula y número, y usar solo letras y números."
        )
