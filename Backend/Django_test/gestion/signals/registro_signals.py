from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from gestion.models import (
    AsignacionesHuespedes, RegistroEstancias, OrdenElementos, RegistroMovimientos,
    Ingredientes, MovimientosStock, RegistroOrdenes, Ordenes, Empleados, Bares
)

@receiver(post_save, sender=AsignacionesHuespedes)
def registrar_checkin(sender, instance, created, **kwargs):
    if created:  
        descripcion = (
            f"Check-in - Huésped {instance.id_huesped.nombre} "
            f"en habitación {instance.numerohabitacion.numerohabitacion}"
        )
        RegistroEstancias.objects.create(
            id_huesped=instance.id_huesped,
            numerohabitacion=instance.numerohabitacion,
            descripcion=descripcion
        )

@receiver(pre_save, sender=AsignacionesHuespedes)
def registrar_cambio_estancia(sender, instance, **kwargs):
    try:
        original = AsignacionesHuespedes.objects.get(id_asignacion=instance.id_asignacion)
        if original.enhotel and not instance.enhotel:
            descripcion = (
                f"Check-out - Huésped {instance.id_huesped.nombre} "
                f"salió de la habitación {instance.numerohabitacion.numerohabitacion}"
            )
            RegistroEstancias.objects.create(
                id_huesped=instance.id_huesped,
                numerohabitacion=instance.numerohabitacion,
                descripcion=descripcion
            )
    except AsignacionesHuespedes.DoesNotExist:
        pass  

@receiver(post_save, sender=MovimientosStock)
def registrar_movimiento(sender, instance, created, **kwargs):
    if created:
        RegistroMovimientos.objects.create(
            id_ingredientes=instance.id_ingredientes,
            id_orden=None,  
            tipomovimiento=instance.tipomovimiento,
            cantidad=instance.cantidad,
            origen="MovimientoStock"
        )

@receiver(post_save, sender=OrdenElementos)
def registrar_orden(sender, instance, created, **kwargs):
    if created:
        if instance.escocktail:
            nombre_elemento = instance.id_cocktail.nombre
            tipo_elemento = "Cóctel"
        else:
            nombre_elemento = instance.id_ingredientes.nombre
            tipo_elemento = "Ingrediente"

        detalle = (
            f"{tipo_elemento}: {nombre_elemento} | "
            f"Cantidad: {instance.cantidad} | "
            f"Precio Total: {instance.preciototal:.2f} €"
        )
        RegistroOrdenes.objects.create(
            id_huesped=instance.id_orden.id_asignacion.id_huesped,
            numerohabitacion=instance.id_orden.id_asignacion.numerohabitacion,
            id_orden=instance.id_orden,
            id_bar=instance.id_orden.id_bar,
            id_empleado=instance.id_orden.id_empleado,
            detalleorden=detalle
        )