# Deploy — DoMecânico no VPS (Docker + Nginx)

Instruções para subir o DoMecânico em um VPS Debian/Ubuntu com Docker.

---

## Pré-requisitos no servidor

```bash
# Atualiza pacotes
apt update && apt upgrade -y

# Instala Docker e Docker Compose
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y

# Instala nginx e certbot (SSL)
apt install nginx certbot python3-certbot-nginx -y
```

---

## 1. Clonar o projeto no servidor

```bash
cd /opt
git clone https://github.com/seu-usuario/domecanico.git
cd domecanico
```

Se não usar Git, envie os arquivos via scp:

```bash
# Rodando no seu computador local
scp -r C:/Users/admin.alan/Desktop/DoMecanico root@IP_DO_SERVIDOR:/opt/domecanico
```

---

## 2. Configurar variáveis de ambiente

```bash
cd /opt/domecanico
cp .env.example .env
nano .env
```

Preencha todos os valores de produção:

```env
SECRET_KEY=gere-uma-chave-segura-aqui
DEBUG=False
ALLOWED_HOSTS=domecanico.net,www.domecanico.net

DATABASE_URL=postgres://domecanico:SENHA_FORTE@db:5432/domecanico
REDIS_URL=redis://redis:6379/0

CORS_ALLOWED_ORIGINS=https://domecanico.net,https://www.domecanico.net

R2_ACCESS_KEY_ID=c20f9d50e5972565890cede97733a4ff
R2_SECRET_ACCESS_KEY=d3e6b48fb8a1328adaa93d6de67d3aa416bde3fb4ce23a6c121127d836b8ee74
R2_BUCKET_NAME=domecanico-media
R2_ENDPOINT_URL=https://162f99a521b1a1fb189e3bc6edf65c27.r2.cloudflarestorage.com

EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-aqui
```

> Gere a SECRET_KEY com:
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

---

## 3. Criar o Dockerfile do backend

Crie o arquivo `/opt/domecanico/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "core.wsgi", "--workers", "3", "--bind", "0.0.0.0:8000", "--timeout", "120"]
```

---

## 4. Criar o docker-compose.yml

Crie o arquivo `/opt/domecanico/docker-compose.yml`:

```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: domecanico
      POSTGRES_USER: domecanico
      POSTGRES_PASSWORD: SENHA_FORTE_AQUI
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U domecanico"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data

  backend:
    build: .
    restart: always
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - static_files:/app/staticfiles
    expose:
      - "8000"
    command: >
      sh -c "python manage.py migrate --noinput &&
             gunicorn core.wsgi --workers 3 --bind 0.0.0.0:8000 --timeout 120"

volumes:
  postgres_data:
  redis_data:
  static_files:
```

---

## 5. Build do frontend

Execute no seu computador local antes de enviar ao servidor:

```bash
cd frontend
npm install
npm run build
```

Copie o `dist/` para o servidor:

```bash
scp -r frontend/dist root@IP_DO_SERVIDOR:/opt/domecanico/frontend/dist
```

---

## 6. Configurar nginx

Crie `/etc/nginx/sites-available/domecanico`:

```nginx
server {
    listen 80;
    server_name domecanico.net www.domecanico.net;

    # Frontend React (SPA)
    root /opt/domecanico/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Admin Django
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Arquivos estáticos Django
    location /static/ {
        alias /opt/domecanico/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 20M;
}
```

Ative o site:

```bash
ln -s /etc/nginx/sites-available/domecanico /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 7. Gerar certificado SSL

```bash
certbot --nginx -d domecanico.net -d www.domecanico.net
```

O certbot atualiza o nginx automaticamente com HTTPS e renovação automática.

---

## 8. Subir os containers

```bash
cd /opt/domecanico
docker compose up -d --build
```

Verifique se está rodando:

```bash
docker compose ps
docker compose logs backend
```

---

## 9. Criar superusuário admin

```bash
docker compose exec backend python manage.py createsuperuser
```

---

## Comandos úteis

```bash
# Ver logs em tempo real
docker compose logs -f backend

# Reiniciar somente o backend
docker compose restart backend

# Rodar migrate manualmente
docker compose exec backend python manage.py migrate

# Acessar o shell Django
docker compose exec backend python manage.py shell

# Backup do banco
docker compose exec db pg_dump -U domecanico domecanico > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup.sql | docker compose exec -T db psql -U domecanico domecanico
```

---

## Script de deploy (atualizações futuras)

Crie `/opt/domecanico/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "==> Puxando atualizações..."
git pull origin main

echo "==> Rebuilding backend..."
docker compose build backend

echo "==> Aplicando migrations..."
docker compose run --rm backend python manage.py migrate --noinput

echo "==> Reiniciando serviços..."
docker compose up -d

echo "==> Deploy concluído!"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## DNS

Configure os seguintes registros no painel DNS do domínio:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | IP do servidor |
| A | `www` | IP do servidor |

---

## Checklist pós-deploy

- [ ] `https://domecanico.net` abre o frontend
- [ ] `https://domecanico.net/api/auth/login/` retorna 405 (Method Not Allowed)
- [ ] Login funciona com usuário criado
- [ ] Upload de logo da oficina vai para o R2
- [ ] Certificado SSL ativo (cadeado no navegador)
- [ ] `docker compose ps` mostra todos os containers `Up`
