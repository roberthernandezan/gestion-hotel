from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from gestion.models import Ordenes, AsignacionesHuespedes


@receiver([post_save, post_delete], sender=Ordenes)
def actualizar_pagorealizado_asignacion(sender, instance, **kwargs):
    asignacion = instance.id_asignacion

    if asignacion.numerohabitacion.todoincluido:
        asignacion.pagorealizado = True
        asignacion.save()
        return

    ordenes_activas = asignacion.ordenes_set.filter(actividad=True, preciototal__gt=0)

    if ordenes_activas.exists():
        asignacion.pagorealizado = False
    else:
        asignacion.pagorealizado = True

    asignacion.save()
