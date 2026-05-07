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

Nuevo atajo: evitar levantar servicios, solo instalar/compilar dependencias

- `--install-only` (alias: `--solo-instalar`, `--no-start`)
  - Uso: `cd server-init && npm start -- admin admin@123 --install-only`
  - Comportamiento: el script instalará dependencias y compilará el frontend, pero NO iniciará los servicios en `screen`:
    - Backend: ejecuta `npm ci` en `server/` pero no lanza `npm run start`.
    - Frontend: ejecuta `npm ci` y `npm run build` en `panel/` pero no crea el `http-server` en `screen`.
    - Cloudflared: si usas `--nube`, se instalarán las dependencias pero NO se iniciarán los túneles.

Instalación adicional: Ollama

- El inicializador ahora intenta instalar `Ollama` en sistemas Debian/Ubuntu/RHEL si la plataforma es compatible.
  - Comandos que corre internamente (Ubuntu):
    - `apt-get install -y zstd`
    - `curl -fsSL https://ollama.com/install.sh | sh`
  - Nota: la instalación puede fallar si la plataforma no es compatible o faltan permisos.

Notas y recomendaciones

- Ejecuta el inicializador desde la carpeta `server-init` para que `npm start` invoque el script correcto.
- Si necesitas solo instalar dependencias sin iniciar servicios, usa `--install-only`.
- Si quieres tunelizar desde tu máquina manualmente, puedes instalar `ngrok` con `--terminal` y configurarlo por separado.

Si quieres que agregue ejemplos adicionales o traduzca esto a otro formato (por ejemplo `QUICK_START.md`), dime y lo hago.