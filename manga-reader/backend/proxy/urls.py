from django.urls import path
from .views import GenericProxyView, HealthCheckView

urlpatterns = [
    path('proxy/', GenericProxyView.as_view(), name='generic-proxy'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
]
