# Usa una imagen base de Python
FROM python:3.10-slim

# Evita la creación de archivos .pyc y salida en buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo en el contenedor
WORKDIR /app

# Actualiza e instala las dependencias del sistema necesarias para compilar psycopg2 y otras librerías
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# Copia el archivo de requerimientos e instala dependencias Python
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copia el resto del código de la aplicación
COPY . /app/

# Ejecuta collectstatic (asegúrate de haber definido STATIC_ROOT en settings.py)
# !!!!!!!!!!!!!!
# RUN python manage.py collectstatic --noinput

# Comando para iniciar la aplicación (ajusta "tutorial.wsgi:application" según corresponda)
CMD gunicorn hotel_management.wsgi:application --bind 0.0.0.0:$PORT

