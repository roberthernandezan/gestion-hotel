from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from .models import (Ingredientes, Cocktail, AsignacionesHuespedes, Huesped,
                     Ordenes, OrdenElementos, Bares, Empleados, Habitaciones,
                     CocktailIngredientes, MovimientosStock, RegistroEstancias,
                     RegistroMovimientos, RegistroOrdenes)

class AsignacionesHuespedesSerializer(serializers.ModelSerializer):
    id_huesped_nombre = serializers.CharField(source="id_huesped.nombre", read_only=True)
    numerohabitacion = serializers.IntegerField(source="numerohabitacion.numerohabitacion", read_only=True)
    todoincluido = serializers.BooleanField(source="numerohabitacion.todoincluido", read_only=True)

    class Meta:
        model = AsignacionesHuespedes
        fields = [
            "id_asignacion",
            "id_huesped_nombre",
            "id_huesped",
            "numerohabitacion",
            "enhotel",
            "pagorealizado",
            "fechaasignacion",
            "todoincluido",
        ]

class OrdenesSerializer(serializers.ModelSerializer):
    huesped_nombre = serializers.CharField(source="id_asignacion.id_huesped.nombre", read_only=True)
    habitacion = serializers.IntegerField(source="id_asignacion.numerohabitacion.numerohabitacion", read_only=True)
    empleado_nombre = serializers.CharField(source="id_empleado.nombre", read_only=True)
    bar_nombre = serializers.CharField(source="id_bar.nombre", read_only=True)
    todoincluido = serializers.BooleanField(source="id_asignacion.numerohabitacion.todoincluido", read_only=True)


    class Meta:
        model = Ordenes
        fields = [
            "id_orden",
            "id_asignacion",
            "huesped_nombre",
            "habitacion",
            "empleado_nombre",
            "preciototal",
            "fechahora",
            "actividad",
            "bar_nombre",
            "todoincluido",
        ]

class OrdenElementosSerializer(serializers.ModelSerializer):
    nombre = serializers.SerializerMethodField()
    habitacion = serializers.SerializerMethodField()

    class Meta:
        model = OrdenElementos
        fields = ['id_elemento', 'cantidad', 'preciototal', 'escocktail', 'nombre', 'habitacion']

    def get_nombre(self, obj):
        try:
            if obj.escocktail and obj.id_cocktail:
                return obj.id_cocktail.nombre
            elif not obj.escocktail and obj.id_ingredientes:
                return obj.id_ingredientes.nombre
        except AttributeError:
            return "Desconocido"

    def get_habitacion(self, obj):
        try:
            return obj.id_orden.id_asignacion.numerohabitacion.numerohabitacion
        except AttributeError:
            return None 


class OrdenElementosCrearSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdenElementos
        fields = ['id_cocktail', 'id_ingredientes', 'cantidad', 'escocktail']

    def validate(self, data):
        if not data.get('id_cocktail') and not data.get('id_ingredientes'):
            raise serializers.ValidationError("Debe proporcionar al menos id_cocktail o id_ingredientes.")
        return data


class CrearOrdenConElementosSerializer(serializers.ModelSerializer):
    elementos = OrdenElementosCrearSerializer(many=True)

    class Meta:
        model = Ordenes
        fields = ['id_asignacion', 'id_bar', 'id_empleado', 'preciototal', 'elementos']

    def create(self, validated_data):
        elementos_data = validated_data.pop('elementos')
        with transaction.atomic():
            orden = Ordenes.objects.create(**validated_data)
            for elemento_data in elementos_data:
                OrdenElementos.objects.create(id_orden=orden, **elemento_data)
        return orden

class BaresSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bares
        fields = '__all__'

        
    def validate_nombre(self, value):
        if Bares.objects.filter(nombre=value).exists():
            raise serializers.ValidationError("Ya existe un bar con este nombre.")
        return value

class EmpleadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleados
        fields = '__all__'

    def validate_password(self, value):
        if not value.isdigit() or len(value) != 4:
            raise serializers.ValidationError("La contraseña debe ser numérica y de 4 dígitos.")
        return value


