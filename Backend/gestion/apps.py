from django.apps import AppConfig


class GestionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'gestion'

    def ready(self):
        import gestion.signals.registro_signals  

        #import gestion.signals.stock_signals  

        import gestion.signals.precios_signals

        import gestion.signals.nuevos_signals

        import gestion.signals.ordenes_signals
