from django.core.exceptions import ValidationError
from django.db import models

class Cocktail(models.Model):
    id_cocktail = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    precioporunidad = models.DecimalField(max_digits=10, decimal_places=2)
    tienereceta = models.BooleanField(default=False)
    version = models.IntegerField(default=1)
    activo = models.BooleanField(default=True)

    def clean(self):
        if Cocktail.objects.filter(nombre__iexact=self.nombre).exclude(pk=self.pk).exists():
            raise ValidationError(f"Ya existe un cóctel con el nombre '{self.nombre}'. Elija otro nombre.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


    class Meta:
        db_table = "cocktail"
        managed = False 


    def __str__(self):
        return f"{self.nombre} - ${self.precioporunidad}"
