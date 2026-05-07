# Guía: Usar MULTI_VPS con Modelos en Kaggle y Colab

Esta guía te permite ejecutar modelos de IA (como Qwen, Llama, etc.) en Kaggle o Google Colab usando este repositorio, exponiendo Ollama a través de ngrok para acceder remotamente.

## Paso 0: Crear cuenta en ngrok (IMPORTANTE)

Antes de ejecutar el script, necesitas:

1. Ir a [ngrok.com](https://ngrok.com) y crear una cuenta gratuita.
2. Una vez registrado, accede a tu dashboard y copia tu **authentication token**.
3. Guarda este token, lo necesitarás en el Paso 3.

> **Nota:** Ngrok te proporciona un token gratuito que permite crear túneles públicos. Con la versión gratuita tienes suficiente para este caso de uso.

## Paso 1: Clonar el repositorio

Ejecuta en la celda de Kaggle o Colab:

```python
!git clone https://github.com/hlfr07/MULTI_VPS.git
```

## Paso 2: Navegar a la carpeta de inicialización

```python
%cd MULTI_VPS/server-init
```

## Paso 3: Ejecutar el inicializador con flags

Reemplaza `38tObxmr` con tu token de ngrok (obtenido en el Paso 0):

```python
!npm start -- admin admin@123 --no-install --ngrok 38tObxmrpEWzi
```

### Qué hace este comando:

- `admin` y `admin@123`: credenciales para la terminal web (`ttyd`).
- `--no-install`: omite las instalaciones largas, va directo a lo importante.
- `--ngrok 38tObxmrpEWzi`: configura el token de ngrok automáticamente.

## Paso 4: Espera los logs esperados

Después de ejecutar el comando, deberías ver algo como esto:

```
🚀 Bootstrapping DroidVPS environment...

🔍 Detecting platform... ✓
✅ Platform detected: UBUNTU
✅ curl already installed
✅ tar already installed
✅ ttyd already installed
✅ xsel already installed
ℹ️  Running on Ubuntu/Linux - skipping Termux-specific setup (proot-distro, termux-api)

🔐 Web Terminal protection
✅ Usando credenciales pasadas por argumentos
👤 Usuario: admin
🔑 Flag --ngrok detectado. Se configurará el authtoken de ngrok
⚡ Flag --no-install detectado. Se OMITIRÁN las instalaciones/builds largos para acelerar la ejecución
🔐 Saving credentials... ✓
✅ Credenciales guardadas
🛑 Stopping previous ttyd... ✓
✅ ttyd stopped

🖥 Starting ttyd on port 7681...

🎉 DroidVPS environment READY
🌐 Web terminal: http://localhost:7681
✅ screen already installed

🧹 Limpiando sesiones screen antiguas
🛑 Stopping screen sessions... ✓
🧹 Wiping dead screen sessions... ✓
🧹 Cleaning screen files... ✓
✅ Sesiones screen antiguas limpiadas
📁 Project path: /kaggle/working/MULTI_VPS
💡 Creando sesiones screen para el panel
⚙️ Starting backend server... ✓
⏭️ Backend install/build skipped due to --no-install
🎨 Building frontend... ✓
⏭️ Frontend install/build skipped due to --no-install

🔧 Configurando ngrok...
🔍 Verificando ngrok... ✓
✅ ngrok ya está instalado
✅ ngrok listo. Podrás tunelizar manualmente cuando lo necesites
🔑 Configurando authtoken de ngrok... ✓
✅ Authtoken de ngrok configurado
⏭️ Saltando instalación de Ollama por --no-install
🧠 Starting ollama in screen... ✓
✅ Ollama corriendo en screen con nombre ollama

⏳ Esperando a que todos los servicios estén listos...

[████████████████████] 100%
✓ Todos los servicios están listos!

🚀 ¡Todo listo! Accede al panel en http://localhost:7681
```

Si ves esto, ¡felicidades! El entorno está listo.

## Paso 5: Descargar modelos

Una vez que el script terminó, descarga los modelos que quieras usar. Por ejemplo, para descargar Qwen 3.6 (35 billones de parámetros):

```python
!ollama pull qwen3.6:35b
```

**Nota:** `pull` solo **descarga**, no ejecuta el modelo. Puede tardar dependiendo del tamaño (Qwen 3.6 35B es ~20GB).

Otros modelos populares:

```python
!ollama pull llama2          # Llama 2 (7B, más rápido)
!ollama pull mistral        # Mistral (7B)
!ollama pull neural-chat    # Neural Chat (7B)
```

## Paso 6: Exponer Ollama vía ngrok (para usar el modelo)

Una vez descargado el modelo, debes exponer Ollama al público. En una **nueva celda**, ejecuta:

```python
!ngrok http 11434
```

Este comando abrirá un túnel ngrok al puerto 11434 (donde está Ollama) y te mostrará una URL pública como:

```
https://ejemplo-aleatorio-ngrok.ngrok-free.dev
```

**Copia esta URL**, la necesitarás para conectar desde OpenCode, Copilot u otras herramientas.

Nota sobre Colab: si estás exponiendo la **terminal web** (puerto `7681`) o no ves la URL de `ngrok` en la salida de Colab, ejecútalo con logging para que muestre la URL en los logs:

```bash
!ngrok http 7681 --log=stdout --log-format=term
```

Puedes usar las mismas flags si expones Ollama en `11434` y Colab no muestra la URL:

```bash
!ngrok http 11434 --log=stdout --log-format=term
```

## Paso 7a: Usar con OpenCode.json

Si tienes un archivo `opencode.json` en tu proyecto, actualízalo así:

```json
{
    "$schema": "https://opencode.ai/config.json",
    "provider": {
        "ollama": {
            "npm": "@ai-sdk/openai-compatible",
            "name": "Ollama (local)",
            "options": {
                "baseURL": "https://ejemplo-aleatorio-ngrok.ngrok-free.dev/v1"
            },
            "models": {
                "qwen3.6:35b": {
                    "name": "Qwen 3.6 (35B)"
                },
                "llama2": {
                    "name": "Llama 2"
                }
            }
        }
    }
}
```

Reemplaza `ejemplo-aleatorio-ngrok.ngrok-free.dev` con tu URL de ngrok (la que aparece en el paso anterior).

## Paso 7b: Usar con GitHub Copilot

GitHub Copilot tiene un apartado integrado para conectar con Ollama:

1. En Copilot, ve a **Settings** → **Models**.
2. Elige **Ollama** como provider.
3. Ingresa solo la **URL base** (sin `/v1`):

```
https://ejemplo-aleatorio-ngrok.ngrok-free.dev
```

4. Copilot debería detectar automáticamente los modelos disponibles.

## Notas importantes

- **La URL de ngrok suele ser la misma** entre túneles, así que puedes reutilizarla si haces múltiples ejecuciones.
- Si cierras la sesión de Kaggle/Colab, los túneles se cerrará. Deberás ejecutar `!ngrok http 11434` nuevamente.
- **El puerto 7681** es para la terminal web (`ttyd`) si quieres acceder a una consola interactiva.
- **El puerto 11434** es para Ollama (los modelos).
- Puedes exponer ambos puertos simultáneamente en celdas separadas si quieres.

## Troubleshooting

### Error: "ngrok: command not found"

El script intenta instalar ngrok automáticamente. Si aún así no funciona:

```python
!pip install pyngrok
```

### Error: "Ollama no está instalado"

El script intenta instalar Ollama con su script oficial. Si falla:

```python
!curl -fsSL https://ollama.com/install.sh | bash
```

### El modelo no carga

Asegúrate de que:
1. Descargaste el modelo con `!ollama pull <nombre>`.
2. Ollama está corriendo en la sesión screen.
3. Ngrok está exponiendo el puerto 11434 correctamente.

## Ejemplo completo para Colab

```python
# Paso 1: Clonar
!git clone https://github.com/hlfr07/MULTI_VPS.git

# Paso 2: Navegar
%cd MULTI_VPS/server-init

# Paso 3: Ejecutar (reemplaza el token)
!npm start -- admin admin@123 --no-install --ngrok TU_TOKEN_AQUI

# Paso 4: Descargar modelo
!ollama pull qwen3.6:35b

# Paso 5: Exponer vía ngrok (en una celda nueva)
!ngrok http 11434
```

Después, verás la URL de ngrok. ¡Úsala en OpenCode, Copilot o donde necesites!

¿Preguntas? Revisa `README_SHORTCUTS.md` para más flags disponibles o `server-init/QUICK_START.md` para guías rápidas.
