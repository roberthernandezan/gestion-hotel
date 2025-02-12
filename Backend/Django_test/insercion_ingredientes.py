import os
import django
from decimal import Decimal, ROUND_DOWN
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings")
django.setup()

from gestion.models import Ingredientes, Cocktail, CocktailIngredientes
import os
import django
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings")
django.setup()

from gestion.models import Ingredientes, Cocktail, CocktailIngredientes

ingredientes_data = [
    {"nombre": "Vodka", "alcohol": True, "precioporunidad": Decimal("7.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Ron", "alcohol": True, "precioporunidad": Decimal("6.50"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Tequila", "alcohol": True, "precioporunidad": Decimal("8.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Ginebra", "alcohol": True, "precioporunidad": Decimal("6.80"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Whisky", "alcohol": True, "precioporunidad": Decimal("10.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Jugo de Naranja", "alcohol": False, "precioporunidad": Decimal("2.50"), "litrosporunidad": Decimal("0.33"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Soda", "alcohol": False, "precioporunidad": Decimal("1.00"), "litrosporunidad": Decimal("0.330"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Azúcar", "alcohol": False, "precioporunidad": Decimal("0.50"), "litrosporunidad": Decimal("0.500"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Hielo", "alcohol": False, "precioporunidad": Decimal("0.10"), "litrosporunidad": Decimal("0.500"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Menta", "alcohol": False, "precioporunidad": Decimal("0.80"), "litrosporunidad": Decimal("0.250"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Jugo de Limón", "alcohol": False, "precioporunidad": Decimal("2.00"), "litrosporunidad": Decimal("0.250"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Triple Sec", "alcohol": True, "precioporunidad": Decimal("5.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Granadina", "alcohol": False, "precioporunidad": Decimal("2.50"), "litrosporunidad": Decimal("0.250"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Piña", "alcohol": False, "precioporunidad": Decimal("2.50"), "litrosporunidad": Decimal("0.330"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Salsa Inglesa", "alcohol": False, "precioporunidad": Decimal("2.50"), "litrosporunidad": Decimal("0.250"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Cranberry", "alcohol": False, "precioporunidad": Decimal("2.50"), "litrosporunidad": Decimal("0.330"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Vermouth", "alcohol": True, "precioporunidad": Decimal("5.00"), "litrosporunidad": Decimal("0.070"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Amargo", "alcohol": False, "precioporunidad": Decimal("9.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Crema de Coco", "alcohol": False, "precioporunidad": Decimal("2.00"), "litrosporunidad": Decimal("0.250"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Cachaça", "alcohol": True, "precioporunidad": Decimal("7.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Limoncello", "alcohol": True, "precioporunidad": Decimal("7.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Cerveza", "alcohol": True, "precioporunidad": Decimal("5.00"), "litrosporunidad": Decimal("0.330"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Ouzo", "alcohol": True, "precioporunidad": Decimal("7.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Vino", "alcohol": True, "precioporunidad": Decimal("3.00"), "litrosporunidad": Decimal("0.100"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Puré de Maracuyá", "alcohol": False, "precioporunidad": Decimal("3.50"), "litrosporunidad": Decimal("0.100"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Licor de Cereza", "alcohol": True, "precioporunidad": Decimal("6.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Aperol", "alcohol": True, "precioporunidad": Decimal("5.50"), "litrosporunidad": Decimal("0.050"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Vino Espumante", "alcohol": True, "precioporunidad": Decimal("8.00"), "litrosporunidad": Decimal("0.150"), "cantidadactual": Decimal("3000.000")},
    {"nombre": "Campari", "alcohol": True, "precioporunidad": Decimal("5.00"), "litrosporunidad": Decimal("0.045"), "cantidadactual": Decimal("3000.000")}
]

ingredientes_creados = {}

for data in ingredientes_data:
    ingrediente = Ingredientes.objects.create(**data)
    ingredientes_creados[data["nombre"]] = ingrediente

print("Ingredientes creados exitosamente.")

cocktail_data = {
    "Margarita": [("Tequila", Decimal("0.035")), ("Jugo de Limón", Decimal("0.015")), ("Triple Sec", Decimal("0.020"))],
    "Martini": [("Ginebra", Decimal("0.045")), ("Vermouth", Decimal("0.015"))],
    "Cosmopolitan": [("Vodka", Decimal("0.035")), ("Jugo de Limón", Decimal("0.015")), ("Cranberry", Decimal("0.020"))],
    "Mojito": [("Ron", Decimal("0.040")), ("Azúcar", Decimal("0.010")), ("Menta", Decimal("0.005")), ("Hielo", Decimal("0.200")), ("Soda", Decimal("0.150"))],
    "Daiquiri": [("Ron", Decimal("0.045")), ("Jugo de Limón", Decimal("0.015")), ("Azúcar", Decimal("0.010"))],
    "Piña Colada": [("Ron", Decimal("0.035")), ("Crema de Coco", Decimal("0.025")), ("Piña", Decimal("0.200"))],
    "Bloody Mary": [("Vodka", Decimal("0.040")), ("Salsa Inglesa", Decimal("0.005")), ("Hielo", Decimal("0.200"))],
    "Tequila Sunrise": [("Tequila", Decimal("0.040")), ("Jugo de Naranja", Decimal("0.150")), ("Granadina", Decimal("0.015"))],
    "Manhattan": [("Whisky", Decimal("0.045")), ("Vermouth", Decimal("0.015")), ("Amargo", Decimal("0.005"))],
    "Caipirinha": [("Cachaça", Decimal("0.050")), ("Azúcar", Decimal("0.010")), ("Jugo de Limón", Decimal("0.020"))],
    "Daiquiri Congelado": [("Ron", Decimal("0.045")), ("Jugo de Limón", Decimal("0.020")), ("Azúcar", Decimal("0.015")), ("Hielo", Decimal("0.300"))],
    "Negroni": [("Ginebra", Decimal("0.030")), ("Vermouth", Decimal("0.030")), ("Campari", Decimal("0.030"))],
    "Sex on the Beach": [("Vodka", Decimal("0.035")), ("Cranberry", Decimal("0.020")), ("Jugo de Naranja", Decimal("0.025")), ("Licor de Cereza", Decimal("0.015"))],
    "Rum Punch": [("Ron", Decimal("0.040")), ("Piña", Decimal("0.100")), ("Jugo de Limón", Decimal("0.015")), ("Granadina", Decimal("0.015"))],
    "Passionfruit Martini": [("Vodka", Decimal("0.045")), ("Puré de Maracuyá", Decimal("0.030")), ("Vino Espumante", Decimal("0.050"))],
    "Cuba Libre": [("Ron", Decimal("0.045")), ("Soda", Decimal("0.150")), ("Jugo de Limón", Decimal("0.015"))],
    "Aperol Spritz": [("Aperol", Decimal("0.050")), ("Vino Espumante", Decimal("0.150")), ("Soda", Decimal("0.050"))]
}

for cocktail_nombre, ingredientes in cocktail_data.items():
    cocktail = Cocktail.objects.create(nombre=cocktail_nombre, precioporunidad=Decimal("12.50"))
    for ingrediente_nombre, cantidad in ingredientes:
        ingrediente = ingredientes_creados.get(ingrediente_nombre)
        if ingrediente:
            CocktailIngredientes.objects.create(
                id_cocktail=cocktail,
                id_ingredientes=ingrediente,
                cantidad=cantidad
            )

print("Cócteles creados exitosamente con cantidades exactas.")
