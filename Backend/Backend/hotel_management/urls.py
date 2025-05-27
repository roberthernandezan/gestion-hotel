# C:\Users\Robert\OneDrive\Desktop\Django_test\hotel_management\urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('gestion.urls')),  # Asegúrate de que 'gestion' es el nombre correcto de tu app.
]
