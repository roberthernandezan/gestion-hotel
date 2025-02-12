import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings")
django.setup()

from gestion.models import (
    Huesped, Empleados, Habitaciones, AsignacionesHuespedes,
    Ingredientes, Ordenes, OrdenElementos, Bares, Cocktail,
    CocktailIngredientes, MovimientosStock
)
from django.db.models.signals import post_save, post_delete
from gestion.signals.precios_signals import actualizar_precio_total_orden
from gestion.signals.ordenes_signals import actualizar_pagorealizado_asignacion
from django.db import connection

def borrar_todos_los_registros():
    # Desconectar señales problemáticas
    post_save.disconnect(receiver=actualizar_precio_total_orden, sender=OrdenElementos)
    post_delete.disconnect(receiver=actualizar_precio_total_orden, sender=OrdenElementos)
    post_delete.disconnect(receiver=actualizar_pagorealizado_asignacion, sender=Ordenes)

    Ordenes.objects.all().delete()
    MovimientosStock.objects.all().delete()
    AsignacionesHuespedes.objects.all().delete()
    CocktailIngredientes.objects.all().delete()
    Cocktail.objects.all().delete()
    Ingredientes.objects.all().delete()
    Habitaciones.objects.all().delete()
    Huesped.objects.all().delete()
    Empleados.objects.all().delete()
    Bares.objects.all().delete()

    print("Todos los registros se han eliminado correctamente.")

    with connection.cursor() as cursor:
        cursor.execute("ALTER SEQUENCE huesped_id_huesped_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE empleados_id_empleado_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE asignacioneshuespedes_id_asignacion_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE ingredientes_id_ingredientes_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE cocktail_id_cocktail_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE cocktailingredientes_id_registro_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE ordenes_id_orden_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE ordenelementos_id_elemento_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE bares_id_bar_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE movimientosstock_id_movimiento_seq RESTART WITH 1;")

    print("Secuencias reiniciadas correctamente.")

    # Reconectar las señales
    post_save.connect(receiver=actualizar_precio_total_orden, sender=OrdenElementos)
    post_delete.connect(receiver=actualizar_precio_total_orden, sender=OrdenElementos)
    post_delete.connect(receiver=actualizar_pagorealizado_asignacion, sender=Ordenes)


if __name__ == "__main__":
    borrar_todos_los_registros()
