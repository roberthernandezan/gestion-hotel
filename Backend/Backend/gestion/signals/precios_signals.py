from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from gestion.models import OrdenElementos, Ingredientes, Cocktail, Ordenes

@receiver(pre_save, sender=OrdenElementos)
def calcular_precio_orden_elemento(sender, instance, **kwargs):
    if instance.escocktail: 
        try:
            cocktail = Cocktail.objects.get(id_cocktail=instance.id_cocktail.id_cocktail)
            instance.preciototal = cocktail.precioporunidad * instance.cantidad
        except Cocktail.DoesNotExist:
            raise ValueError(f"No se encontró el cóctel con ID {instance.id_cocktail.id_cocktail}")
    else:  
        try:
            ingrediente = Ingredientes.objects.get(id_ingredientes=instance.id_ingredientes.id_ingredientes)
            instance.preciototal = ingrediente.precioporunidad * instance.cantidad
        except Ingredientes.DoesNotExist:
            raise ValueError(f"No se encontró el ingrediente con ID {instance.id_ingredientes.id_ingredientes}")


@receiver([post_save, post_delete], sender=OrdenElementos)
def actualizar_precio_total_orden(sender, instance, **kwargs):
    try:
        precio_total = OrdenElementos.objects.filter(id_orden=instance.id_orden).aggregate(
            total=Sum('preciototal')
        )['total'] or 0  

        orden = Ordenes.objects.get(id_orden=instance.id_orden.id_orden)
        orden.preciototal = precio_total
        orden.save()

    except Ordenes.DoesNotExist:
        print(f"No se encontró la orden con ID {instance.id_orden.id_orden}")