class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleados
        fields = '__all__'


class IngredientesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredientes
        fields = ["id_ingredientes", "nombre", "alcohol", "precioporunidad",
        "cantidadactual", "litrosporunidad", "activo"]

class CocktailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cocktail
        fields = ["id_cocktail", "nombre", "precioporunidad", "tienereceta",
        "version", "activo"]

class CrearOrdenSerializer(serializers.ModelSerializer):
    id_asignacion = serializers.PrimaryKeyRelatedField(
        queryset=AsignacionesHuespedes.objects.all()
    )

    class Meta:
        model = Ordenes
        fields = ["id_asignacion", "id_bar", "id_empleado"]

    def validate(self, data):
        empleado = data.get('id_empleado')
        if not empleado.activo:
            raise serializers.ValidationError("El empleado seleccionado está inactivo.")

        bar = data.get('id_bar')
        if not bar.activo:
            raise serializers.ValidationError("El bar seleccionado está inactivo.")

        asignacion = data.get('id_asignacion')
        if not asignacion.enhotel:
            raise serializers.ValidationError("La asignación seleccionada no está activa.")

        return data


class CrearOrdenElementoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdenElementos
        fields = ["id_orden", "id_cocktail", "id_ingredientes", "cantidad", "escocktail"]

    def validate(self, data):
        if isinstance(data.get("id_orden"), Ordenes):
            data["id_orden"] = data["id_orden"].id_orden

        if "id_ingredientes" in data and isinstance(data["id_ingredientes"], Ingredientes):
            data["id_ingredientes"] = data["id_ingredientes"].id_ingredientes

        if "id_cocktail" in data and isinstance(data["id_cocktail"], Cocktail):
            data["id_cocktail"] = data["id_cocktail"].id_cocktail

        if not data.get("id_ingredientes") and not data.get("id_cocktail"):
            raise serializers.ValidationError("Debe proporcionar al menos id_ingredientes o id_cocktail.")

        return data


class CocktailIngredientesSerializer(serializers.ModelSerializer):
    id_ingredientes_nombre = serializers.CharField(
        source='id_ingredientes.nombre', 
        read_only=True
    )

    class Meta:
        model = CocktailIngredientes
        fields = ['id_registro', 'cantidad', 'version', 'id_ingredientes_nombre', 
                  'id_ingredientes']


class CrearCocktailIngredientesSerializer(serializers.ModelSerializer):
    id_cocktail = serializers.PrimaryKeyRelatedField(queryset=Cocktail.objects.all())
    id_ingredientes = serializers.PrimaryKeyRelatedField(queryset=Ingredientes.objects.all())

    class Meta:
        model = CocktailIngredientes
        fields = ['id_cocktail', 'id_ingredientes', 'cantidad']

    def validate_cantidad(self, value):
        try:
            value = Decimal(value)
        except Exception:
            raise serializers.ValidationError("La cantidad debe ser un número decimal válido.")
        
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor que 0.")
        
        if value.as_tuple().exponent < -3:
            raise serializers.ValidationError("La cantidad no puede tener más de 3 decimales.")
        
        return value

    def validate(self, data):
        if not data['id_ingredientes'].activo:
            raise serializers.ValidationError("El ingrediente seleccionado está inactivo.")
        return data


class UpdateCocktailIngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CocktailIngredientes
        fields = ['activo']

    def update(self, instance, validated_data):
        instance.activo = validated_data.get('activo', instance.activo)
        instance.save()
        return instance
    
class CrearIngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredientes
        fields = ["nombre", "litrosporunidad", "precioporunidad", "alcohol"]

    def validate_precio_por_unidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor que 0.")
        return value

    def validate_litrosporunidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("Los litros por unidad deben ser mayores que 0.")
        return value


class CrearCocktailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cocktail
        fields = ["nombre", "precioporunidad"]

    def validate_precio_por_unidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor que 0.")
        return value


