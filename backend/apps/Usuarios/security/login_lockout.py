"""
Bloqueo temporal por intentos fallidos de login (clave = texto de login normalizado).
La duración y el umbral vienen de ConfiguracionLoginSeguridad (editable por ADMIN).
"""
from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import BloqueoIntentoLogin, ConfiguracionLoginSeguridad


def normalize_login_key(raw: str) -> str:
    s = (raw or '').strip()
    if not s:
        return ''
    if '@' in s:
        return s.lower()
    return s


def get_security_config() -> ConfiguracionLoginSeguridad:
    return ConfiguracionLoginSeguridad.get_solo()


def is_locked(login_key: str) -> tuple[bool, int]:
    """Devuelve (bloqueado, segundos_restantes). Si expiró el bloqueo, limpia y devuelve (False, 0)."""
    if not login_key:
        return False, 0
    row = BloqueoIntentoLogin.objects.filter(login_key=login_key).first()
    if not row or not row.bloqueado_hasta:
        return False, 0
    now = timezone.now()
    if row.bloqueado_hasta > now:
        sec = int((row.bloqueado_hasta - now).total_seconds())
        return True, max(sec, 1)
    row.bloqueado_hasta = None
    row.intentos_fallidos = 0
    row.save(update_fields=['bloqueado_hasta', 'intentos_fallidos'])
    return False, 0


def record_failure(login_key: str) -> None:
    if not login_key:
        return
    cfg = get_security_config()
    for _ in range(4):
        try:
            _record_failure_once(login_key, cfg)
            return
        except IntegrityError:
            continue


def _record_failure_once(login_key: str, cfg: ConfiguracionLoginSeguridad) -> None:
    with transaction.atomic():
        row = (
            BloqueoIntentoLogin.objects.select_for_update()
            .filter(login_key=login_key)
            .first()
        )
        now = timezone.now()
        if row is None:
            BloqueoIntentoLogin.objects.create(
                login_key=login_key,
                intentos_fallidos=1,
                bloqueado_hasta=None,
            )
            return
        if row.bloqueado_hasta and row.bloqueado_hasta > now:
            return
        row.intentos_fallidos += 1
        if row.intentos_fallidos >= cfg.max_intentos_fallidos:
            row.bloqueado_hasta = now + timedelta(minutes=cfg.minutos_bloqueo)
            row.intentos_fallidos = 0
        row.save(update_fields=['intentos_fallidos', 'bloqueado_hasta'])


def record_success(login_key: str) -> None:
    if not login_key:
        return
    BloqueoIntentoLogin.objects.filter(login_key=login_key).delete()


def lockout_error_payload(retry_seconds: int) -> dict:
    return {
        'login': [
            'Demasiados intentos fallidos. Espera antes de volver a intentar.',
        ],
        'retry_after_seconds': retry_seconds,
    }
