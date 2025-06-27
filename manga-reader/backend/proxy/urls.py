from django.urls import path
from .views import GenericProxyView

urlpatterns = [
    path('proxy/', GenericProxyView.as_view(), name='generic-proxy'),
]
