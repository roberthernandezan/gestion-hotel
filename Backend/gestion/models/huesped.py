from django.db import models
from django.core.exceptions import ValidationError

class Huesped(models.Model):
    id_huesped = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    edad = models.PositiveIntegerField()
    nacionalidad = models.CharField(max_length=255)
    id_unico_huesped = models.BigIntegerField(unique=True)
    repetidor = models.BooleanField(default=False)
    activo = models.BooleanField(default=True) 


    class Meta:
        db_table = "huesped"
        managed = False  

    def __str__(self):
        return f"{self.nombre} ({self.id_unico_huesped})"
 