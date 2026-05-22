from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from decouple import config as env_config
import redis as redis_lib


def health_check(request):
    status = {'status': 'ok', 'db': 'ok', 'redis': 'ok'}
    http_status = 200
    try:
        connection.ensure_connection()
    except Exception:
        status['db'] = 'error'
        status['status'] = 'degraded'
        http_status = 503
    redis_url = env_config('REDIS_URL', default='redis://redis:6379/0')
    try:
        r = redis_lib.from_url(redis_url, socket_connect_timeout=2)
        r.ping()
    except Exception:
        status['redis'] = 'error'
        status['status'] = 'degraded'
        http_status = 503
    return JsonResponse(status, status=http_status)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('mecanica.urls')),
    path('api/admin-panel/', include('adminpanel.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
