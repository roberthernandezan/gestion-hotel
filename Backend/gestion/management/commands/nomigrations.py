from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Desactiva migraciones automáticas de Django."

    def handle(self, *args, **kwargs):
        print("Migraciones automáticas desactivadas.")
