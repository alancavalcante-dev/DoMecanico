#!/bin/bash
set -e

echo "==> Puxando atualizações..."
git pull origin main

echo "==> Garantindo permissão da pasta de mídia (backend roda como appuser uid 1000)..."
mkdir -p /srv/domecanico/media
chown -R 1000:1000 /srv/domecanico/media

echo "==> Build do backend..."
docker compose build backend

echo "==> Aplicando migrations..."
# Com RLS ligado, a conexão default (role _app) não pode alterar as tabelas —
# migrations rodam na conexão bypass (role dona, com BYPASSRLS).
MIGRATE_DB=""
if grep -qiE '^RLS_ENABLED=(true|1)$' .env 2>/dev/null; then
  MIGRATE_DB="--database=bypass"
  echo "    (RLS ligado — migrando via conexão bypass)"
fi
docker compose run --rm backend python manage.py migrate --noinput $MIGRATE_DB

echo "==> Build do frontend..."
cd frontend
npm ci --prefer-offline
npm run build
cd ..

echo "==> Reiniciando serviços..."
docker compose up -d

echo "==> Recarregando nginx..."
nginx -s reload

echo "==> Deploy concluído!"
docker compose ps
