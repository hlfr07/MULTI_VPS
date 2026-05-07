# Atajos y comandos disponibles

Este archivo lista los atajos (flags) que puedes usar al arrancar el script de inicialización (`server-init`).

Ubicación del init: `server-init/` (ejecuta `npm start` allí).

## Flags principales

### Flag 1: `--no-install`

Uso:

```bash
cd server-init && npm start -- admin admin@123 --no-install
```

Qué hace:

- Omite instalaciones y builds largos para acelerar la ejecución.
- No ejecuta `npm ci` ni `npm run build` en `server/` ni `panel/`.
- No instala ni inicia `cloudflared` si lo combinas con `--nube`.
- No ejecuta la instalación de `Ollama`.

Aliases:

- `--skip-install`
- `--fast`

### Flag 2: `--install-only`

Uso:

```bash
cd server-init && npm start -- admin admin@123 --install-only
```

Qué hace:

- Instala/compila dependencias pero NO inicia servicios en `screen`.
- Backend: ejecuta `npm ci` en `server/`, pero no lanza `npm run start`.
- Frontend: ejecuta `npm ci` y `npm run build` en `panel/`, pero no crea el `http-server` en `screen`.
- Cloudflared: si usas `--nube`, instala dependencias pero no inicia túneles.

Aliases:

- `--solo-instalar`
- `--no-start`

### Flag 3: `--nube`

Uso:

```bash
cd server-init && npm start -- admin admin@123 --nube
```

Qué hace:

- Instala `cloudflared` si hace falta.
- Inicia los túneles en una sesión `screen`.

### Flag 4: `--terminal`

Uso:

```bash
cd server-init && npm start -- admin admin@123 --terminal
```

Qué hace:

- Instala `ngrok` si hace falta.
- Prepara la terminal web con `ttyd`.
- No inicia backend ni frontend por sí mismo.

### Flag 5: `--ngrok <token>`

Uso:

```bash
cd server-init && npm start -- admin admin@123 --ngrok TU_TOKEN_DE_NGROK
```

Qué hace:

- Instala `ngrok` si hace falta.
- Ejecuta `ngrok config add-authtoken <token>` al final del bloque.
- Deja `ngrok` configurado para que puedas crear túneles después.

Importante:

- El token debe ir justo después de `--ngrok`.
- Si no pasas token, el script solo avisará que falta.
- Puedes combinarlo con `--terminal` si también quieres preparar `ttyd`.

### Flag 6: credenciales por posición

Uso:

```bash
cd server-init && npm start -- admin admin@123
```

Qué hace:

- Usa `admin` como usuario de `ttyd`.
- Usa `admin@123` como password de `ttyd`.
- Si no las pasas, el script las pedirá de forma interactiva.

## Otras cosas que debes saber

- `Ollama` se instala en Debian/Ubuntu/RHEL si la plataforma es compatible.
- Después de instalarlo, el script deja corriendo esto dentro de una `screen` llamada `ollama`:

```bash
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_CONTEXT_LENGTH=131072 ollama serve
```

- Si el sistema no soporta `Ollama`, el script lo salta.
- `--no-install` tiene prioridad para evitar procesos largos.
- `--install-only` sirve cuando quieres preparar todo sin levantar servicios.
- Ejecuta siempre el inicializador desde `server-init/` para que `npm start` funcione bien.

## Ejemplos rápidos

### Interactivo

```bash
cd server-init && npm start
```

### Completo

```bash
cd server-init && npm start -- admin admin@123
```

### Solo preparar dependencias y no iniciar servicios

```bash
cd server-init && npm start -- admin admin@123 --install-only
```

### Ejecutar lo más rápido posible

```bash
cd server-init && npm start -- admin admin@123 --no-install
```

### Ejecutar rápido y dejar ngrok configurado

```bash
cd server-init && npm start -- admin admin@123 --no-install --ngrok 38tObxmrpEWzi
```

Si quieres, después puedo dejar esto en formato de tabla para que quede aún más visual.