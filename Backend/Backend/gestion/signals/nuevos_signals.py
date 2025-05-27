from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from gestion.models import Ingredientes, Cocktail, RegistroMovimientos

@receiver(pre_save, sender=Ingredientes)
def registrar_cambios_estado_ingrediente(sender, instance, **kwargs):
    try:
        original = Ingredientes.objects.get(pk=instance.pk)

        if original.activo and not instance.activo:
            RegistroMovimientos.objects.create(
                id_ingredientes=instance,
                tipomovimiento=f"Desactivación de Ingrediente: {instance.nombre}",
                cantidad=0,
                origen="Ingredientes"
            )
            print(f"Ingrediente desactivado registrado: {instance.nombre}")

        if not original.activo and instance.activo:
            RegistroMovimientos.objects.create(
                id_ingredientes=instance,
                tipomovimiento=f"Reactivación de Ingrediente: {instance.nombre}",
                cantidad=0,
                origen="Ingredientes"
            )
            print(f"Reactivación de ingrediente registrada: {instance.nombre}")

    except Ingredientes.DoesNotExist:
        pass


@receiver(post_save, sender=Ingredientes)
def registrar_nuevo_ingrediente(sender, instance, created, **kwargs):
    if created:  
        RegistroMovimientos.objects.create(
            id_ingredientes=instance,
            tipomovimiento=f"Nuevo Ingrediente: {instance.nombre}",
            cantidad=instance.cantidadactual,
            origen="Ingredientes"
        )
        print(f"Nuevo ingrediente registrado en movimientos: {instance.nombre}")


@receiver(pre_save, sender=Cocktail)
def registrar_cambios_estado_cocktail(sender, instance, **kwargs):
    try:
        original = Cocktail.objects.get(pk=instance.pk)

        if original.activo and not instance.activo:
            RegistroMovimientos.objects.create(
                id_ingredientes=None,  
                tipomovimiento=f"Desactivación de Cocktail: {instance.nombre}",
                cantidad=0,
                origen="Cocktail"
            )
            print(f"Cóctel desactivado registrado: {instance.nombre}")

        if not original.activo and instance.activo:
            RegistroMovimientos.objects.create(
                id_ingredientes=None,
                tipomovimiento=f"Reactivación de Cocktail: {instance.nombre}",
                cantidad=0,
                origen="Cocktail"
            )
            print(f"Reactivación de cóctel registrada: {instance.nombre}")

    except Cocktail.DoesNotExist:
        pass

@receiver(post_save, sender=Cocktail)
def registrar_nuevo_cocktail(sender, instance, created, **kwargs):
    if created:  
        RegistroMovimientos.objects.create(
            id_ingredientes=None,
            tipomovimiento=f"Nuevo Cocktail: {instance.nombre}",
            cantidad=0,
            origen="Cocktail"
        )
        print(f"Nuevo cóctel registrado en movimientos: {instance.nombre}")
