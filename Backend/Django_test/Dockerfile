FROM python:3.10-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential libpq-dev \
 && pip install --no-cache-dir -r requirements.txt \
 && apt-get purge -y --auto-remove build-essential \
 && rm -rf /var/lib/apt/lists/*
COPY . .
EXPOSE 8000
CMD ["gunicorn", "hotel_management.wsgi:application", "--bind", "0.0.0.0:8000"]
