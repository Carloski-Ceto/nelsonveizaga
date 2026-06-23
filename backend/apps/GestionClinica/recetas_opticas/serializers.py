from decimal import Decimal

from django.db import IntegrityError
from rest_framework import serializers

from apps.HistorialClinico.historial.models import EstadoHistorial, HistorialClinico

from .models import DetalleRecetaOptica, Ojo, RecetaOptica, TipoCorreccionOptica, TipoRecetaOptica
from .services import emitir_receta_optica, modificar_receta_optica


class DetalleRecetaOpticaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleRecetaOptica
        fields = [
            'id_detalle_receta_optica', 'tipo_correccion', 'ojo', 'esfera', 'cilindro',
            'eje', 'adicion', 'prisma', 'base_prisma', 'distancia_pupilar_mm',
            'curva_base_mm', 'diametro_mm', 'marca', 'modelo', 'material',
            'modalidad_reemplazo', 'observaciones',
        ]
        read_only_fields = ['id_detalle_receta_optica']

    def validate(self, attrs):
        for campo in (
            'base_prisma', 'marca', 'modelo', 'material', 'modalidad_reemplazo',
            'observaciones',
        ):
            if isinstance(attrs.get(campo), str):
                attrs[campo] = attrs[campo].strip() or None

        esfera = attrs.get('esfera')
        cilindro = attrs.get('cilindro', Decimal('0'))
        eje = attrs.get('eje')
        adicion = attrs.get('adicion')
        prisma = attrs.get('prisma')
        base_prisma = attrs.get('base_prisma')
        tipo = attrs.get('tipo_correccion')
        distancia_pupilar = attrs.get('distancia_pupilar_mm')
        curva_base = attrs.get('curva_base_mm')
        diametro = attrs.get('diametro_mm')
        marca = attrs.get('marca')
        modelo = attrs.get('modelo')
        material = attrs.get('material')
        modalidad_reemplazo = attrs.get('modalidad_reemplazo')

        if esfera is not None and not Decimal('-30') <= esfera <= Decimal('30'):
            raise serializers.ValidationError({'esfera': 'Debe estar entre -30.00 y 30.00.'})
        if not Decimal('-15') <= cilindro <= Decimal('15'):
            raise serializers.ValidationError({'cilindro': 'Debe estar entre -15.00 y 15.00.'})
        if cilindro != 0 and eje is None:
            raise serializers.ValidationError({'eje': 'Es obligatorio cuando el cilindro es distinto de 0.'})
        if eje is not None and not 0 <= eje <= 180:
            raise serializers.ValidationError({'eje': 'Debe estar entre 0 y 180.'})
        if adicion is not None and not Decimal('0') <= adicion <= Decimal('6'):
            raise serializers.ValidationError({'adicion': 'Debe estar entre 0.00 y 6.00.'})
        if prisma is not None and not Decimal('0') < prisma <= Decimal('20'):
            raise serializers.ValidationError({'prisma': 'Debe estar entre 0.01 y 20.00.'})
        if (prisma is None) != (not base_prisma):
            raise serializers.ValidationError({'prisma': 'Prisma y base deben informarse juntos.'})

        if tipo == TipoCorreccionOptica.CONTACTO:
            if curva_base is None or diametro is None or not marca or not modelo:
                raise serializers.ValidationError(
                    'Curva base, diámetro, marca y modelo son obligatorios para lentes de contacto.'
                )
            if not Decimal('6') <= curva_base <= Decimal('10'):
                raise serializers.ValidationError({'curva_base_mm': 'Debe estar entre 6.0 y 10.0 mm.'})
            if not Decimal('10') <= diametro <= Decimal('17'):
                raise serializers.ValidationError({'diametro_mm': 'Debe estar entre 10.0 y 17.0 mm.'})
            if distancia_pupilar is not None:
                raise serializers.ValidationError(
                    {'distancia_pupilar_mm': 'No corresponde a lentes de contacto.'}
                )
            if prisma is not None or base_prisma:
                raise serializers.ValidationError({'prisma': 'No corresponde a lentes de contacto.'})
        else:
            if distancia_pupilar is None:
                raise serializers.ValidationError(
                    {'distancia_pupilar_mm': 'Es obligatoria para la receta de anteojos.'}
                )
            if not Decimal('20') <= distancia_pupilar <= Decimal('45'):
                raise serializers.ValidationError(
                    {'distancia_pupilar_mm': 'La distancia monocular debe estar entre 20.0 y 45.0 mm.'}
                )
            if any((curva_base is not None, diametro is not None, marca, modelo, material, modalidad_reemplazo)):
                raise serializers.ValidationError(
                    'Curva base, diámetro y datos del producto solo corresponden a lentes de contacto.'
                )
        return attrs


