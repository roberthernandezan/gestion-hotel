from django.db import models
from django.core.exceptions import ValidationError
from .cocktail import Cocktail
from .ingredientes import Ingredientes

class CocktailIngredientes(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_cocktail = models.ForeignKey(
        Cocktail, 
        on_delete=models.CASCADE,
        to_field='id_cocktail', 
        db_column="id_cocktail")
    id_ingredientes = models.ForeignKey(
        Ingredientes, 
        on_delete=models.CASCADE,
        to_field='id_ingredientes', 
        db_column="id_ingredientes")
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)
    version = models.IntegerField(default=1)
    primeraversion = models.IntegerField(default=1)
    activo = models.BooleanField(default=True)
    fechamodificacion = models.DateTimeField(auto_now=True)

    def clean(self):
        if not self.id_ingredientes.activo:
            raise ValidationError(f"El ingrediente {self.id_ingredientes.nombre} está inactivo y no puede añadirse a una receta.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "cocktailingredientes"
        managed = False  

    def __str__(self):
        return f"{self.cantidad}L de {self.id_ingredientes.nombre} para {self.id_cocktail.nombre} - Versión {self.version}"
