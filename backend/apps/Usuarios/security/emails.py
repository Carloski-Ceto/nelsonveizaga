"""
Correos transaccionales ligados a cuentas (bienvenida, recuperación de contraseña).
En desarrollo → Mailhog (http://localhost:8025).
"""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger('apps')


def enviar_bienvenida(usuario):
    """Email de bienvenida post-registro. Falla silenciosamente."""
    subject = 'Bienvenido — Clínica de Ojos Norte'
    message = (
        f'Hola {usuario.nombres},\n\n'
        f'Tu cuenta ha sido registrada exitosamente.\n\n'
        f'Usuario: {usuario.username}\n'
        f'Correo:  {usuario.email}\n\n'
        f'Ya puedes acceder al sistema.\n\n'
        f'Clínica de Ojos Norte'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL,
                  [usuario.email], fail_silently=True)
    except Exception as exc:
        logger.warning(f'[email:bienvenida] {usuario.email} — {exc}')


def _ttl_texto_legible(segundos: int) -> str:
    if segundos >= 3600:
        h = segundos // 3600
        resto = segundos % 3600
        if resto >= 60:
            m = resto // 60
            return f'{h} h {m} min'
        return f'{h} h'
    if segundos >= 60:
        m = segundos // 60
        return f'{m} minuto(s)'
    return f'{segundos} segundos'


def enviar_recuperacion_password(usuario, codigo_str):
    """Email con código numérico de un solo uso (vigencia según PASSWORD_RESET_CODE_TTL_SECONDS)."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    ttl = int(getattr(settings, 'PASSWORD_RESET_CODE_TTL_SECONDS', 180) or 180)
    ttl_txt = _ttl_texto_legible(ttl)

    subject = 'Código de recuperación — Clínica de Ojos Norte'
    message = (
        f'Hola {usuario.nombres},\n\n'
        f'Usa este código para continuar con «Olvidé mi contraseña» en el portal:\n\n'
        f'     {codigo_str}\n\n'
        f'Válido {ttl_txt} (aprox. {ttl} s). Tras verificar el código tendrás el mismo tiempo para guardar la nueva contraseña.\n'
        f'Página: {frontend_url}/forgot-password\n\n'
        f'Si no solicitaste este cambio, ignora este mensaje.\n\n'
        f'Clínica de Ojos Norte'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL,
                  [usuario.email], fail_silently=False)
    except Exception as exc:
        logger.error(f'[email:recuperacion] {usuario.email} — {exc}')
        raise
