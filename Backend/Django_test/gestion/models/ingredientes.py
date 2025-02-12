from django.core.exceptions import ValidationError
from django.db import models

class Ingredientes(models.Model):
    id_ingredientes = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255, unique=True)
    alcohol = models.BooleanField()
    precioporunidad = models.DecimalField(max_digits=10, decimal_places=2)
    litrosporunidad = models.DecimalField(max_digits=10, decimal_places=3, default=1.0)
    cantidadactual = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    activo = models.BooleanField(default=True)

    def clean(self):
        if Ingredientes.objects.filter(nombre__iexact=self.nombre).exclude(pk=self.pk).exists():
            raise ValidationError(f"Ya existe un ingrediente con el nombre '{self.nombre}'. Elija otro nombre.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


    class Meta:
        db_table = "ingredientes"
        managed = False 

    def __str__(self):
        return f"{self.nombre} - {self.cantidadactual}L"
