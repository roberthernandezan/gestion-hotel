import os
import django
import random
from datetime import datetime, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings")
django.setup()

from gestion.models import Huesped, Habitaciones, Empleados, Bares, AsignacionesHuespedes, Ordenes, OrdenElementos, Ingredientes, Cocktail
from decimal import Decimal, ROUND_HALF_UP

import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning)

exception_list = []
 
nacionalidades = {
    "Inglaterra": {"bebida": "Vodka", "cocktail": "Cosmopolitan"},
    "Irlanda": {"bebida": "Whisky", "cocktail": "Manhattan"},
    "España": {"bebida": "Cerveza", "cocktail": "Cuba Libre"},
    "Francia": {"bebida": "Vino", "cocktail": "Negroni"},
    "Italia": {"bebida": "Aperol", "cocktail": "Aperol Spritz"},
    "Grecia": {"bebida": "Ouzo", "cocktail": "Piña Colada"},
    "Escocia": {"bebida": "Whisky", "cocktail": "Sex on the Beach"},
    "Alemania": {"bebida": "Cerveza", "cocktail": "Tequila Sunrise"},
    "Mexico": {"bebida": "Tequila", "cocktail": "Margarita"},
    "Noruega": {"bebida": "Vodka", "cocktail": "Passionfruit Martini"}
}


def seleccionar_nacionalidad():
    probabilidad = random.uniform(0, 1)
    if probabilidad <= 0.3:  
        return "España"
    elif probabilidad <= 0.5:  
        return "Italia"
    elif probabilidad <= 0.7:  
        return "Inglaterra"
    elif probabilidad <= 0.8:  
        return "Francia"
    elif probabilidad <= 0.9:  
        return "Grecia"
    else:  
        return "Alemania"
    
def verificar_ocupacion_habitacion(habitacion):
    num_huespedes_asignados = AsignacionesHuespedes.objects.filter(
        numerohabitacion=habitacion,
        enhotel=True  
    ).count()

    capacidad_maxima = habitacion.capacidad  

    if num_huespedes_asignados < capacidad_maxima:
        return True
    else:
        return False    

def aplicar_multiplicadores(mes):
    consumo_cocktail, consumo_directo = obtener_consumos_iniciales()

    if mes in [12, 1, 2]:  
        estacion = "invierno"
    elif mes in [6, 7, 8]: 
        estacion = "verano"
    else:
        estacion = "otro"  

    for cocktail in consumo_cocktail:
        multiplicador = cocktail["multiplicadores"].get(estacion)
        if multiplicador:
            cocktail["consumo_mensual"] = int(cocktail["consumo_mensual"] * multiplicador)

    for consumicion in consumo_directo:
        multiplicador = consumicion["multiplicadores"].get(estacion)
        if multiplicador:
            consumicion["consumo_mensual"] = int(consumicion["consumo_mensual"] * multiplicador)
    
    return consumo_cocktail, consumo_directo


def generar_datos(num_huespedes, mes, año, id_base):

    habitaciones = list(Habitaciones.objects.all())
    bares = list(Bares.objects.all())
    empleados = list(Empleados.objects.all())

    for i in range(1, num_huespedes + 1):

        nacionalidad = seleccionar_nacionalidad()

        id_unico = id_base + i

        habitacion_asignada = None
        for habitacion in habitaciones:
            if verificar_ocupacion_habitacion(habitacion):
                habitacion_asignada = habitacion
                break  

        if habitacion_asignada is None:
            print(f"No hay habitaciones disponibles para el huésped {id_unico}.")
            continue  

        huesped = Huesped.objects.create(
            nombre=f"Huesped {i} {mes}/{año}",
            edad=random.randint(25, 60),
            nacionalidad=nacionalidad,
            id_unico_huesped=id_unico
        )

        asignacion = AsignacionesHuespedes.objects.create(
            id_huesped=huesped,
            numerohabitacion=habitacion_asignada
        )  
        total_ordenes = random.randint(1, 2)
        for _ in range(total_ordenes):
            bar = random.choice(bares)
            empleado = random.choice(empleados)
            Ordenes.objects.create(
                id_asignacion=asignacion,
                id_bar=bar,
                id_empleado=empleado
            )
        ajustar_fechas(asignacion, mes, año)    


def check_outs(mes, año):
    asignaciones = AsignacionesHuespedes.objects.filter(
        fechaasignacion__month=mes,
        fechaasignacion__year=año,
        enhotel=True
    )
    for asignacion in asignaciones:
        asignacion.pagorealizado = True
        asignacion.enhotel = False
        asignacion.save()


