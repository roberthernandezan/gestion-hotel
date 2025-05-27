#!/usr/bin/env python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from openpyxl.utils import get_column_letter
import warnings
warnings.filterwarnings("ignore")

# =============================================================================
# 1. Generación de datos sintéticos con patrones definidos
# =============================================================================
# Definimos dos elementos
elementos = ['Elemento A', 'Elemento B']

# Definimos las fechas: desde enero de 2022 hasta enero de 2025 (37 meses)
fechas = pd.date_range(start='2022-01-01', periods=37, freq='MS')

# Definimos los patrones manualmente para cada elemento y año
# Para Elemento A:
patron_A = {
    2022: [40, 41, 42, 43, 44, 45, 44, 43, 42, 41, 40, 38],
    2023: [45, 46, 47, 48, 49, 50, 49, 48, 47, 46, 45, 43],
    2024: [50, 52, 54, 56, 58, 60, 59, 58, 57, 56, 55, 54],
    2025: [60]  # Solo enero
}

# Para Elemento B:
patron_B = {
    2022: [50, 50, 50, 50, 50, 45, 45, 45, 48, 48, 51, 51],
    2023: [47, 47, 47, 47, 47, 42, 42, 42, 45, 45, 48, 48],
    2024: [44, 44, 44, 44, 44, 39, 39, 39, 42, 42, 45, 45],
    2025: [41]  # Solo enero
}

datos = []
# Recorremos cada elemento y asignamos los valores según el año y mes
for elem in elementos:
    if elem == 'Elemento A':
        patron = patron_A
    else:
        patron = patron_B
    # Para cada año en el patrón
    for anio, valores in patron.items():
        # Para cada mes del año (suponiendo que si es 2025 solo hay enero)
        for i, valor in enumerate(valores):
            # Generamos la fecha: usamos el primer día del mes correspondiente
            # i va de 0 a 11 (o 0 en 2025)
            mes = i + 1
            fecha = pd.Timestamp(year=anio, month=mes, day=1)
            datos.append({
                'Elemento': elem,
                'Fecha': fecha,
                'Consumo Total': valor
            })

df_datos = pd.DataFrame(datos)
df_datos['Año'] = df_datos['Fecha'].dt.year
df_datos['Mes'] = df_datos['Fecha'].dt.month

print("=== Datos Sintéticos Generados ===")
print(df_datos.head(10))
print(f"Total de registros: {len(df_datos)}\n")

