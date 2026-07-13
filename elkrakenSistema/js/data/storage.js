/**
 * storage.js
 * Capa genérica de acceso a datos sobre LocalStorage.
 *
 * IMPORTANTE PARA ESCALABILIDAD:
 * Toda la aplicación accede a los datos únicamente a través de este módulo
 * (y de los módulos específicos en js/data/*.js que lo usan).
 * Cuando el sistema migre a una base de datos real (SQLite/MySQL) o a una
 * API backend (Django/Node/PHP), solo será necesario reescribir las
 * funciones de este archivo (por ejemplo, usando fetch() en vez de
 * localStorage). El resto del código de la aplicación no debería cambiar.
 */

const Storage = {
  /** Lee y parsea una clave del localStorage. Devuelve valorPorDefecto si no existe. */
  leer(clave, valorPorDefecto = []) {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? JSON.parse(crudo) : valorPorDefecto;
    } catch (error) {
      console.error(`Error leyendo "${clave}" de localStorage:`, error);
      return valorPorDefecto;
    }
  },

  // Evita mostrar el mismo error de guardado muchas veces seguidas
  // (por ejemplo, si una pantalla intenta guardar varias veces en segundos).
  _ultimoAvisoError: 0,

  /** Guarda un valor (se serializa a JSON) bajo una clave */
  guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (error) {
      console.error(`Error guardando "${clave}" en localStorage:`, error);

      const esCuotaLlena =
        error &&
        (error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          error.code === 22 ||
          error.code === 1014);

      const ahora = Date.now();
      if (ahora - this._ultimoAvisoError > 4000) {
        this._ultimoAvisoError = ahora;
        if (typeof Utils !== 'undefined' && Utils.notificar) {
          Utils.notificar(
            esCuotaLlena
              ? 'El almacenamiento del navegador está lleno. Ve a "Corte de caja" y usa "Liberar espacio" para exportar y borrar ventas antiguas ya respaldadas.'
              : 'Error al guardar los datos en este navegador.',
            'error'
          );
        }
      }
      return false;
    }
  },

  /** Elimina una clave completa */
  eliminar(clave) {
    localStorage.removeItem(clave);
  },

  /** Tamaño aproximado (en KB) que ocupa una clave guardada */
  tamanoKB(clave) {
    const crudo = localStorage.getItem(clave);
    return crudo ? Math.round((crudo.length * 2) / 1024) : 0;
  },

  // Claves usadas por el sistema (centralizadas para evitar errores de tipeo)
  CLAVES: {
    PRODUCTOS: 'elkrake_productos',
    CUENTAS: 'elkrake_cuentas',
    VENTAS: 'elkrake_ventas',
    CORTES: 'elkrake_cortes',
    VERSION_MENU: 'elkrake_version_menu',
  },
};
