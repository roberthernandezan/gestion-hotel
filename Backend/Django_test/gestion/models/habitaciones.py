from django.db import models

class Habitaciones(models.Model):
    numerohabitacion = models.PositiveIntegerField(primary_key=True)
    todoincluido = models.BooleanField()
    ocupada = models.BooleanField(default=False)
    capacidad = models.PositiveIntegerField()
    activo = models.BooleanField(default=True) 

    class Meta:
        db_table = "habitaciones"
        managed = False  

    def __str__(self):
        return f"Habitación {self.numerohabitacion} - Capacidad {self.capacidad}"
 