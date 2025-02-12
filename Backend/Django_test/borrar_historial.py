import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings")
django.setup()

from gestion.models import (
    RegistroEstancias, RegistroMovimientos, RegistroOrdenes
)
from django.db import connection

def borrar_historial():
    RegistroEstancias.objects.all().delete()
    RegistroMovimientos.objects.all().delete()
    RegistroOrdenes.objects.all().delete()

    print("Historial borrado correctamente.")

    with connection.cursor() as cursor:
        cursor.execute("ALTER SEQUENCE registromovimientos_id_registro_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE registroordenes_id_registro_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE registroestancias_id_registro_seq RESTART WITH 1;")
  
    print("Secuencias reiniciadas correctamente.")

borrar_historial()
