/**
 * server.js
 * Servidor local mínimo (sin dependencias externas) para El Kraken POS.
 *
 * ¿Para qué sirve?
 * La app original guarda todo en localStorage, es decir, solo la
 * computadora que registra la venta "ve" esos datos. Este servidor agrega
 * una sola cosa: un punto central donde la computadora de CAJA publica los
 * pedidos abiertos (mesas/cuentas) para que la computadora de COCINA (u
 * otras en la misma red) los pueda ver en tiempo real desde cocina.html.
 *
 * Todo lo demás (ventas, cortes, productos) sigue funcionando exactamente
 * igual que antes, en localStorage — no se tocó nada de eso.
 *
 * CÓMO USARLO:
 *   1. Instala Node.js una sola vez en la computadora de CAJA (nodejs.org).
 *   2. Abre una terminal dentro de la carpeta "elkrake-pos" y ejecuta:
 *        node server.js
 *   3. En la computadora de CAJA, en vez de abrir Principal.html con doble
 *      clic, abre en el navegador: http://localhost:3000
 *   4. En la computadora de COCINA (misma red Wi-Fi/cable), abre en el
 *      navegador: http://IP-DE-LA-CAJA:3000/cocina.html
 *      (la IP de la computadora de caja se muestra en la terminal al
 *      iniciar el servidor; también puedes verla con "ipconfig" en
 *      Windows, en la sección de tu adaptador Wi-Fi/Ethernet, como
 *      "Dirección IPv4").
 *   5. Dejar la terminal abierta mientras el negocio esté funcionando.
 *      Se puede minimizar, pero no cerrar.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PUERTO = 3000;
const RAIZ = __dirname;
const ARCHIVO_PEDIDOS = path.join(RAIZ, 'data', 'pedidos_cocina.json');

const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/** Lee los pedidos guardados en disco (si el servidor se reinició) */
function leerPedidosGuardados() {
  try {
    const crudo = fs.readFileSync(ARCHIVO_PEDIDOS, 'utf8');
    return JSON.parse(crudo);
  } catch (error) {
    return [];
  }
}

let pedidosAbiertos = leerPedidosGuardados();
let ultimaActualizacion = new Date().toISOString();

function guardarPedidosEnDisco() {
  try {
    fs.mkdirSync(path.dirname(ARCHIVO_PEDIDOS), { recursive: true });
    fs.writeFileSync(ARCHIVO_PEDIDOS, JSON.stringify(pedidosAbiertos, null, 2));
  } catch (error) {
    console.error('No se pudo guardar el respaldo de pedidos en disco:', error.message);
  }
}

function enviarJSON(res, status, datos) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
  });
  res.end(cuerpo);
}

function servirArchivoEstatico(req, res) {
  let rutaPedida = decodeURIComponent(req.url.split('?')[0]);
  if (rutaPedida === '/') rutaPedida = '/Principal.html';

  const rutaAbsoluta = path.join(RAIZ, rutaPedida);

  // Evita salir de la carpeta del proyecto (seguridad básica)
  if (!rutaAbsoluta.startsWith(RAIZ)) {
    res.writeHead(403);
    res.end('Prohibido');
    return;
  }

  fs.readFile(rutaAbsoluta, (error, contenido) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('No encontrado: ' + rutaPedida);
      return;
    }
    const ext = path.extname(rutaAbsoluta).toLowerCase();
    res.writeHead(200, { 'Content-Type': TIPOS_MIME[ext] || 'application/octet-stream' });
    res.end(contenido);
  });
}

const servidor = http.createServer((req, res) => {
  // Permite que cocina.html en otra computadora de la misma red consulte este servidor
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ---- API: obtener pedidos abiertos (usado por cocina.html) ----
  if (req.method === 'GET' && req.url.startsWith('/api/pedidos')) {
    enviarJSON(res, 200, { pedidos: pedidosAbiertos, actualizado: ultimaActualizacion });
    return;
  }

  // ---- API: publicar el estado actual de pedidos (usado por la caja) ----
  if (req.method === 'POST' && req.url.startsWith('/api/pedidos')) {
    let cuerpo = '';
    req.on('data', (fragmento) => (cuerpo += fragmento));
    req.on('end', () => {
      try {
        const datos = JSON.parse(cuerpo || '[]');
        pedidosAbiertos = Array.isArray(datos) ? datos : [];
        ultimaActualizacion = new Date().toISOString();
        guardarPedidosEnDisco();
        enviarJSON(res, 200, { ok: true });
      } catch (error) {
        enviarJSON(res, 400, { ok: false, error: 'JSON inválido' });
      }
    });
    return;
  }

  // ---- Todo lo demás: sirve la app tal cual (html/css/js/imágenes) ----
  servirArchivoEstatico(req, res);
});

servidor.listen(PUERTO, () => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const nombre of Object.keys(interfaces)) {
    for (const iface of interfaces[nombre]) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }

  console.log('');
  console.log('========================================');
  console.log('  El Kraken POS - servidor local activo');
  console.log('========================================');
  console.log(`  En ESTA computadora (caja): http://localhost:${PUERTO}`);
  if (ips.length) {
    ips.forEach((ip) => {
      console.log(`  Desde la COCINA, abrir:      http://${ip}:${PUERTO}/cocina.html`);
    });
  } else {
    console.log('  No se detectó una IP de red local. Verifica que ambas');
    console.log('  computadoras estén conectadas a la misma red.');
  }
  console.log('========================================');
  console.log('  Deja esta ventana abierta mientras el negocio esté abierto.');
  console.log('');
});
