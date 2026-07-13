/**
 * cuentas.js
 * Maneja las "cuentas abiertas": un pedido en curso asociado a una mesa
 * o nombre de cliente, que permanece abierto mientras la gente come y
 * se cobra hasta el final (flujo real de un restaurante).
 *
 * Cada cuenta tiene su propio carrito de productos. Cuando se cobra
 * (ver cobro.html), la cuenta se convierte en una venta (VentasData)
 * y se elimina de la lista de cuentas abiertas.
 */

const CuentasData = {
  /**
   * Envía el estado actual de las cuentas abiertas al servidor local
   * (server.js), para que cocina.html en otra computadora las muestre.
   * Es "best effort": si el servidor no está corriendo (ej. se sigue
   * usando la app con doble clic en index.html, sin node server.js),
   * simplemente falla en silencio y el resto de la app sigue funcionando
   * exactamente igual que antes.
   */
  sincronizarConCocina(cuentas) {
    if (typeof fetch !== 'function') return;
    fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuentas),
    }).catch(() => {
      /* Sin servidor local activo: no pasa nada, se ignora. */
    });
  },

  /** Devuelve todas las cuentas abiertas */
  obtenerAbiertas() {
    return Storage.leer(Storage.CLAVES.CUENTAS, []);
  },

  /** Busca una cuenta abierta por su id */
  obtenerPorId(id) {
    return this.obtenerAbiertas().find((c) => c.id === id) || null;
  },

  /** Crea una nueva cuenta abierta (ej. "Mesa 3" o "Juan - para llevar") */
  crear(nombre) {
    const cuentas = this.obtenerAbiertas();
    const nueva = {
      id: Utils.generarId('cuenta'),
      nombre: nombre.trim(),
      items: [],
      notas: '',
      creada: new Date().toISOString(),
    };
    cuentas.push(nueva);
    Storage.guardar(Storage.CLAVES.CUENTAS, cuentas);
    this.sincronizarConCocina(cuentas);
    return nueva;
  },

  /** Renombra una cuenta (ej. corregir número de mesa) */
  renombrar(id, nuevoNombre) {
    const cuentas = this.obtenerAbiertas();
    const cuenta = cuentas.find((c) => c.id === id);
    if (cuenta) {
      cuenta.nombre = nuevoNombre.trim();
      Storage.guardar(Storage.CLAVES.CUENTAS, cuentas);
      this.sincronizarConCocina(cuentas);
    }
  },

  /** Agrega un producto a una cuenta (o incrementa cantidad si ya existe) */
  agregarProducto(cuentaId, producto, cantidad = 1) {
    const cuentas = this.obtenerAbiertas();
    const cuenta = cuentas.find((c) => c.id === cuentaId);
    if (!cuenta) return null;

    const existente = cuenta.items.find((i) => i.productoId === producto.id);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      cuenta.items.push({
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad,
      });
    }
    Storage.guardar(Storage.CLAVES.CUENTAS, cuentas);
    this.sincronizarConCocina(cuentas);
    return cuenta;
  },

  /** Cambia la cantidad de un producto dentro de una cuenta */
  cambiarCantidad(cuentaId, productoId, nuevaCantidad) {
    const cuentas = this.obtenerAbiertas();
    const cuenta = cuentas.find((c) => c.id === cuentaId);
    if (!cuenta) return null;

    if (nuevaCantidad <= 0) {
      cuenta.items = cuenta.items.filter((i) => i.productoId !== productoId);
    } else {
      const item = cuenta.items.find((i) => i.productoId === productoId);
      if (item) item.cantidad = nuevaCantidad;
    }
    Storage.guardar(Storage.CLAVES.CUENTAS, cuentas);
    this.sincronizarConCocina(cuentas);
    return cuenta;
  },

  /** Elimina un producto de una cuenta */
  eliminarProducto(cuentaId, productoId) {
    return this.cambiarCantidad(cuentaId, productoId, 0);
  },

  /** Actualiza las notas de una cuenta (ej. "sin cebolla", "para llevar") */
  actualizarNotas(cuentaId, notas) {
    const cuentas = this.obtenerAbiertas();
    const cuenta = cuentas.find((c) => c.id === cuentaId);
    if (cuenta) {
      cuenta.notas = notas;
      Storage.guardar(Storage.CLAVES.CUENTAS, cuentas);
      this.sincronizarConCocina(cuentas);
    }
  },

  /** Calcula el total de una cuenta */
  calcularTotal(cuenta) {
    return Utils.redondear(
      cuenta.items.reduce((suma, item) => suma + item.precio * item.cantidad, 0)
    );
  },

  /** Elimina una cuenta por completo (al cobrarla o cancelarla) */
  cerrar(cuentaId) {
    const cuentas = this.obtenerAbiertas().filter((c) => c.id !== cuentaId);
    Storage.guardar(Storage.CLAVES.CUENTAS, cuentas);
    this.sincronizarConCocina(cuentas);
  },
};
