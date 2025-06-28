import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import base64
import binascii
from django.core.cache import cache
from django.http import HttpResponse, StreamingHttpResponse
from urllib.parse import urlparse, urljoin
import logging
import hashlib
from django.conf import settings
import mimetypes

logger = logging.getLogger(__name__)

REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

class GenericProxyView(APIView):
    """
    Enhanced generic proxy with improved security, caching, and error handling.
    """
    ALLOWED_DOMAINS = getattr(settings, 'PROXY_ALLOWED_DOMAINS', [])
    MAX_FILE_SIZE = getattr(settings, 'PROXY_MAX_FILE_SIZE', 50 * 1024 * 1024)  # 50MB
    CACHE_TIMEOUT_JSON = 900  # 15 minutes
    CACHE_TIMEOUT_IMAGES = 3600  # 1 hour
    CACHE_TIMEOUT_OTHER = 1800  # 30 minutes

    def _validate_url(self, url):
        """Enhanced URL validation with domain whitelist support."""
        if not url or url.strip() == '' or url == 'undefined':
            return False, "URL is empty or undefined"

        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return False, "Missing scheme or domain"
            
            if parsed.scheme not in ['http', 'https']:
                return False, "Only HTTP and HTTPS schemes are allowed"
            
            # Optional domain whitelist
            if self.ALLOWED_DOMAINS and parsed.netloc not in self.ALLOWED_DOMAINS:
                return False, f"Domain {parsed.netloc} is not allowed"
                
            return True, "Valid"
        except Exception as e:
            return False, f"Invalid URL format: {str(e)}"

    def _get_cache_key(self, url, request_type='GET'):
        """Generate a consistent cache key."""
        url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
        return f"proxy_{request_type}_{url_hash}"

    def _determine_cache_timeout(self, content_type):
        """Determine cache timeout based on content type."""
        if content_type.startswith('image/'):
            return self.CACHE_TIMEOUT_IMAGES
        elif content_type.startswith('application/json'):
            return self.CACHE_TIMEOUT_JSON
        else:
            return self.CACHE_TIMEOUT_OTHER

    def _stream_response(self, response):
        """Stream large responses to avoid memory issues."""
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                yield chunk

    def get(self, request):
        encoded_url = request.query_params.get('url', None)
        if not encoded_url:
            return Response({"error": "URL parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = base64.urlsafe_b64decode(encoded_url).decode('utf-8')
        except (ValueError, binascii.Error):
            return Response({"error": "Invalid base64 URL"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate URL
        is_valid, error_msg = self._validate_url(url)
        if not is_valid:
            return Response({"error": f"Invalid URL: {error_msg}"}, status=status.HTTP_400_BAD_REQUEST)

        # Check cache
        cache_key = self._get_cache_key(url)
        cached_response = cache.get(cache_key)
        if cached_response:
            logger.info(f"Cache hit for URL: {url}")
            if cached_response['content_type'].startswith('image'):
                return HttpResponse(
                    cached_response['content'], 
                    content_type=cached_response['content_type'],
                    headers={'Cache-Control': 'public, max-age=3600'}
                )
            else:
                return Response(cached_response['content'])

        try:
            # Make request with streaming for large files
            response = requests.get(
                url, 
                headers=REQUEST_HEADERS, 
                timeout=30,
                stream=True
            )
            response.raise_for_status()
            
            content_type = response.headers.get('Content-Type', '').lower()
            content_length = response.headers.get('Content-Length')
            
            # Check file size
            if content_length and int(content_length) > self.MAX_FILE_SIZE:
                return Response(
                    {"error": f"File too large. Maximum size: {self.MAX_FILE_SIZE} bytes"}, 
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                )

            # Handle images
            if content_type.startswith('image/'):
                content = response.content
                if len(content) > self.MAX_FILE_SIZE:
                    return Response(
                        {"error": "Image file too large"}, 
                        status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                    )
                
                cache_timeout = self._determine_cache_timeout(content_type)
                cache.set(cache_key, {
                    'content': content, 
                    'content_type': content_type
                }, timeout=cache_timeout)
                
                return HttpResponse(
                    content, 
                    content_type=content_type,
                    headers={'Cache-Control': f'public, max-age={cache_timeout}'}
                )
            
            # Handle JSON
            elif content_type.startswith('application/json'):
                try:
                    content = response.json()
                    cache_timeout = self._determine_cache_timeout(content_type)
                    cache.set(cache_key, {
                        'content': content, 
                        'content_type': content_type
                    }, timeout=cache_timeout)
                    return Response(content)
                except requests.exceptions.JSONDecodeError:
                    return Response(
                        {"error": "Invalid JSON response from target URL"}, 
                        status=status.HTTP_502_BAD_GATEWAY
                    )
            
            # Handle other content types
            else:
                content = response.content
                if len(content) > self.MAX_FILE_SIZE:
                    # For large files, stream the response
                    response_stream = StreamingHttpResponse(
                        self._stream_response(response),
                        content_type=content_type
                    )
                    return response_stream
                
                cache_timeout = self._determine_cache_timeout(content_type)
                cache.set(cache_key, {
                    'content': content, 
                    'content_type': content_type
                }, timeout=cache_timeout)
                
                return HttpResponse(content, content_type=content_type)

        except requests.exceptions.Timeout:
            logger.error(f"Timeout fetching {url}")
            return Response(
                {"error": "Request timeout"}, 
                status=status.HTTP_408_REQUEST_TIMEOUT
            )
        except requests.exceptions.ConnectionError:
            logger.error(f"Connection error fetching {url}")
            return Response(
                {"error": "Connection error"}, 
                status=status.HTTP_502_BAD_GATEWAY
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error fetching {url}: {e}")
            return Response(
                {"error": f"Failed to fetch content: {str(e)}"}, 
                status=status.HTTP_502_BAD_GATEWAY
            )
        except Exception as e:
            logger.error(f"Unexpected error in proxy for {url}: {e}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MangaMetadataView(APIView):
    """
    Specialized view for fetching manga metadata with enhanced parsing.
    """
    def get(self, request):
        encoded_url = request.query_params.get('url', None)
        if not encoded_url:
            return Response({"error": "URL parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = base64.urlsafe_b64decode(encoded_url).decode('utf-8')
        except (ValueError, binascii.Error):
            return Response({"error": "Invalid base64 URL"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate URL
        proxy_view = GenericProxyView()
        is_valid, error_msg = proxy_view._validate_url(url)
        if not is_valid:
            return Response({"error": f"Invalid URL: {error_msg}"}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"manga_metadata_{hashlib.md5(url.encode('utf-8')).hexdigest()}"
        cached_response = cache.get(cache_key)
        if cached_response:
            return Response(cached_response)

        try:
            response = requests.get(url, headers=REQUEST_HEADERS, timeout=30)
            response.raise_for_status()
            
            try:
                data = response.json()
                # Cache manga metadata for longer (2 hours)
                cache.set(cache_key, data, timeout=7200)
                return Response(data)
            except requests.exceptions.JSONDecodeError:
                return Response(
                    {"error": "Invalid JSON response from manga source"}, 
                    status=status.HTTP_502_BAD_GATEWAY
                )

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching manga metadata from {url}: {e}")
            return Response(
                {"error": f"Failed to fetch manga metadata: {str(e)}"}, 
                status=status.HTTP_502_BAD_GATEWAY
            )


class HealthCheckView(APIView):
    """
    Simple health check endpoint for monitoring.
    """
    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "manga-reader-proxy",
            "cache_backend": str(cache.__class__.__name__)
        })
