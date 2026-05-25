import time
import logging

logger = logging.getLogger('performance')

SLOW_REQUEST_MS = 500   # loga requisições acima de 500ms
SLOW_QUERY_MS   = 100   # loga queries acima de 100ms


class PerformanceMiddleware:
    """Loga tempo de resposta e queries SQL lentas de cada requisição."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.db import connection, reset_queries
        from django.conf import settings

        debug_sql = settings.DEBUG
        if debug_sql:
            reset_queries()

        t0 = time.monotonic()
        response = self.get_response(request)
        elapsed_ms = (time.monotonic() - t0) * 1000

        status = response.status_code
        method = request.method
        path = request.path

        if debug_sql:
            queries = connection.queries
            slow_queries = [q for q in queries if float(q.get('time', 0)) * 1000 >= SLOW_QUERY_MS]
            if slow_queries:
                for q in slow_queries:
                    logger.warning(
                        'SLOW_QUERY %.0fms %s %s | SQL: %s',
                        float(q['time']) * 1000, method, path,
                        q['sql'][:300],
                    )

        if elapsed_ms >= SLOW_REQUEST_MS:
            n_queries = len(connection.queries) if debug_sql else '?'
            logger.warning(
                'SLOW_REQUEST %.0fms %s %s %s | queries=%s',
                elapsed_ms, status, method, path, n_queries,
            )
        else:
            logger.debug('%.0fms %s %s %s', elapsed_ms, status, method, path)

        return response
