from django.db import models
from .ordenes import Ordenes
from .ingredientes import Ingredientes
from .cocktail import Cocktail
from django.core.exceptions import ValidationError

class OrdenElementos(models.Model):
    id_elemento = models.AutoField(primary_key=True)
    id_orden = models.ForeignKey(
        Ordenes, 
        on_delete=models.CASCADE,
        to_field='id_orden', 
        db_column="id_orden")
    id_ingredientes = models.ForeignKey(
        Ingredientes,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        to_field='id_ingredientes', 
        db_column="id_ingredientes")
    id_cocktail = models.ForeignKey(
        Cocktail, 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE,
        to_field='id_cocktail', 
        db_column="id_cocktail")
    escocktail = models.BooleanField()
    cantidad = models.PositiveIntegerField()
    preciototal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    version = models.PositiveIntegerField(null=True, blank=True)
    fechaorden = models.DateTimeField(auto_now_add=True)  


    class Meta:
        db_table = "ordenelementos"
        managed = False  

    def clean(self):
        if (self.id_ingredientes is None and self.id_cocktail is None) or (
            self.id_ingredientes is not None and self.id_cocktail is not None):
            raise ValidationError("Debe existir solo un ingrediente o un cóctel, no ambos.")
        super().clean()


    def __str__(self):
        tipo = "Cocktail" if self.escocktail else "Ingrediente"
        nombre = (self.id_cocktail.nombre if self.escocktail else self.id_ingredientes.nombre)
        return f"{tipo} - Orden {self.id_orden.id_orden} - Nombre {nombre} - Cantidad {self.cantidad}"
