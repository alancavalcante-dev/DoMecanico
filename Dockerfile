FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p logs && python manage.py collectstatic --noinput

RUN adduser --disabled-password --gecos '' appuser \
    && mkdir -p /app/logs /app/media \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", "core.wsgi", "--workers", "3", "--bind", "0.0.0.0:8000", "--timeout", "120"]
