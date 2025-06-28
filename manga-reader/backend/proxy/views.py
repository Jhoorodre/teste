import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import base64
import binascii
from django.core.cache import cache
from django.http import HttpResponse
from urllib.parse import urlparse
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
}

class GenericProxyView(APIView):
    """
    A generic proxy that fetches content from a URL provided as a base64-encoded parameter.
    """
    ALLOWED_DOMAINS = getattr(settings, 'PROXY_ALLOWED_DOMAINS', [])

    def get(self, request):
        encoded_url = request.query_params.get('url', None)
        if not encoded_url:
            return Response({"error": "URL parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = base64.urlsafe_b64decode(encoded_url).decode('utf-8')
        except (ValueError, binascii.Error):
            return Response({"error": "Invalid base64 URL"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed_url = urlparse(url)
            if self.ALLOWED_DOMAINS and parsed_url.netloc not in self.ALLOWED_DOMAINS:
                return Response({"error": "Domain not allowed"}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({"error": "Invalid URL format"}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"generic_proxy_{encoded_url}"
        cached_response = cache.get(cache_key)
        if cached_response:
            logger.info(f"Cache hit for URL: {url}")
            return HttpResponse(cached_response['content'], content_type=cached_response['content_type'])

        try:
            response = requests.get(url, headers=REQUEST_HEADERS, timeout=30)
            response.raise_for_status()
            content_type = response.headers.get('Content-Type', 'application/octet-stream')
            
            content = response.content
            cache.set(cache_key, {'content': content, 'content_type': content_type}, timeout=900)
            
            return HttpResponse(content, content_type=content_type)
        except requests.RequestException as e:
            logger.error(f"Proxy error fetching {url}: {e}")
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

class HealthCheckView(APIView):
    def get(self, request):
        return Response({"status": "healthy"})

