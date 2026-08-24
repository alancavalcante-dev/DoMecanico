from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from decouple import config as env_config
import redis as redis_lib

from core import seo


def health_check(request):
    try:
        connection.ensure_connection()
    except Exception:
        return JsonResponse({'status': 'degraded'}, status=503)
    redis_url = env_config('REDIS_URL', default='redis://redis:6379/0')
    try:
        r = redis_lib.from_url(redis_url, socket_connect_timeout=2)
        r.ping()
    except Exception:
        return JsonResponse({'status': 'degraded'}, status=503)
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('mecanica.urls')),
    path('api/admin-panel/', include('adminpanel.urls')),

    # SEO server-side (dynamic rendering) — o nginx só encaminha robôs para cá.
    path('sitemap.xml', seo.sitemap_xml),
    path('oficina/<slug:slug>/', seo.prerender_oficina),
    path('oficina/<slug:slug>', seo.prerender_oficina),
]

# Serve arquivos de mídia locais (quando NÃO se usa R2/S3), inclusive em produção.
# Se MEDIA_ROOT existir, o storage é local; no R2 esse atributo não é definido.
_media_root = getattr(settings, 'MEDIA_ROOT', None)
if _media_root:
    from django.views.static import serve as _serve_media
    urlpatterns += [re_path(r'^media/(?P<path>.*)$', _serve_media, {'document_root': _media_root})]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all de SEO para robôs (precisa ser o ÚLTIMO padrão para não engolir
# /admin, /api e /media acima). Humanos nunca chegam aqui: o nginx serve a SPA
# e só roteia User-Agents de robôs para o Django.
urlpatterns += [
    re_path(r'^(?P<path>.*)$', seo.prerender_catchall),
]
