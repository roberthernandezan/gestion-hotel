from django.db import models
from .ingredientes import Ingredientes
from .ordenes import Ordenes

class RegistroMovimientos(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_ingredientes = models.ForeignKey(
        Ingredientes, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        to_field='id_ingredientes', 
        db_column="id_ingredientes"
        )
    id_orden = models.ForeignKey(
        Ordenes,
        on_delete=models.CASCADE,
        to_field='id_orden', 
        db_column="id_orden")
    tipomovimiento = models.CharField(max_length=50)
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)
    fechamovimiento = models.DateTimeField(auto_now_add=True)
    origen = models.CharField(max_length=50)

    class Meta:
        db_table = "registromovimientos"
        managed = False  

    def __str__(self):
        return f"{self.tipomovimiento} - {self.id_ingredientes.nombre} - {self.cantidad}L"
