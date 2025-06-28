# mangareader_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('proxy.urls')),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# proxy/urls.py
from django.urls import path
from .views import GenericProxyView, MangaMetadataView, HealthCheckView

urlpatterns = [
    path('proxy/', GenericProxyView.as_view(), name='generic-proxy'),
    path('manga-metadata/', MangaMetadataView.as_view(), name='manga-metadata'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
]
