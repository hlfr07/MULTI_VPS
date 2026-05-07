# Atajos y comandos disponibles

Este archivo lista los atajos (flags) que puedes usar al arrancar el script de inicialización (`server-init`).

Ubicación del init: `server-init/` (ejecuta `npm start` allí).

Ejemplos de uso:

- Ejecutar el inicializador interactivo (pedirá usuario y password):
  - `cd server-init && npm start`

- Ejecutar pasando credenciales y arrancar todo (backend, frontend, cloudflared):
  - `cd server-init && npm start -- admin admin@123`

- Ejecutar y solo instalar/configurar la parte de túneles/ngrok (flag `--terminal`):
  - `cd server-init && npm start -- admin admin@123 --terminal`
  - Comportamiento: instala `ngrok` si no está, prepara la terminal web (`ttyd`).

- Ejecutar y configurar cloudflared (flag `--nube`):
  - `cd server-init && npm start -- admin admin@123 --nube`
  - Comportamiento: instala `cloudflared` si hace falta y lanza los túneles (por defecto inicia los túneles en screen).
-- `--install-only` (alias: `--solo-instalar`, `--no-start`)
  - Uso: `cd server-init && npm start -- admin admin@123 --install-only`
  - Comportamiento: instala/compila dependencias pero NO inicia los servicios en `screen`.
    - Backend: `npm ci` en `server/` (no `npm run start`).
    - Frontend: `npm ci` y `npm run build` en `panel/` (no `http-server` en screen).
    - Cloudflared: si se usa `--nube`, instala dependencias pero no inicia túneles.

Instalación adicional: `Ollama`

- El inicializador intenta instalar `Ollama` en Debian/Ubuntu/RHEL si la plataforma es compatible.
  - Comandos internos (Ubuntu):
    - `apt-get install -y zstd`
    - `curl -fsSL https://ollama.com/install.sh | sh`
  - Después de la instalación, arranca `ollama serve` dentro de una sesión `screen` llamada `ollama` con:
    - `OLLAMA_HOST=0.0.0.0:11434 OLLAMA_CONTEXT_LENGTH=131072 ollama serve`
  - Nota: puede fallar por permisos o compatibilidad; se saltará en plataformas no compatibles.

Rápido: omitir instalaciones largas

- `--no-install` (aliases: `--skip-install`, `--fast`)
  - Uso: `cd server-init && npm start -- admin admin@123 --no-install`
  - Comportamiento: omite instalaciones y builds largos para acelerar la ejecución:
    - No ejecuta `npm ci` ni `npm run build` en `server/` ni `panel/`.
    - No instala ni inicia `cloudflared` (si se combina con `--nube`).
    - No ejecuta la instalación de `Ollama`.
  - Útil para pruebas rápidas o cuando ya tienes dependencias instaladas.

Listado completo de flags y comportamientos

- Posicionales (credenciales):
  - `npm start -- <usuario> <password> [flags]` — si no se pasan, el script pedirá credenciales interactivamente.

- `--nube`:
  - Instala `cloudflared` (si hace falta) y, por defecto, inicia túneles en una sesión `screen`.

- `--terminal`:
  - Instala `ngrok` (si hace falta) y prepara la terminal web (`ttyd`). No inicia backend/frontend por sí mismo.

- `--install-only` / `--solo-instalar` / `--no-start`:
  - Instala dependencias y compila frontend pero NO inicia servicios en `screen`.

- `--no-install` / `--skip-install` / `--fast`:
  - Omite instalaciones/builds pesados y la instalación de Ollama; acelera el proceso.

- Credenciales pasadas por posición:
  - Ejemplo: `npm start -- admin admin@123 --nube` → `admin` y `admin@123` se usan como usuario/password para `ttyd`.

Ejemplos rápidos

- Ejecutar interactivo (pedirá usuario/password):
  - `cd server-init && npm start`

- Ejecutar completo (instala e inicia todo):
  - `cd server-init && npm start -- admin admin@123`

- Instalar dependencias sin iniciar servicios:
  - `cd server-init && npm start -- admin admin@123 --install-only`

- Ejecutar muy rápido, sin instalaciones/builds:
  - `cd server-init && npm start -- admin admin@123 --no-install`

Notas y recomendaciones

- Ejecuta desde `server-init` para que `npm start` invoque el script correcto.
- Combina flags con cuidado: `--no-install` tiene prioridad para omitir instalaciones; `--install-only` instalará pero no iniciará servicios.
- Si quieres que agregue un ejemplo para sistemas Windows/PowerShell o que genere un `QUICK_START.md` más extenso, lo hago.