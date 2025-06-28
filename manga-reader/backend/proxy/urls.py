from django.urls import path
from .views import GenericProxyView, MangaMetadataView, HealthCheckView

urlpatterns = [
    path('proxy/', GenericProxyView.as_view(), name='generic-proxy'),
    path('manga-metadata/', MangaMetadataView.as_view(), name='manga-metadata'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
]
