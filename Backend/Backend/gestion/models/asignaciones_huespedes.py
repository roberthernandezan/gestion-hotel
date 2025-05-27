from django.core.exceptions import ValidationError
from django.db import models
from .huesped import Huesped
from .habitaciones import Habitaciones
from datetime import datetime

class AsignacionesHuespedes(models.Model):
    id_asignacion = models.AutoField(primary_key=True)
    id_huesped = models.ForeignKey(
        Huesped, 
        on_delete=models.CASCADE,
        to_field="id_huesped",
        db_column="id_huesped")
    numerohabitacion = models.ForeignKey(
        Habitaciones, 
        on_delete=models.CASCADE,
        to_field="numerohabitacion",
        db_column="numerohabitacion")
    fechaasignacion = models.DateTimeField(auto_now_add=True)
    enhotel = models.BooleanField(default=True)
    pagorealizado = models.BooleanField(default=True)
    fechacheckout = models.DateTimeField(null=True, blank=True)


    def clean(self):
        if AsignacionesHuespedes.objects.filter(id_huesped=self.id_huesped, enhotel=True).exclude(pk=self.pk).exists():
            raise ValidationError(f"El huésped {self.id_huesped.nombre} ya tiene un check-in activo.")
       
        if not self.enhotel:
            try:
                original = AsignacionesHuespedes.objects.get(pk=self.pk)
                if original.enhotel is False and self.enhotel is False:
                    return
            except AsignacionesHuespedes.DoesNotExist:
                pass 
            if not AsignacionesHuespedes.objects.filter(id_huesped=self.id_huesped, enhotel=True).exists():
                raise ValidationError(f"El huésped {self.id_huesped.nombre} no tiene un check-in activo para realizar un check-out.")

        if not self.pagorealizado and not self.enhotel:
            raise ValidationError(f"El huésped {self.id_huesped.nombre} no puede realizar el check-out porque tiene órdenes activas sin saldar.")


    def actualizar_repetidor_huesped(self):
        """
        Actualiza el campo `repetidor` del huésped asociado si tiene más de una asignación.
        """
        asignaciones_count = AsignacionesHuespedes.objects.filter(id_huesped=self.id_huesped).count()
        self.id_huesped.repetidor = asignaciones_count > 1
        self.id_huesped.save()

    def actualizar_fechacheckout(self):
        """
        Actualiza la fecha de check-out al momento de realizar el check-out.
        """
        if not self.enhotel and not self.fechacheckout:
            self.fechacheckout = datetime.now()
    

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        self.actualizar_repetidor_huesped()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.actualizar_repetidor_huesped()

    class Meta:
        db_table = "asignacioneshuespedes"
        managed = False


    def __str__(self):
        estado = "Check-in activo" if self.enhotel else "Check-out realizado"
        return f"Huésped: {self.id_huesped.nombre} - Habitación: {self.numerohabitacion} - Estado: {estado}"

