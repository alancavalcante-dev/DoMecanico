#!/bin/bash
set -e

echo "==> Puxando atualizações..."
git pull origin main

echo "==> Build do backend..."
docker compose build backend

echo "==> Aplicando migrations..."
docker compose run --rm backend python manage.py migrate --noinput

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
