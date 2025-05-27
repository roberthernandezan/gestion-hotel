import os
import django
from django.db.models import Count, Case, When, CharField
from datetime import datetime

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings")
django.setup()

from gestion.models import OrdenElementos, Ordenes, AsignacionesHuespedes

import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning)

def reporte_mes(year, month):
    fecha_inicio = datetime(year, month, 1)
    fecha_fin = datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)

    bebida_favorita = OrdenElementos.objects.filter(
        id_orden__fechahora__range=[fecha_inicio, fecha_fin]
    ).annotate(
        nombreBebida=Case(
            When(escocktail=True, then='id_cocktail__nombre'),  
            When(escocktail=False, then='id_ingredientes__nombre'),  
            output_field=CharField(),
        )
    ).values('nombreBebida').annotate(
        vecesOrdenado=Count('id_elemento')
    ).order_by('-vecesOrdenado').first()

    bar_mas_consumo = Ordenes.objects.filter(
        fechahora__range=[fecha_inicio, fecha_fin]
    ).values('id_bar__nombre').annotate(
        totalOrdenes=Count('id_bar')
    ).order_by('-totalOrdenes').first()

    nacionalidad_predominante = AsignacionesHuespedes.objects.filter(
        fechaasignacion__range=[fecha_inicio, fecha_fin]
    ).values('id_huesped__nacionalidad').annotate(
        totalReservas=Count('id_asignacion')
    ).order_by('-totalReservas').first()

    ingrediente_mas_ordenado = OrdenElementos.objects.filter(
        escocktail=False,
        id_orden__fechahora__range=[fecha_inicio, fecha_fin]
    ).values('id_ingredientes__nombre').annotate(
        vecesOrdenado=Count('id_elemento')
    ).order_by('-vecesOrdenado').first()

    coctel_mas_ordenado = OrdenElementos.objects.filter(
        escocktail=True,
        id_orden__fechahora__range=[fecha_inicio, fecha_fin]
    ).values('id_cocktail__nombre').annotate(
        vecesOrdenado=Count('id_elemento')
    ).order_by('-vecesOrdenado').first()

    print(f"Reporte del {month}/{year}")
    print(f"Bebida favorita: {bebida_favorita}")
    print(f"Bar con más consumo: {bar_mas_consumo}")
    print(f"Nacionalidad predominante: {nacionalidad_predominante}")
    print(f"Ingrediente más ordenado: {ingrediente_mas_ordenado}")
    print(f"Cóctel más ordenado: {coctel_mas_ordenado}")


def calcular_nacionalidades_por_mes_y_ano(mes, año):
    
    fecha_inicio = datetime(año, mes, 1)
    if mes == 12:
        fecha_fin = datetime(año + 1, 1, 1)
    else:
        fecha_fin = datetime(año, mes + 1, 1)

    asignaciones_mes = AsignacionesHuespedes.objects.filter(
        fechaasignacion__gte=fecha_inicio,
        fechaasignacion__lt=fecha_fin
    )

    conteo_nacionalidades = {}
    for asignacion in asignaciones_mes:
        nacionalidad = asignacion.id_huesped.nacionalidad
        if nacionalidad in conteo_nacionalidades:
            conteo_nacionalidades[nacionalidad] += 1
        else:
            conteo_nacionalidades[nacionalidad] = 1

    total_huespedes = sum(conteo_nacionalidades.values())
    porcentajes_nacionalidades = {}
    for nacionalidad, conteo in conteo_nacionalidades.items():
        porcentaje = (conteo / total_huespedes) * 100
        porcentajes_nacionalidades[nacionalidad] = round(porcentaje, 2) 

    porcentajes_ordenados = dict(sorted(porcentajes_nacionalidades.items(), key=lambda item: item[1], reverse=True))

    return porcentajes_ordenados

def calcular_consumo_por_mes_y_tipo(mes, año):

    fecha_inicio = datetime(año, mes, 1)
    if mes == 12:
        fecha_fin = datetime(año + 1, 1, 1)
    else:
        fecha_fin = datetime(año, mes + 1, 1)

    ordenes_mes = Ordenes.objects.filter(fechahora__range=(fecha_inicio, fecha_fin))

    total_ingredientes = 0
    total_cocteles = 0

    for orden in ordenes_mes:
        elementos_orden = OrdenElementos.objects.filter(id_orden=orden)

        for elemento in elementos_orden:
            if elemento.escocktail:
                total_cocteles += elemento.cantidad
            else:
                total_ingredientes += elemento.cantidad

    return {
        "total_ingredientes": total_ingredientes,
        "total_cocteles": total_cocteles
    }

for año in range(2024, 2025):    
    for mes in range(1, 13):
        
        consumo = calcular_consumo_por_mes_y_tipo(mes, año)
        porcentajes = calcular_nacionalidades_por_mes_y_ano(mes, año)

        reporte_mes(año, mes)
        print(porcentajes)
        print(consumo)

