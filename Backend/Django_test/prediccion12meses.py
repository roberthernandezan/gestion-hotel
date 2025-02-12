import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings
import numpy as np

warnings.filterwarnings("ignore")  # Ignorar advertencias

# Cargar el archivo con los datos organizados
datos = pd.read_excel("consumo_historico.xlsx")

# Validar y limpiar los datos, eliminando filas con valores faltantes en las columnas necesarias
datos = datos.dropna(subset=["Ingrediente", "Año", "Mes", "Consumo Total"])

# Crear un DataFrame para almacenar las predicciones de todos los ingredientes
predicciones_totales = pd.DataFrame(columns=["Ingrediente", "Fecha", "Consumo Predicho", "Límite Inferior", "Límite Superior"])

# Obtener la lista de ingredientes únicos
ingredientes = datos["Ingrediente"].unique()

# Iterar por cada ingrediente
for ingrediente in ingredientes:
    # Filtrar datos del ingrediente
    datos_ingrediente = datos[datos["Ingrediente"] == ingrediente]

    if datos_ingrediente.empty:
        print(f"No hay datos suficientes para el ingrediente {ingrediente}")
        continue

    try:
        # Crear una serie temporal con el consumo y las fechas
        serie = pd.Series(
            data=datos_ingrediente["Consumo Total"].values,
            index=pd.date_range(
                start=f"{int(datos_ingrediente['Año'].min())}-{int(datos_ingrediente['Mes'].min()):02d}-01",
                periods=len(datos_ingrediente),
                freq="M"
            )
        )

        # Aplicar transformación logarítmica para estabilizar la varianza
        serie_log = np.log1p(serie)

        # Ajustar el modelo SARIMAX
        modelo = SARIMAX(serie_log, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
        resultado = modelo.fit(disp=False)

        # Obtener la última fecha registrada en la serie
        ultima_fecha = serie.index[-1]

        # Realizar predicciones para los próximos 12 meses
        prediccion = resultado.get_forecast(steps=12)
        prediccion_medias = np.expm1(prediccion.predicted_mean)  # Revertir transformación logarítmica
        intervalo_confianza = np.expm1(prediccion.conf_int())  # Revertir transformación logarítmica

        # Crear un DataFrame para almacenar las predicciones del ingrediente
        df_predicciones = pd.DataFrame({
            "Ingrediente": ingrediente,
            "Fecha": pd.date_range(start=ultima_fecha + pd.DateOffset(months=1), periods=12, freq="M"),
            "Consumo Predicho": prediccion_medias.values,
            "Límite Inferior": intervalo_confianza.iloc[:, 0].values,
            "Límite Superior": intervalo_confianza.iloc[:, 1].values
        })

        # Agregar las predicciones al DataFrame total
        predicciones_totales = pd.concat([predicciones_totales, df_predicciones], ignore_index=True)

    except Exception as e:
        print(f"Error al procesar el ingrediente {ingrediente}: {e}")

# Exportar las predicciones a Excel
predicciones_totales.to_excel("predicciones_12_meses.xlsx", index=False)
print("Archivo de predicciones generado: predicciones_12_meses.xlsx")

# Imprimir las primeras filas del DataFrame de predicciones
print(predicciones_totales.head())
