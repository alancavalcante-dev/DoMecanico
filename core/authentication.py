from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Autentica o usuário pelo cookie httpOnly 'access_token' (usuários de oficina)."""

    def authenticate(self, request):
        token = request.COOKIES.get('access_token')
        if not token:
            return None
        try:
            validated = self.get_validated_token(token)
            return self.get_user(validated), validated
        except Exception:
            return None


class AdminCookieJWTAuthentication(JWTAuthentication):
    """Autentica pelo cookie httpOnly 'admin_access_token' (painel admin interno)."""

    def authenticate(self, request):
        token = request.COOKIES.get('admin_access_token')
        if not token:
            return None
        try:
            validated = self.get_validated_token(token)
            return self.get_user(validated), validated
        except Exception:
            return None
