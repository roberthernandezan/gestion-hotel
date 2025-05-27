from django.contrib import admin
from .models import (
    Huesped, Habitaciones, AsignacionesHuespedes, RegistroEstancias,
    Empleados, Bares, Ingredientes, 
    Cocktail, CocktailIngredientes, MovimientosStock, RegistroMovimientos, 
    Ordenes, RegistroOrdenes, OrdenElementos
)


admin.site.register(Huesped)
admin.site.register(Habitaciones)
admin.site.register(AsignacionesHuespedes)
admin.site.register(RegistroEstancias)
admin.site.register(Empleados)
admin.site.register(Bares)
admin.site.register(Ingredientes)
admin.site.register(Cocktail)
admin.site.register(CocktailIngredientes)
admin.site.register(MovimientosStock)
admin.site.register(RegistroMovimientos)
admin.site.register(Ordenes)
admin.site.register(RegistroOrdenes)
admin.site.register(OrdenElementos)