class HuespedSerializer(serializers.ModelSerializer):
    EnHotel = serializers.BooleanField(source="en_hotel", read_only=True)
    pagoRealizado = serializers.BooleanField(source="pagorealizado", read_only=True)

    class Meta:
        model = Huesped
        fields = [
            "id_huesped",
            "nombre",
            "edad",
            "nacionalidad",
            "id_unico_huesped",
            "repetidor",
            "EnHotel",
            "pagoRealizado",
            "activo",
        ]


class HabitacionDisponibleSerializer(serializers.ModelSerializer):
    ocupada = serializers.SerializerMethodField()
    llena = serializers.SerializerMethodField()
    numero_personas = serializers.SerializerMethodField()

    class Meta:
        model = Habitaciones
        fields = ["numerohabitacion", "capacidad", "todoincluido", "ocupada", "llena", "numero_personas"]

    def get_ocupada(self, obj):
        return AsignacionesHuespedes.objects.filter(numerohabitacion=obj, enhotel=True).exists()

    def get_llena(self, obj):
        asignaciones_activas = AsignacionesHuespedes.objects.filter(numerohabitacion=obj, enhotel=True).count()
        return asignaciones_activas >= obj.capacidad

    def get_numero_personas(self, obj):
        return AsignacionesHuespedes.objects.filter(numerohabitacion=obj, enhotel=True).count()


class HabitacionesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habitaciones
        fields = '__all__'


class AsignacionesHuespedesDetailSerializer(serializers.ModelSerializer):
    nombre_huesped = serializers.CharField(source="id_huesped.nombre", read_only=True)
    id_unico_huesped = serializers.CharField(source="id_huesped.id_unico_huesped", read_only=True)

    class Meta:
        model = AsignacionesHuespedes
        fields = [
            "id_asignacion",
            "id_huesped",
            "nombre_huesped",  
            "id_unico_huesped", 
            "numerohabitacion",
            "fechaasignacion",
            "fechacheckout",
            "enhotel",
            "pagorealizado",
        ]

class CrearAsignacionSerializer(serializers.ModelSerializer):
    id_huesped = serializers.PrimaryKeyRelatedField(
        queryset=Huesped.objects.all(),
        error_messages={'does_not_exist': 'El huésped especificado no existe.',
                        'required': 'Este campo es requerido.'}
    )
    numerohabitacion = serializers.PrimaryKeyRelatedField(
        queryset=Habitaciones.objects.all(),
        error_messages={'does_not_exist': 'La habitación especificada no existe.',
                        'required': 'Este campo es requerido.'}
    )

    class Meta:
        model = AsignacionesHuespedes
        fields = ['id_huesped', 'numerohabitacion', 'enhotel']


class MovimientoStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientosStock
        fields = ['id_movimiento', 'tipomovimiento', 'cantidad', 'fechamovimiento']

    def validate(self, data):
        if data['cantidad'] <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0.")
        if data['tipomovimiento'] not in ['Reabastecimiento', 'Pérdida']:
            raise serializers.ValidationError("El tipo de movimiento debe ser 'Reabastecimiento' o 'Pérdida'.")
        return data
    

class RegistroOrdenesSerializer(serializers.ModelSerializer):
    id_huesped = HuespedSerializer(read_only=True)
    numerohabitacion = HabitacionesSerializer(read_only=True)
    id_orden = OrdenesSerializer(read_only=True)
    id_bar = BaresSerializer(read_only=True)
    id_empleado = EmpleadoSerializer(read_only=True)

    class Meta:
        model = RegistroOrdenes
        fields = '__all__'

class RegistroMovimientosSerializer(serializers.ModelSerializer):
    id_ingredientes = serializers.StringRelatedField()
    id_orden = OrdenesSerializer(read_only=True)

    class Meta:
        model = RegistroMovimientos
        fields = '__all__'

class RegistroEstanciasSerializer(serializers.ModelSerializer):
    id_huesped = HuespedSerializer(read_only=True)
    numerohabitacion = HabitacionesSerializer(read_only=True)

    class Meta:
        model = RegistroEstancias
        fields = '__all__'
