from django.db import models
from .asignaciones_huespedes import AsignacionesHuespedes
from .bares import Bares
from .empleados import Empleados


class Ordenes(models.Model):
    id_orden = models.AutoField(primary_key=True)
    id_asignacion = models.ForeignKey(
        AsignacionesHuespedes, 
        on_delete=models.CASCADE, 
        to_field='id_asignacion', 
        db_column="id_asignacion")    
    preciototal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
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
    actividad = models.BooleanField(default=True)
    num_cocktails = models.IntegerField(default=0)
    num_ingredientes = models.IntegerField(default=0)

    class Meta:
        db_table = "ordenes"
        managed = False  
        
    def __str__(self):
        return f"Orden {self.id_orden} para la Asignación {self.id_asignacion.id_asignacion} en el Bar {self.id_bar.nombre}"

