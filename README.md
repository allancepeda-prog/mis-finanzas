# Mis Finanzas — app instalable

Carcasa web (PWA) de la app Mis Finanzas: permite instalarla en el teléfono con su icono y recibir avisos push.
No contiene datos: la app y los datos viven en Google Apps Script, detrás de un PIN.

- `index.html` muestra la app de Apps Script en pantalla completa y gestiona el permiso de avisos.
- `sw.js` recibe los avisos (llegan vacíos) y pide el texto a la app con el identificador del teléfono.
- `config.js` tiene la dirección de la app web.
