from django.db import models
from .ingredientes import Ingredientes

class MovimientosStock(models.Model):
    id_movimiento = models.AutoField(primary_key=True)
    id_ingredientes = models.ForeignKey(
        Ingredientes, 
        on_delete=models.CASCADE,
        to_field='id_ingredientes',  
        db_column="id_ingredientes")  
    tipomovimiento = models.CharField(max_length=50)
    cantidad = models.DecimalField(max_digits=15, decimal_places=6)
    fechamovimiento = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "movimientosstock"
        managed = False  


    def __str__(self):
        return f"{self.tipomovimiento} - {self.cantidad}L de {self.id_ingredientes.nombre}"
