import subprocess
import os

def activar_entorno_virtual(ruta_entorno):
    if os.name == 'nt': 
        activate_script = os.path.join(ruta_entorno, "Scripts", "activate")
    else: 
        activate_script = os.path.join(ruta_entorno, "bin", "activate")

    if not os.path.exists(activate_script):
        raise FileNotFoundError(f"No se encontró el script de activación: {activate_script}")

    return activate_script

def ejecutar_scripts_en_secuencia(scripts, ruta_entorno):
    activar_entorno = activar_entorno_virtual(ruta_entorno)
    for script in scripts:
        print(f"Ejecutando: {script}")
        try:
            resultado = subprocess.run(
                f"{activar_entorno} && python {script}",
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )
            print(f"Salida de {script}:\n{resultado.stdout}")
        except subprocess.CalledProcessError as e:
            print(f"Error ejecutando {script}:\n{e.stderr}")
        except Exception as e:
            print(f"Error inesperado ejecutando {script}: {e}")

if __name__ == "__main__":
    ruta_entorno_virtual = "C:\\Users\\Robert\\OneDrive\\Desktop\\Django_test\\env"
    
    scripts_a_ejecutar = [
        "insercion_basica.py",
        "insercion_ingredientes.py",
    ]

    ejecutar_scripts_en_secuencia(scripts_a_ejecutar, ruta_entorno_virtual)
