from django.db import models

class Bares(models.Model):
    id_bar = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    ubicacion = models.CharField(max_length=255, blank=True, null=True)
    activo = models.BooleanField(default=True) 

    class Meta:
        db_table = "bares"
        managed = False  


    def __str__(self):
        return f"{self.nombre} - {self.ubicacion}"
 