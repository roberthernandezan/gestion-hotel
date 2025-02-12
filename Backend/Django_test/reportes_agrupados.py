import pandas as pd

def generar_reporte_predictivo(predicciones, categorias):
    predicciones['Categoría'] = predicciones['Ingrediente'].map(categorias)

    reporte_categorias = predicciones.groupby(['Categoría', 'Fecha']).agg(
        Consumo_Promedio=('Consumo Predicho', 'sum'),
        Límite_Inferior=('Límite Inferior', 'sum'),
        Límite_Superior=('Límite Superior', 'sum')
    ).reset_index()

    reporte_categorias['Alertas'] = reporte_categorias.apply(
        lambda row: "Posible desabastecimiento" if row['Consumo_Promedio'] > row['Límite_Superior'] * 0.9 else "Estable",
        axis=1
    )

    reporte_categorias.to_excel("reporte_predictivo.xlsx", index=False)
    print("Reporte generado: reporte_predictivo.xlsx")
    
    return reporte_categorias

categorias = {
    "Amargo": "Licores básicos",
    "Aperol": "Licores premium",
    "Azúcar": "Consumibles",
    "Cachaça": "Licores básicos",
    "Campari": "Licores premium",
    "Cerveza": "Bebidas frías",
    "Cranberry": "Jugos y mezcladores",
    "Crema de Coco": "Frutas y derivados",
    "Ginebra": "Licores premium",
    "Granadina": "Jugos y mezcladores",
    "Hielo": "Consumibles",
    "Jugo de Limón": "Jugos y mezcladores",
    "Jugo de Naranja": "Jugos y mezcladores",
    "Licor de Cereza": "Licores básicos",
    "Limoncello": "Licores básicos",
    "Menta": "Herbales y saborizantes",
    "Ouzo": "Licores premium",
    "Piña": "Frutas y derivados",
    "Puré de Maracuyá": "Frutas y derivados",
    "Ron": "Licores básicos",
    "Salsa Inglesa": "Condimentos",
    "Soda": "Bebidas frías",
    "Tequila": "Licores premium",
    "Triple Sec": "Licores básicos",
    "Vermouth": "Licores básicos",
    "Vino": "Bebidas alcohólicas",
    "Vino Espumante": "Bebidas alcohólicas",
    "Vodka": "Licores premium",
    "Whisky": "Licores premium",
}



import pandas as pd

ruta_al_archivo = r"C:\Users\Robert\OneDrive\Desktop\Django_test\predicciones_ingredientes.xlsx"
predicciones = pd.read_excel(ruta_al_archivo)

reporte = generar_reporte_predictivo(predicciones, categorias)
