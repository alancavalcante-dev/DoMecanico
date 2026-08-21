FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# SECRET_KEY descartável só para o build (collectstatic não usa o valor real;
# em runtime o SECRET_KEY vem do env_file). Assim o .env não precisa estar na imagem.
RUN mkdir -p logs && SECRET_KEY=build-collectstatic-only python manage.py collectstatic --noinput

RUN adduser --disabled-password --gecos '' appuser \
    && mkdir -p /app/logs /app/media \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", "core.wsgi", "--workers", "3", "--bind", "0.0.0.0:8000", "--timeout", "120"]
