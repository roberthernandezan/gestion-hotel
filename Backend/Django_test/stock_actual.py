import pandas as pd
from django.conf import settings
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings") 
django.setup()

from gestion.models import Ingredientes  

def guardar_stock_actual(archivo_salida):
    ingredientes_stock = Ingredientes.objects.values("nombre", "cantidadactual")

    stock_actual_df = pd.DataFrame(list(ingredientes_stock))
    stock_actual_df.rename(columns={"nombre": "Ingrediente", "cantidadactual": "Cantidad Actual"}, inplace=True)

    stock_actual_df.to_excel(archivo_salida, index=False)
    print(f"Archivo generado: {archivo_salida}")


archivo_salida = r"C:\Users\Robert\OneDrive\Desktop\Django_test\stock_actual.xlsx"

guardar_stock_actual(archivo_salida)
