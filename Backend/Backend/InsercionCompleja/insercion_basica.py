import os
import django
import random
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings")
django.setup()
from gestion.models import  Habitaciones, Bares, Empleados

exception_list = []

empleados_nombres = [
    "Ana", "Juan", "Carlos", "María", "Sofía", "Miguel", "Luis", "Elena"
]

bar_nombres = [
    "Lobby Bar", "Sky Lounge", "Beach Bar", "Poolside Bar"
]

def generar_precio():
    return round(Decimal(random.uniform(1.0, 100.0)), 2)  

def generar_litros():
    return round(Decimal(random.uniform(0.1, 5.0)), 3)  

def generar_datos_basicos():
    try:
        
        for i in range(1, 201):
            try:
                Habitaciones.objects.create(
                    numerohabitacion=i,
                    todoincluido=(i <= 5),
                    capacidad=random.randint(1, 4)
                )
            except Exception as e:
                exception_list.append(f"Error al crear Habitación {i}: {e}")

        for i, nombre in enumerate(bar_nombres):
            try:
                Bares.objects.create(
                    nombre=nombre,
                    ubicacion=f"Planta {i + 1}"
                )
            except Exception as e:
                exception_list.append(f"Error al crear Bar {nombre}: {e}")

        passw = 0000
        for i, nombre in enumerate(empleados_nombres):
            try:
                Empleados.objects.create(
                    nombre=nombre,
                    puesto=f"Puesto {i + 1}",
                    password = f"{(passw + i):04d}"
                )
            except Exception as e:
                exception_list.append(f"Error al crear Empleado {nombre}: {e}")

    except Exception as e:
        exception_list.append(f"Error general al generar datos básicos: {e}")

generar_datos_basicos()

if exception_list:
    print("Errores durante la inserción de datos básicos:")
    for error in exception_list:
        print(error)
else:
    print("Todos los datos básicos se insertaron correctamente.")
