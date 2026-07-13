/**
 * corte.js
 * Genera y almacena los "cortes de caja" (cierre diario de operaciones).
 */

const CorteData = {
  /** Devuelve todos los cortes guardados */
  obtenerTodos() {
    return Storage.leer(Storage.CLAVES.CORTES, []);
  },

  /** Verifica si ya existe un corte para una fecha dada */
  yaExisteCorte(fechaISO) {
    return this.obtenerTodos().some((c) => c.fecha === fechaISO);
  },

  /** Genera el corte del día actual (o de la fecha indicada) a partir de las ventas */
  generar(fechaISO = null) {
    const fecha = fechaISO || Utils.fechaHoy();
    const ventasDelDia = VentasData.obtenerPorFecha(fecha);

    const totalVentas = Utils.redondear(
      ventasDelDia.reduce((suma, v) => suma + v.total, 0)
    );
    const totalRecibido = Utils.redondear(
      ventasDelDia.reduce((suma, v) => suma + (v.recibido || 0), 0)
    );
    const totalCambio = Utils.redondear(
      ventasDelDia.reduce((suma, v) => suma + (v.cambio || 0), 0)
    );

    const productosVendidos = {};
    ventasDelDia.forEach((venta) => {
      venta.items.forEach((item) => {
        if (!productosVendidos[item.nombre]) {
          productosVendidos[item.nombre] = { cantidad: 0, subtotal: 0 };
        }
        productosVendidos[item.nombre].cantidad += item.cantidad;
        productosVendidos[item.nombre].subtotal += item.precio * item.cantidad;
      });
    });

    // Desglose de ventas y montos por método de pago (Efectivo, Tarjeta, Transferencia...)
    const desglosePorMetodoPago = {};
    ventasDelDia.forEach((venta) => {
      const metodo = venta.metodoPago || 'Sin especificar';
      if (!desglosePorMetodoPago[metodo]) {
        desglosePorMetodoPago[metodo] = { numeroVentas: 0, total: 0 };
      }
      desglosePorMetodoPago[metodo].numeroVentas += 1;
      desglosePorMetodoPago[metodo].total += venta.total;
    });
    Object.values(desglosePorMetodoPago).forEach((d) => {
      d.total = Utils.redondear(d.total);
    });

    // Ventas agrupadas por hora del día, útil para ver las horas pico
    const ventasPorHora = {};
    ventasDelDia.forEach((venta) => {
      const hora = new Date(venta.fecha).getHours();
      const etiqueta = `${String(hora).padStart(2, '0')}:00 - ${String(hora).padStart(2, '0')}:59`;
      if (!ventasPorHora[etiqueta]) {
        ventasPorHora[etiqueta] = { numeroVentas: 0, total: 0 };
      }
      ventasPorHora[etiqueta].numeroVentas += 1;
      ventasPorHora[etiqueta].total += venta.total;
    });
    Object.values(ventasPorHora).forEach((h) => {
      h.total = Utils.redondear(h.total);
    });

    const corte = {
      id: Utils.generarId('corte'),
      fecha,
      generadoEn: new Date().toISOString(),
      numeroVentas: ventasDelDia.length,
      totalVentas,
      totalRecibido,
      totalCambio,
      productosVendidos,
      desglosePorMetodoPago,
      ventasPorHora,
      // Nota: NO se guarda aquí el arreglo completo "ventas" para no duplicar
      // datos que ya existen en VentasData (eso llenaba rápido el
      // almacenamiento del navegador). Se reconstruye al leer el corte.
    };

    const cortes = this.obtenerTodos().filter((c) => c.fecha !== fecha); // reemplaza si ya existía
    cortes.push(corte);
    Storage.guardar(Storage.CLAVES.CORTES, cortes);

    // Devolvemos una copia enriquecida con las ventas del día para uso
    // inmediato en pantalla (tabla, Excel), sin que eso se persista dos veces.
    return { ...corte, ventas: ventasDelDia };
  },

  /** Obtiene el corte de una fecha específica, si existe (con las ventas de ese día ya incluidas) */
  obtenerPorFecha(fechaISO) {
    const corte = this.obtenerTodos().find((c) => c.fecha === fechaISO) || null;
    if (!corte) return null;
    return { ...corte, ventas: VentasData.obtenerPorFecha(fechaISO) };
  },

  /** Elimina cortes guardados anteriores a una fecha (YYYY-MM-DD), para liberar espacio */
  eliminarAnterioresA(fechaISO) {
    const cortes = this.obtenerTodos();
    const conservados = cortes.filter((c) => c.fecha >= fechaISO);
    Storage.guardar(Storage.CLAVES.CORTES, conservados);
    return cortes.length - conservados.length;
  },
};