def generar_consumiciones_cocktail(mes, año, mult):
    mult = Decimal(mult)  

    ordenes = list(Ordenes.objects.all())
    ordenes_mes = list(
        Ordenes.objects.filter(
            fechahora__month=mes,
            fechahora__year=año,
            actividad=True,
            id_asignacion__enhotel=True
        )
    )
    
    if not ordenes_mes:
        print(f"No se encontraron órdenes para {mes}/{año}.")
        return
    
    consumo_cocktail, consumo_directo = aplicar_multiplicadores(mes)

    for cocktail in consumo_cocktail:
        cocktail["consumo_mensual"] = (cocktail["consumo_mensual"] * mult).quantize(Decimal('1'))
        print(f"Tras multiplicar: {cocktail["consumo_mensual"]}")

    opcion = list(Cocktail.objects.all())
    orden_index = 0

    while any(cocktail["consumo_mensual"] > 0 for cocktail in consumo_cocktail):
        bebida = random.choice(opcion)
        
        for cocktail in consumo_cocktail:
            if cocktail["nombre"] == bebida.nombre and cocktail["consumo_mensual"] > 0:
                
                can=random.randint(1, 3)

                ord = ordenes_mes[orden_index]
                print(f"Consumicion en orden: {ord}")
                ordenC= OrdenElementos.objects.create(
                    id_orden=ord,
                    id_cocktail= Cocktail.objects.get(nombre=bebida.nombre),
                    escocktail=True,
                    cantidad=can
                )
                fecha = ordenC.id_orden.fechahora
                ordenC.fechaorden = fecha
                ordenC.save()

                if can > cocktail["consumo_mensual"]:
                    ordenC.cantidad = cocktail["consumo_mensual"]
                    ordenC.save()
                    cocktail["consumo_mensual"] = 0
                else:
                    cocktail["consumo_mensual"] -= can
                    print(f"{bebida.nombre} - Consumo mensual actualizado a {cocktail['consumo_mensual']}")

        orden_index = (orden_index + 1) % len(ordenes_mes)

        if all(cocktail["consumo_mensual"] == 0 for cocktail in consumo_cocktail):
            print(f"Todos los consumos mensuales han llegado a 0. Finalizando la asignación para mes {mes}.")
            break


def generar_consumiciones_directas(mes, año, mult):

    mult = Decimal(mult) 

    ordenes = list(Ordenes.objects.all())
    ordenes_mes = list(
        Ordenes.objects.filter(
            fechahora__month=mes,
            fechahora__year=año,
            actividad=True,
            id_asignacion__enhotel=True
        )
    )

    if not ordenes_mes:
        print(f"No se encontraron órdenes para {mes}/{año}.")
        return

    consumo_cocktail, consumo_directo= aplicar_multiplicadores(mes)

    for consumicion in consumo_directo:
        consumicion["consumo_mensual"] = (consumicion["consumo_mensual"] * mult).quantize(Decimal('1'))
        print(f"Tras multiplicar: {consumicion["consumo_mensual"]}")

    opcion = list(Ingredientes.objects.all())
    orden_index = 0

    while any(consumicion["consumo_mensual"] > 0 for consumicion in consumo_directo):
        bebida = random.choice(opcion)

        for consumicion in consumo_directo:
            if consumicion["nombre"] == bebida.nombre and consumicion["consumo_mensual"] > 0:
                
                can=random.randint(1, 3)

                ord = ordenes_mes[orden_index]
                print(f"Consumicion en orden: {ord}")
                ordenC= OrdenElementos.objects.create(
                    id_orden=ord,
                    id_ingredientes= Ingredientes.objects.get(nombre=bebida.nombre),
                    escocktail=False,
                    cantidad=can
                )
                fecha = ordenC.id_orden.fechahora
                ordenC.fechaorden = fecha
                ordenC.save()

                if can > consumicion["consumo_mensual"]:
                    ordenC.cantidad = consumicion["consumo_mensual"]
                    ordenC.save()
                    consumicion["consumo_mensual"] = 0
                else:
                    consumicion["consumo_mensual"] -= can
                    print(f"{bebida.nombre} - Consumo mensual actualizado a {consumicion['consumo_mensual']}")

        orden_index = (orden_index + 1) % len(ordenes_mes)

        if all(consumicion["consumo_mensual"] == 0 for consumicion in consumo_directo):
            print(f"Todos los consumos mensuales han llegado a 0. Finalizando la asignación para mes {mes}.")
            break


def ajustar_fechas(asignacion, mes, año):
    try:

        nueva_fecha_checkin = datetime(
            año, mes, random.randint(1, 21),
            random.randint(0, 23), random.randint(0, 59)
        )
        nueva_fecha_checkout = nueva_fecha_checkin + timedelta(days=random.randint(2, 10))
        nueva_fecha_checkout = nueva_fecha_checkout.replace(
            hour=random.randint(0, 23), minute=random.randint(0, 59)
        )
        asignacion.fechaasignacion = nueva_fecha_checkin
        asignacion.fechacheckout = nueva_fecha_checkout
        asignacion.save()

        ordenes = Ordenes.objects.filter(id_asignacion=asignacion)
        for orden in ordenes:
            nueva_fecha_orden = nueva_fecha_checkin + timedelta(
                days=random.randint(0, (nueva_fecha_checkout - nueva_fecha_checkin).days)
            )
            nueva_fecha_orden = nueva_fecha_orden.replace(
                hour=random.randint(10, 23),
                minute=random.randint(0, 59)
            )
            orden.fechahora = nueva_fecha_orden
            orden.save()

    except Exception as e:
        exception_list.append(f"Error al ajustar fechas para {año}: {e}")