# Creamos una tabla pivot para visualizar los datos de entrada
df_input = df_datos.pivot_table(index=['Elemento', 'Año'], columns='Mes', values='Consumo Total')
df_input = df_input.reindex(columns=range(1, 13), fill_value=0)
month_abbrev = {1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun", 
                7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"}
df_input.rename(columns=month_abbrev, inplace=True)
df_input.reset_index(inplace=True)
df_input = df_input.round(2)

print("=== Datos Sintéticos Pivot ===")
print(df_input.head(15))

# =============================================================================
# 2. Ajuste del modelo SARIMAX, validación cruzada, grid search y diagnóstico gráfico
# =============================================================================
n_pronosticos = 12  # Pronosticamos 12 meses hacia adelante
predicciones_totales = pd.DataFrame()

for elem in elementos:
    print(f"\n--- Procesando {elem} ---")
    df_elem = df_datos[df_datos["Elemento"] == elem].copy()
    df_elem.set_index("Fecha", inplace=True)
    df_elem.sort_index(inplace=True)
    
    print("Serie histórica original:")
    print(df_elem["Consumo Total"].head())
    print("Últimos 3 registros:")
    print(df_elem["Consumo Total"].tail(3))
    
    # Transformamos con log1p para estabilizar la varianza.
    serie_log = np.log1p(df_elem["Consumo Total"])
    print("Serie transformada (log1p):")
    print(serie_log.head())
    
    # ---------------------------
    # Grid search: Buscamos la combinación de parámetros que minimice el AIC.
    best_aic = np.inf
    best_order = None
    best_seasonal_order = None
    best_model = None
    
    for p in range(0, 3):
        for d in range(0, 2):
            for q in range(0, 3):
                for P in range(0, 2):
                    for D in range(0, 2):
                        for Q in range(0, 2):
                            try:
                                mod = SARIMAX(serie_log, order=(p, d, q),
                                              seasonal_order=(P, D, Q, 12),
                                              enforce_stationarity=False,
                                              enforce_invertibility=False)
                                res = mod.fit(disp=False, maxiter=300, method='lbfgs')
                                if res.aic < best_aic:
                                    best_aic = res.aic
                                    best_order = (p, d, q)
                                    best_seasonal_order = (P, D, Q, 12)
                                    best_model = res
                            except Exception:
                                continue

    print(f"Mejor modelo para {elem}: order={best_order}, seasonal_order={best_seasonal_order}, AIC={best_aic:.2f}")
    
    # ---------------------------
    # Validación Cruzada: usar los últimos 12 meses como test
    if len(df_elem) > 12:
        train = df_elem["Consumo Total"].iloc[:-12]
        test = df_elem["Consumo Total"].iloc[-12:]
        train_log = np.log1p(train)
        try:
            mod_cv = SARIMAX(train_log, order=best_order, seasonal_order=best_seasonal_order,
                             enforce_stationarity=False, enforce_invertibility=False)
            res_cv = mod_cv.fit(disp=False, maxiter=300, method='lbfgs')
            forecast_cv_log = res_cv.get_forecast(steps=len(test)).predicted_mean
            forecast_cv = np.expm1(forecast_cv_log)
            
            errors = test - forecast_cv
            mae = np.mean(np.abs(errors))
            rmse = np.sqrt(np.mean(errors**2))
            mape = np.mean(np.abs(errors / test)) * 100
            print(f"Errores de validación para {elem}: MAE={mae:.2f}, RMSE={rmse:.2f}, MAPE={mape:.2f}%")
        except Exception as e:
            print(f"Error en validación cruzada para {elem}: {e}")
    
    # ---------------------------
    # Pronóstico: se pronostican los siguientes 12 meses.
    forecast_start = df_elem.index[-1] + pd.DateOffset(months=1)
    forecast_index = pd.date_range(start=forecast_start, periods=n_pronosticos, freq='MS')
    forecast_obj = best_model.get_forecast(steps=n_pronosticos)
    prediccion_log = forecast_obj.predicted_mean
    conf_int = forecast_obj.conf_int()
    
    # Invertimos la transformación logarítmica y redondeamos a 2 decimales.
    prediccion = np.expm1(prediccion_log).round(2)
    conf_int_exp = np.expm1(conf_int).round(2)
    
    df_pronostico = pd.DataFrame({
        "Elemento": elem,
        "Fecha": forecast_index,
        "Consumo Predicho": prediccion.values,
        "Límite Inferior": conf_int_exp.iloc[:, 0].values,
        "Límite Superior": conf_int_exp.iloc[:, 1].values
    })
    
    predicciones_totales = pd.concat([predicciones_totales, df_pronostico], ignore_index=True)
    print(f"Predicción para {elem}:")
    print(df_pronostico)
    
    # ---------------------------
    # Gráficas de diagnóstico:
    residuals = best_model.resid
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))
    
    # 1. Serie histórica original
    axes[0, 0].plot(df_elem.index, df_elem["Consumo Total"], marker='o', label="Serie Original")
    axes[0, 0].set_title(f"Serie histórica - {elem}")
    axes[0, 0].legend()
    
    # 2. Serie histórica + Pronóstico
    axes[0, 1].plot(df_elem.index, df_elem["Consumo Total"], marker='o', label="Serie Original")
    axes[0, 1].plot(forecast_index, prediccion, marker='o', linestyle='--', color='red', label="Pronóstico")
    axes[0, 1].fill_between(forecast_index, conf_int_exp.iloc[:, 0], conf_int_exp.iloc[:, 1],
                            color='pink', alpha=0.3, label="Intervalo Confianza")
    axes[0, 1].set_title(f"Pronóstico - {elem}")
    axes[0, 1].legend()
    
    # 3. Residuos
    axes[1, 0].plot(residuals, marker='o', linestyle='-')
    axes[1, 0].set_title(f"Residuos - {elem}")
    
    # 4. ACF de los residuos
    plot_acf(residuals, ax=axes[1, 1], lags=20)
    axes[1, 1].set_title(f"ACF de Residuos - {elem}")
    
    plt.tight_layout()
    plt.show()

# =============================================================================
# 3. Guardar las predicciones y los datos de entrada en un Excel organizado
# =============================================================================
ruta_reporte = "predicciones_sinteticas.xlsx"
with pd.ExcelWriter(ruta_reporte, engine="openpyxl") as writer:
    # Hoja de Predicciones: tabla pivot (Elementos, Año y columnas por mes)
    df_predicciones = predicciones_totales.copy()
    df_predicciones["Año"] = df_predicciones["Fecha"].dt.year
    df_predicciones["Mes"] = df_predicciones["Fecha"].dt.month
    pivot_pred = df_predicciones.pivot(index=["Elemento", "Año"], columns="Mes", values="Consumo Predicho")
    pivot_pred = pivot_pred.reindex(columns=range(1, 13), fill_value=0).astype(float)
    pivot_pred.rename(columns=month_abbrev, inplace=True)
    pivot_pred = pivot_pred.round(2)
    pivot_pred.reset_index(inplace=True)  # Estructura similar a la de entrada
    pivot_pred.to_excel(writer, index=False, sheet_name="Predicciones")
    
    # Hoja de Datos de Entrada
    df_input.to_excel(writer, index=False, sheet_name="Datos Entrada")
    
    # Autoajuste de columnas para ambas hojas
    for sheet in ["Predicciones", "Datos Entrada"]:
        worksheet = writer.sheets[sheet]
        for col in worksheet.columns:
            max_length = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                try:
                    if cell.value is not None:
                        max_length = max(max_length, len(str(cell.value)))
                except Exception:
                    pass
            worksheet.column_dimensions[col_letter].width = max_length + 2

print(f"Reporte guardado en: {ruta_reporte}")
