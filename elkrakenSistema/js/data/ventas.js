/**
 * ventas.js
 * Registro histórico de ventas. Cada vez que se cobra un pedido,
 * se guarda aquí como una venta completa e inmutable.
 */

const VentasData = {
  /** Devuelve todas las ventas registradas */
  obtenerTodas() {
    return Storage.leer(Storage.CLAVES.VENTAS, []);
  },

  /** Devuelve las ventas de una fecha específica (YYYY-MM-DD). Por defecto, hoy. */
  obtenerPorFecha(fechaISO = null) {
    const fecha = fechaISO || Utils.fechaHoy();
    return this.obtenerTodas().filter((v) => v.fecha.startsWith(fecha));
  },

  /** Registra una nueva venta a partir del pedido cobrado */
  registrar({ items, notas, total, recibido, cambio, metodoPago, mesa }) {
    const ventas = this.obtenerTodas();
    const venta = {
      id: Utils.generarId('venta'),
      folio: ventas.length + 1,
      fecha: new Date().toISOString(),
      items,
      notas: notas || '',
      total: Utils.redondear(total),
      recibido: Utils.redondear(recibido),
      cambio: Utils.redondear(cambio),
      metodoPago: metodoPago || 'Efectivo',
      mesa: mesa || '',
    };
    ventas.push(venta);
    Storage.guardar(Storage.CLAVES.VENTAS, ventas);
    return venta;
  },

  /** Suma el total vendido en una fecha (por defecto, hoy) */
  totalDelDia(fechaISO = null) {
    return Utils.redondear(
      this.obtenerPorFecha(fechaISO).reduce((suma, v) => suma + v.total, 0)
    );
  },

  /** Elimina TODAS las ventas del historial (usar con mucha precaución) */
  limpiarTodo() {
    Storage.guardar(Storage.CLAVES.VENTAS, []);
  },

  /** Elimina únicamente las ventas anteriores a una fecha (YYYY-MM-DD),
   *  para liberar espacio de almacenamiento conservando lo más reciente.
   *  Se recomienda exportar a Excel antes de usar esto. */
  eliminarAnterioresA(fechaISO) {
    const ventas = this.obtenerTodas();
    const conservadas = ventas.filter((v) => v.fecha.split('T')[0] >= fechaISO);
    Storage.guardar(Storage.CLAVES.VENTAS, conservadas);
    return ventas.length - conservadas.length;
  },
};
