/**
 * navegacion.js
 * Inserta la barra de navegación lateral en cualquier página que
 * incluya un elemento <div id="nav-lateral"></div>.
 */

function renderizarNavegacion(paginaActiva) {
  const contenedor = document.getElementById('nav-lateral');
  if (!contenedor) return;

  const enlaces = [
    { href: 'Principal.html', texto: '🏠 Inicio', clave: 'inicio' },
    { href: 'pedidos.html', texto: '🧾 Nuevo pedido', clave: 'pedidos' },
    { href: 'cocina.html', texto: '🐙 Vista de cocina', clave: 'cocina' },
    { href: 'ventas.html', texto: '📊 Historial de ventas', clave: 'ventas' },
    { href: 'corte.html', texto: '💰 Corte de caja', clave: 'corte' },
    { href: 'productos.html', texto: '🍽️ Menú', clave: 'productos' },
  ];

  contenedor.innerHTML = `
    <div class="nav-lateral__logo">
      <img src="assets/logo.jpg" alt="El Kraken" />
      <span>El Kraken</span>
    </div>
    ${enlaces
      .map(
        (e) => `<a href="${e.href}" class="${e.clave === paginaActiva ? 'activo' : ''}">${e.texto}</a>`
      )
      .join('')}
    <div class="nav-lateral__reloj" id="reloj"></div>
  `;

  const reloj = document.getElementById('reloj');
  if (reloj) {
    const actualizarReloj = () => {
      reloj.textContent = new Date().toLocaleString('es-MX', {
        weekday: 'long', hour: '2-digit', minute: '2-digit',
      });
    };
    actualizarReloj();
    setInterval(actualizarReloj, 30000);
  }

  advertirSiUsaFileProtocol();
}

/**
 * Cuando el sistema se abre con doble clic (protocolo "file://"), algunos
 * navegadores (sobre todo Chrome en Windows) le dan a localStorage una
 * cuota de almacenamiento mucho más pequeña e inestable que cuando se abre
 * desde un servidor local. Esto puede causar errores de "almacenamiento
 * lleno" incluso con pocos datos guardados. Se avisa una sola vez por
 * sesión de navegación para no ser repetitivo.
 */
function advertirSiUsaFileProtocol() {
  if (window.location.protocol !== 'file:') return;
  if (sessionStorage.getItem('elkrake_aviso_file_mostrado')) return;
  sessionStorage.setItem('elkrake_aviso_file_mostrado', '1');

  setTimeout(() => {
    if (typeof Utils !== 'undefined' && Utils.notificar) {
      Utils.notificar(
        'Este sistema se está abriendo directamente desde un archivo (file://). Si ves errores de "almacenamiento lleno", te recomendamos abrirlo desde un servidor local (por ejemplo con Live Server de VS Code o "python -m http.server") para tener más espacio de guardado y evitar ese error.',
        'info'
      );
    }
  }, 1200);
}
