from django.urls import path

from .views import crear_payment_intent

urlpatterns = [
    path('pagos/crear-intent', crear_payment_intent, name='pagos-crear-intent'),
]