def obtener_consumos_iniciales():  
    
    consumo_cocktail = [
        {"nombre": "Margarita", "consumo_mensual": 10 , "multiplicadores": {"invierno": 1, "verano": 1}},
        {"nombre": "Cosmopolitan", "consumo_mensual": 10 , "multiplicadores": {"invierno": 1, "verano": 1}},
        {"nombre": "Daiquiri", "consumo_mensual": 10 , "multiplicadores": {"invierno": 1, "verano": 1}},
        {"nombre": "Cuba Libre", "consumo_mensual": 10 , "multiplicadores": {"invierno": 1, "verano": 1}},
        {"nombre": "Vodka Soda", "consumo_mensual": 10 , "multiplicadores": {"invierno": 1, "verano": 1}},
    ]

    consumo_directo = [
        {"nombre": "Vodka", "consumo_mensual": 20 , "multiplicadores": {"invierno": 1, "verano": 1.5}},
        {"nombre": "Ron", "consumo_mensual": 20 , "multiplicadores": {"invierno": 1, "verano": 1.5}},
        {"nombre": "Tequila", "consumo_mensual": 13 , "multiplicadores": {"invierno": 1.5, "verano": 0.5}},
        {"nombre": "Soda", "consumo_mensual": 20 , "multiplicadores": {"invierno": 1, "verano": 1.5}},
        {"nombre": "Jugo de Limón", "consumo_mensual": 13 , "multiplicadores": {"invierno": 1, "verano": 1}},
]

    return consumo_cocktail, consumo_directo

def cerrar_ordenes_activas(mes, año):
    ordenes_activas = Ordenes.objects.filter(
        fechahora__month=mes,
        fechahora__year=año,
        actividad=True,
        id_asignacion__enhotel=True 
    )
    count = ordenes_activas.update(actividad=False)
    print(f"Se han cerrado {count} órdenes activas para {mes}/{año}.")

id22 = [
    {"mes": 1, "id": 1300000},{"mes": 2, "id": 1400000},{"mes": 3, "id": 1500000},
    {"mes": 4, "id": 1600000},{"mes": 5, "id": 1700000},{"mes": 6, "id": 1800000},
    {"mes": 7, "id": 1900000},{"mes": 8, "id": 2100000},{"mes": 9, "id": 2300000},
    {"mes": 10, "id": 2400000},{"mes": 11, "id": 2500000},{"mes": 12, "id": 2600000}
]
id23 = [
    {"mes": 1, "id": 1000000},{"mes": 2, "id": 2000000},{"mes": 3, "id": 3000000},
    {"mes": 4, "id": 4000000},{"mes": 5, "id": 5000000},{"mes": 6, "id": 6000000},
    {"mes": 7, "id": 7000000},{"mes": 8, "id": 8000000},{"mes": 9, "id": 9000000},
    {"mes": 10, "id": 1010000},{"mes": 11, "id": 1111000},{"mes": 12, "id": 1200000}
]
id24 = [
    {"mes": 1, "id": 1100000},{"mes": 2, "id": 2200000},{"mes": 3, "id": 3300000},
    {"mes": 4, "id": 4400000},{"mes": 5, "id": 5500000},{"mes": 6, "id": 6600000},
    {"mes": 7, "id": 7700000},{"mes": 8, "id": 8800000},{"mes": 9, "id": 9900000},
    {"mes": 10, "id": 1010100},{"mes": 11, "id": 1111100},{"mes": 12, "id": 1212000}
]

huespedes_por_mes = {
    1: 40, 2: 20, 3: 20, 4: 40, 5: 50, 6: 80, 
    7: 120, 8: 100, 9: 90, 10: 70, 11: 60, 12: 90
}

datos_huespedes = {
    1: 42, 2: 21, 3: 21, 4: 42, 5: 53, 6: 84, 
    7: 126, 8: 105, 9: 95, 10: 74, 11: 63, 12: 95
}

año = 2023

for mes in range(1, 13):  # 12 meses

    huespedes = datos_huespedes[mes] 
    mult = datos_huespedes[mes] / huespedes_por_mes[mes]

    id_base = next(item["id"] for item in id23 if item["mes"] == mes)

    # Genera datos de huéspedes, asignaciones y órdenes
    generar_datos(huespedes,mes,año,id_base)

    # Genera consumiciones directas e insertando consumiciones de cócteles
    generar_consumiciones_directas(mes, año, mult)
    generar_consumiciones_cocktail(mes, año, mult)

    # Desactiva (cierra) todas las órdenes activas de ese mes
    cerrar_ordenes_activas(mes, año)

    # Marca los check-outs (cierra las estancias)
    check_outs(mes, año)

    # Puedes agregar un print para verificar el final de la iteración
    print(f"Finalizado mes {mes} del año {año}")