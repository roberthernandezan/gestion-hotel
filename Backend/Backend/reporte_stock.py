import pandas as pd
import math

def reporte_rebastecimiento_desglosado(predicciones_path, archivo_stock):
    predicciones = pd.read_excel(predicciones_path)

    stock_actual = pd.read_excel(archivo_stock)

    cantidad_actual = dict(zip(stock_actual["Ingrediente"], stock_actual["Cantidad Actual"]))

    predicciones["Fecha"] = pd.to_datetime(predicciones["Fecha"])
    predicciones = predicciones.sort_values(by=["Ingrediente", "Fecha"])

    predicciones_filtradas = predicciones.groupby("Ingrediente").head(3)

    reporte = predicciones_filtradas[["Ingrediente", "Fecha", "Consumo Predicho"]].copy()

    reporte["Cantidad_Actual"] = reporte["Ingrediente"].map(cantidad_actual).fillna(0)

    stock_restante = cantidad_actual.copy()  

    def calcular_rebastecimiento(row):
        ingrediente = row["Ingrediente"]
        consumo = row["Consumo Predicho"]

        consumo_ajustado = consumo * 1.1

        if ingrediente not in stock_restante:
            stock_restante[ingrediente] = 0

        if stock_restante[ingrediente] >= consumo_ajustado:
            stock_restante[ingrediente] -= consumo_ajustado
            return 0
        else:
            rebastecimiento = math.ceil(consumo_ajustado - stock_restante[ingrediente])
            stock_restante[ingrediente] = 0
            return rebastecimiento

    reporte["Rebastecimiento_Recomendado"] = reporte.apply(calcular_rebastecimiento, axis=1)

    reporte.to_excel("reporte_rebastecimiento.xlsx", index=False)
    print("Reporte generado: reporte_rebastecimiento.xlsx")

    return reporte


predicciones_path = r"C:\Users\Robert\OneDrive\Desktop\Django_test\predicciones_12_meses.xlsx"
archivo_stock = r"C:\Users\Robert\OneDrive\Desktop\Django_test\stock_actual.xlsx"
reporte_rebastecimiento = reporte_rebastecimiento_desglosado(predicciones_path, archivo_stock)


print(reporte_rebastecimiento)
