import os
import django
import pandas as pd
from django.db.models import Sum, F, Min, Max
import warnings
from itertools import product  
from openpyxl.utils import get_column_letter  

warnings.filterwarnings("ignore")  

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings")
django.setup()

from gestion.models import OrdenElementos, CocktailIngredientes, Ingredientes

def generar_consumos_historicos_excel():
    # Obtener fecha de inicio (primer registro) y de finalización (último registro)
    fecha_inicio = (
        OrdenElementos.objects.aggregate(primera_fecha=Min("fechaorden"))["primera_fecha"]
    )
    fecha_fin = (
        OrdenElementos.objects.aggregate(ultima_fecha=Max("fechaorden"))["ultima_fecha"]
    )

    if not fecha_inicio or not fecha_fin:
        print("No hay registros en la base de datos para calcular consumos.")
        return

    print(f"Fecha de inicio detectada automáticamente: {fecha_inicio}")
    print(f"Fecha de finalización detectada automáticamente: {fecha_fin}")

    consumo_total = {}

    # Cálculo de consumo para registros directos (no cocktail)
    datos_directos = (
        OrdenElementos.objects
        .filter(escocktail=False, fechaorden__range=[fecha_inicio, fecha_fin])
        .annotate(
            año=F('fechaorden__year'),
            mes=F('fechaorden__month'),
            ingrediente_nombre=F('id_ingredientes__nombre')
        )
        .values('ingrediente_nombre', 'año', 'mes')
        .annotate(total_litros=Sum(F('cantidad') * F('id_ingredientes__litrosporunidad')))
    )

    for dato in datos_directos:
        key = (dato['ingrediente_nombre'], dato['año'], dato['mes'])
        consumo_total[key] = consumo_total.get(key, 0) + dato['total_litros']

    # Cálculo de consumo para registros de cocktails
    datos_cocktails = OrdenElementos.objects.filter(
        escocktail=True,
        fechaorden__range=[fecha_inicio, fecha_fin]  
    )

    for cocktail in datos_cocktails:
        receta = CocktailIngredientes.objects.filter(
            id_cocktail=cocktail.id_cocktail,
            activo=True
        )
        for ingrediente in receta:
            key = (ingrediente.id_ingredientes.nombre, cocktail.fechaorden.year, cocktail.fechaorden.month)
            cantidad_usada = cocktail.cantidad * ingrediente.cantidad
            consumo_total[key] = consumo_total.get(key, 0) + cantidad_usada

    # Obtener todos los ingredientes existentes en la base de datos
    ingredientes = Ingredientes.objects.values_list("nombre", flat=True).distinct()
    fecha_fin_datetime = pd.to_datetime(fecha_fin)
    años = range(fecha_inicio.year, fecha_fin_datetime.year + 1)
    meses = range(1, 13)

    combinaciones = []
    for año in años:
        if año == fecha_fin_datetime.year:
            meses_hasta_fin = range(1, fecha_fin_datetime.month + 1)
            combinaciones.extend(product(ingredientes, [año], meses_hasta_fin))
        else:
            combinaciones.extend(product(ingredientes, [año], meses))

    datos_consumo = [
        {
            "Ingrediente": ingrediente,
            "Año": año,
            "Mes": mes,
            "Consumo Total": consumo_total.get((ingrediente, año, mes), 0)
        }
        for ingrediente, año, mes in combinaciones
    ]

    df = pd.DataFrame(datos_consumo)
    df.sort_values(by=['Ingrediente', 'Año', 'Mes'], inplace=True)

    # Creamos la tabla pivot: filas = (Ingrediente, Año) y columnas = Mes (1 a 12)
    pivot_table = df.pivot(index=["Ingrediente", "Año"], columns="Mes", values="Consumo Total")
    pivot_table = pivot_table.reindex(columns=range(1, 13), fill_value=0)
    pivot_table = pivot_table.astype(float)

    # Renombrar columnas a abreviaturas de 3 letras
    meses_abreviados = {
        1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr",
        5: "May", 6: "Jun", 7: "Jul", 8: "Ago",
        9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"
    }
    pivot_table.rename(columns=meses_abreviados, inplace=True)

    # --- Nuevo bloque: imprimir vector de consumos por ingrediente ---
    # Crear lista de periodos (año, mes) desde el primer mes registrado hasta el último
    periodos = []
    current_year = fecha_inicio.year
    current_month = fecha_inicio.month
    while current_year < fecha_fin.year or (current_year == fecha_fin.year and current_month <= fecha_fin.month):
        periodos.append((current_year, current_month))
        if current_month == 12:
            current_year += 1
            current_month = 1
        else:
            current_month += 1

    vectores_consumo = {}
    for ing in ingredientes:
        vector_consumo = [float(consumo_total.get((ing, año, mes), 0)) for (año, mes) in periodos]
        vectores_consumo[ing] = vector_consumo
        print(f"{ing}: {vector_consumo}")    

    # Exportar el pivot table a Excel con autoajuste de columnas
    ruta_archivo = "consumo_historico.xlsx"
    with pd.ExcelWriter(ruta_archivo, engine="openpyxl") as writer:
        pivot_table.to_excel(writer, sheet_name="Consumos", index=True)
        worksheet = writer.sheets["Consumos"]

        for col in worksheet.columns:
            max_length = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                try:
                    if cell.value is not None:
                        max_length = max(max_length, len(str(cell.value)))
                except:
                    pass
            adjusted_width = max_length + 2
            worksheet.column_dimensions[col_letter].width = adjusted_width

    print(f"Archivo generado: {ruta_archivo}")

generar_consumos_historicos_excel()
