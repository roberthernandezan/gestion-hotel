# gestion/__init__.py

# Asegura que las señales se registren correctamente
default_app_config = 'gestion.apps.GestionConfig'

# Importa automáticamente signals
from .signals import *
