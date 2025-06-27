import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import base64
import binascii
from django.core.cache import cache
from django.http import HttpResponse
from urllib.parse import urlparse

REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

class GenericProxyView(APIView):
    """
    A generic proxy that fetches content from a URL provided as a base64-encoded parameter.
    It handles both JSON and image content types and uses caching.
    """
    def get(self, request):
        encoded_url = request.query_params.get('url', None)
        if not encoded_url:
            return Response({"error": "URL parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = base64.urlsafe_b64decode(encoded_url).decode('utf-8')
        except (ValueError, binascii.Error):
            return Response({"error": "Invalid base64 URL"}, status=status.HTTP_400_BAD_REQUEST)

        # Additional URL validation
        if not url or url.strip() == '' or url == 'undefined':
            return Response({"error": "Invalid URL: URL is empty or undefined"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate URL format
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return Response({"error": "Invalid URL format: missing scheme or domain"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Invalid URL format: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"generic_proxy_{encoded_url}"
        cached_response = cache.get(cache_key)
        if cached_response:
            # Serve from cache, checking content type
            if cached_response['content_type'].startswith('image'):
                return HttpResponse(cached_response['content'], content_type=cached_response['content_type'])
            else:
                return Response(cached_response['content'])

        try:
            response = requests.get(url, headers=REQUEST_HEADERS, timeout=30)
            response.raise_for_status()
            content_type = response.headers.get('Content-Type', '')

            # First, check if the content-type is explicitly for an image.
            if content_type.startswith('image/'):
                content = response.content
                cache.set(cache_key, {'content': content, 'content_type': content_type}, timeout=3600)
                return HttpResponse(content, content_type=content_type)
            
            # If not an image, try to parse as JSON.
            try:
                content = response.json()
                cache.set(cache_key, {'content': content, 'content_type': 'application/json'}, timeout=900)
                return Response(content)
            except requests.exceptions.JSONDecodeError:
                # If it's not JSON either, it's likely binary content that we should just pass through.
                content = response.content
                cache.set(cache_key, {'content': content, 'content_type': content_type}, timeout=3600)
                return HttpResponse(content, content_type=content_type)

        except requests.exceptions.RequestException as e:
            print(f"Proxy error fetching {url}: {e}")
            return Response({"error": f"Failed to fetch content from the provided URL: {e}"}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            print(f"Unexpected error in proxy for {url}: {e}")
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)