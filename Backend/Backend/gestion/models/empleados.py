from django.db import models

class Empleados(models.Model):
    id_empleado = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    puesto = models.CharField(max_length=255)
    password = models.CharField(max_length=4)  
    activo = models.BooleanField(default=True) 



    class Meta:
        db_table = "empleados"
        managed = False  

    def __str__(self):
        return f"{self.nombre} ({self.puesto})"
 