from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_payment_intent(request):
    import stripe

    api_key = settings.STRIPE_SECRET_KEY
    if not api_key:
        return Response({'error': 'Stripe no configurado en el servidor.'}, status=503)

    stripe.api_key = api_key
    monto_centavos = settings.CITA_PRECIO_CENTAVOS
    moneda = settings.CITA_MONEDA

    try:
        intent = stripe.PaymentIntent.create(
            amount=monto_centavos,
            currency=moneda,
            metadata={'user_id': str(request.user.id)},
        )
    except Exception as exc:
        return Response({'error': f'Error Stripe: {str(exc)}'}, status=502)

    return Response({
        'client_secret': intent.client_secret,
        'payment_intent_id': intent.id,
        'amount': monto_centavos,
        'currency': moneda,
    })
