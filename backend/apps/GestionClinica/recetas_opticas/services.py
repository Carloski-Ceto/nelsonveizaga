from django.db import transaction
from rest_framework.exceptions import PermissionDenied

from .models import DetalleRecetaOptica, RecetaOptica


@transaction.atomic
def emitir_receta_optica(*, historial, consulta, tipo, detalles, indicaciones, usuario):
    """Emite una receta y su snapshot de graduación como una sola operación atómica."""
    if usuario.tipo_usuario not in ('ADMIN', 'ESPECIALISTA'):
        raise PermissionDenied(
            'Solo un médico especialista o un administrador puede emitir recetas ópticas.'
        )
    if (
        usuario.tipo_usuario == 'ESPECIALISTA'
        and consulta.id_especialista.id_medico.id_usuario_id != usuario.pk
    ):
        raise PermissionDenied(
            'El especialista solo puede emitir recetas de las consultas que tiene asignadas.'
        )

    receta = RecetaOptica.objects.create(
        id_historial=historial,
        id_consulta=consulta,
        tipo=tipo,
        indicaciones=indicaciones,
        registrado_por=usuario,
    )
    DetalleRecetaOptica.objects.bulk_create(
        [DetalleRecetaOptica(id_receta_optica=receta, **detalle) for detalle in detalles]
    )
    return receta


@transaction.atomic
def modificar_receta_optica(*, receta, tipo, detalles, indicaciones, usuario):
    """Corrige una receta existente sin crear una nueva emisión."""
    receta = (
        RecetaOptica.objects.select_for_update()
        .select_related('id_consulta__id_especialista__id_medico')
        .get(pk=receta.pk)
    )
    if usuario.tipo_usuario not in ('ADMIN', 'ESPECIALISTA'):
        raise PermissionDenied(
            'Solo un médico especialista o un administrador puede editar recetas ópticas.'
        )
    if (
        usuario.tipo_usuario == 'ESPECIALISTA'
        and receta.id_consulta.id_especialista.id_medico.id_usuario_id != usuario.pk
    ):
        raise PermissionDenied(
            'El especialista solo puede editar recetas de las consultas que tiene asignadas.'
        )

    receta.tipo = tipo
    receta.indicaciones = indicaciones
    receta.save(update_fields=['tipo', 'indicaciones'])
    if detalles is not None:
        receta.detalles.all().delete()
        DetalleRecetaOptica.objects.bulk_create(
            [DetalleRecetaOptica(id_receta_optica=receta, **detalle) for detalle in detalles]
        )
    return receta