class RecetaOpticaSerializer(serializers.ModelSerializer):
    detalles = DetalleRecetaOpticaSerializer(many=True)
    registrado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = RecetaOptica
        fields = [
            'id_receta_optica', 'id_historial', 'id_consulta', 'tipo', 'indicaciones',
            'detalles', 'registrado_por', 'registrado_por_nombre', 'fecha_emision',
        ]
        read_only_fields = [
            'id_receta_optica', 'id_historial', 'registrado_por', 'registrado_por_nombre',
            'fecha_emision',
        ]

    def get_registrado_por_nombre(self, obj):
        return obj.registrado_por.get_full_name() or obj.registrado_por.username

    def validate(self, attrs):
        historial_id = self.context['view'].kwargs.get('historial_id')
        try:
            historial = HistorialClinico.objects.select_related('id_paciente').get(pk=historial_id)
        except HistorialClinico.DoesNotExist:
            raise serializers.ValidationError({'id_historial': 'El historial clínico no existe.'})
        if historial.estado != EstadoHistorial.ACTIVO:
            raise serializers.ValidationError({'id_historial': 'El historial clínico está archivado.'})

        consulta = attrs.get('id_consulta') or (self.instance.id_consulta if self.instance else None)
        if consulta is None:
            raise serializers.ValidationError({'id_consulta': 'Este campo es obligatorio.'})
        if self.instance and consulta.pk != self.instance.id_consulta_id:
            raise serializers.ValidationError(
                {'id_consulta': 'La consulta vinculada a una receta emitida no puede cambiarse.'}
            )
        if consulta.id_paciente_id != historial.id_paciente_id:
            raise serializers.ValidationError(
                {'id_consulta': 'La consulta y el historial no pertenecen al mismo paciente.'}
            )
        recetas_de_consulta = RecetaOptica.objects.filter(id_consulta=consulta)
        if self.instance:
            recetas_de_consulta = recetas_de_consulta.exclude(pk=self.instance.pk)
        if recetas_de_consulta.exists():
            raise serializers.ValidationError(
                {'id_consulta': 'Esta consulta ya tiene una receta óptica emitida.'}
            )

        if consulta.refraccion_od_esfera is None or consulta.refraccion_oi_esfera is None:
            raise serializers.ValidationError(
                {'id_consulta': 'La consulta debe tener el examen de refracción de ambos ojos.'}
            )

        tipo_receta = attrs.get('tipo') or (self.instance.tipo if self.instance else None)
        detalles = attrs.get('detalles')
        if self.instance and tipo_receta != self.instance.tipo and detalles is None:
            raise serializers.ValidationError(
                {'detalles': 'Debes enviar los detalles completos al cambiar el tipo de receta.'}
            )
        if detalles is None:
            attrs['_historial'] = historial
            return attrs

        tipos_requeridos = {
            TipoRecetaOptica.ANTEOJOS: {TipoCorreccionOptica.ANTEOJOS},
            TipoRecetaOptica.CONTACTO: {TipoCorreccionOptica.CONTACTO},
            TipoRecetaOptica.AMBOS: {TipoCorreccionOptica.ANTEOJOS, TipoCorreccionOptica.CONTACTO},
        }[tipo_receta]
        pares = [(detalle['tipo_correccion'], detalle['ojo']) for detalle in detalles]
        esperados = {(tipo_detalle, ojo) for tipo_detalle in tipos_requeridos for ojo in Ojo.values}
        if len(pares) != len(set(pares)):
            raise serializers.ValidationError({'detalles': 'No se puede repetir tipo de corrección y ojo.'})
        if set(pares) != esperados:
            raise serializers.ValidationError(
                {'detalles': 'La receta debe incluir OD y OI para cada tipo seleccionado.'}
            )

        attrs['_historial'] = historial
        return attrs

    def create(self, validated_data):
        detalles = validated_data.pop('detalles')
        historial = validated_data.pop('_historial')
        try:
            receta = emitir_receta_optica(
                historial=historial,
                consulta=validated_data['id_consulta'],
                tipo=validated_data['tipo'],
                detalles=detalles,
                indicaciones=validated_data.get('indicaciones'),
                usuario=self.context['request'].user,
            )
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {'id_consulta': 'Esta consulta ya tiene una receta óptica emitida.'}
            ) from exc
        return RecetaOptica.objects.prefetch_related('detalles').get(pk=receta.pk)

    def update(self, instance, validated_data):
        detalles = validated_data.pop('detalles', None)
        validated_data.pop('_historial', None)
        validated_data.pop('id_consulta', None)
        receta = modificar_receta_optica(
            receta=instance,
            tipo=validated_data.get('tipo', instance.tipo),
            detalles=detalles,
            indicaciones=validated_data.get('indicaciones', instance.indicaciones),
            usuario=self.context['request'].user,
        )
        return RecetaOptica.objects.prefetch_related('detalles').get(pk=receta.pk)
