from django.db import models
from .huesped import Huesped
from .habitaciones import Habitaciones
from .ordenes import Ordenes
from .bares import Bares
from .empleados import Empleados

class RegistroOrdenes(models.Model):
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
    id_orden = models.ForeignKey(
        Ordenes, 
        on_delete=models.CASCADE,
        to_field='id_orden', 
        db_column="id_orden")
    id_bar = models.ForeignKey(
        Bares, 
        on_delete=models.CASCADE,
        to_field='id_bar', 
        db_column="id_bar")
    id_empleado = models.ForeignKey(
        Empleados, 
        on_delete=models.CASCADE,
        to_field='id_empleado', 
        db_column="id_empleado")
    fechahora = models.DateTimeField(auto_now_add=True)
    detalleorden = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "registroordenes"
        managed = False 

    def __str__(self):
        return (
            f"Orden {self.id_orden.id_orden} - "
            f"Huesped {self.id_huesped.nombre} - "
            f"Habitación {self.numerohabitacion.numerohabitacion}"
        )