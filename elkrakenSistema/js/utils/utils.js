/**
 * utils.js
 * Funciones auxiliares de uso general para todo el sistema.
 */

const Utils = {
  /** Formatea un número como moneda MXN, ej: 125.5 -> "$125.50" */
  formatoMoneda(numero) {
    const valor = Number(numero) || 0;
    return valor.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
  },

  /** Genera un ID único simple basado en timestamp + azar */
  generarId(prefijo = 'id') {
    return `${prefijo}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  },

  /** Devuelve la fecha actual en formato ISO (YYYY-MM-DD) */
  fechaHoy() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  },

  /** Devuelve fecha y hora legible: "10/07/2026 14:35" */
  fechaHoraLegible(fechaISO) {
    const d = fechaISO ? new Date(fechaISO) : new Date();
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /** Redondea a 2 decimales evitando errores de punto flotante */
  redondear(numero) {
    return Math.round((Number(numero) + Number.EPSILON) * 100) / 100;
  },

  /** Muestra una notificación flotante simple (toast) */
  notificar(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('toast-container') || (() => {
      const div = document.createElement('div');
      div.id = 'toast-container';
      document.body.appendChild(div);
      return div;
    })();

    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensaje;
    contenedor.appendChild(toast);

    // Los mensajes largos (avisos con instrucciones) se quedan más tiempo
    // en pantalla para que dé tiempo a leerlos completos.
    const duracion = mensaje.length > 90 ? 6000 : 2800;

    setTimeout(() => toast.classList.add('toast--visible'), 10);
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, duracion);
  },

  /** Confirmación sencilla basada en un modal (más agradable que confirm() nativo) */
  confirmar(mensaje) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-confirm">
          <p>${mensaje}</p>
          <div class="modal-confirm__botones">
            <button class="btn btn--secundario" data-accion="cancelar">Cancelar</button>
            <button class="btn btn--peligro" data-accion="aceptar">Aceptar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.addEventListener('click', (e) => {
        const accion = e.target.dataset.accion;
        if (accion) {
          overlay.remove();
          resolve(accion === 'aceptar');
        }
      });
    });
  },
};
