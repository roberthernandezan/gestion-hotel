from django.db import models
from .huesped import Huesped
from .habitaciones import Habitaciones

class RegistroEstancias(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_huesped = models.ForeignKey(
        Huesped, 
        on_delete=models.CASCADE,
        to_field='id_huesped', 
        db_column="id_huesped")
    numerohabitacion = models.ForeignKey(
        Habitaciones, 
        on_delete=models.CASCADE,
        to_field='numerohabitacion', 
        db_column="numerohabitacion")
    timestamp = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField()

    class Meta:
        db_table = "registroestancias"
        managed = False 


    def __str__(self):
        return f"{self.descripcion} - {self.id_huesped} en {self.numerohabitacion}"
