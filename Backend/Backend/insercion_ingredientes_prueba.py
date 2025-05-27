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
    {"nombre": "Vodka", "alcohol": True, "precioporunidad": Decimal("7.00"), "litrosporunidad": Decimal("0.5"), "cantidadactual": Decimal("20.000")},
    {"nombre": "Ron", "alcohol": True, "precioporunidad": Decimal("6.50"), "litrosporunidad": Decimal("0.5"), "cantidadactual": Decimal("20.000")},
    {"nombre": "Tequila", "alcohol": True, "precioporunidad": Decimal("8.00"), "litrosporunidad": Decimal("0.5"), "cantidadactual": Decimal("20.000")},
    {"nombre": "Soda", "alcohol": False, "precioporunidad": Decimal("1.00"), "litrosporunidad": Decimal("0.5"), "cantidadactual": Decimal("20.000")},
    {"nombre": "Jugo de Limón", "alcohol": False, "precioporunidad": Decimal("2.00"), "litrosporunidad": Decimal("0.5"), "cantidadactual": Decimal("20.000")},
]

ingredientes_creados = {}

for data in ingredientes_data:
    ingrediente = Ingredientes.objects.create(**data)
    ingredientes_creados[data["nombre"]] = ingrediente

print("Ingredientes creados exitosamente.")

cocktail_data = {
    "Margarita": [("Tequila", Decimal("0.33")), ("Jugo de Limón", Decimal("0.33"))],
    "Cosmopolitan": [("Vodka", Decimal("0.33")), ("Jugo de Limón", Decimal("0.33"))],
    "Daiquiri": [("Ron", Decimal("0.33")), ("Jugo de Limón", Decimal("0.33"))],
    "Cuba Libre": [("Ron", Decimal("0.33")), ("Soda", Decimal("0.33")), ("Jugo de Limón", Decimal("0.33"))],
    "Vodka Soda": [("Vodka", Decimal("0.33")), ("Soda", Decimal("0.33"))]
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
