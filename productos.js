/**
 * productos.js
 * CRUD del menú de productos. Usa Storage como capa de persistencia.
 */

const ProductosData = {
  /** Versión del menú oficial. Súbela cada vez que cambies _sembrarDatosIniciales
   *  para que el sistema actualice el menú de quienes ya tenían datos guardados,
   *  sin borrar sus ventas ni cortes de caja. */
  VERSION_MENU: 3,

  /** Categorías del menú de El Kraken */
  CATEGORIAS: [
    'Favoritas',
    'Papas y Botanas',
    'Boneless',
    'Alitas',
    'Hamburguesas',
    'Tacos',
    'Burritos',
    'Volcanes',
    'Extras',
    'Bebidas',
  ],

  /** Devuelve todos los productos */
  obtenerTodos() {
    this._asegurarVersionMenu();

    if (this._cache) return this._cache;

    const guardados = Storage.leer(Storage.CLAVES.PRODUCTOS, null);
    this._cache = guardados && guardados.length ? guardados : this._sembrarDatosIniciales();
    return this._cache;
  },

  /** Si el menú guardado es de una versión anterior (o quedó incompleto por
   *  un error de guardado previo), lo reemplaza por el menú oficial
   *  actualizado. Solo marca la migración como "hecha" cuando el guardado
   *  en localStorage realmente tuvo éxito; si falla (ej. almacenamiento
   *  lleno), se reintentará la próxima vez que se cargue la página, sin
   *  perder por eso el menú completo en pantalla (se sigue mostrando desde
   *  memoria mientras tanto). */
  _migracionIntentada: false,
  _asegurarVersionMenu() {
    if (this._migracionIntentada) return;
    this._migracionIntentada = true;

    const menuOficial = this._generarMenuOficial();
    const versionGuardada = Storage.leer(Storage.CLAVES.VERSION_MENU, 0);
    const guardados = Storage.leer(Storage.CLAVES.PRODUCTOS, null);

    const versionDesactualizada = versionGuardada < this.VERSION_MENU;
    const menuIncompletoOCorrupto = this._pareceMenuIncompleto(guardados, menuOficial);

    if (versionDesactualizada || menuIncompletoOCorrupto) {
      this._cache = menuOficial;
      const guardadoOk = Storage.guardar(Storage.CLAVES.PRODUCTOS, menuOficial);
      // Solo confirmamos la versión como migrada si el menú realmente se
      // guardó. Así evitamos quedarnos con la "versión" marcada como al día
      // pero con un menú viejo/incompleto atorado en el almacenamiento.
      if (guardadoOk) {
        Storage.guardar(Storage.CLAVES.VERSION_MENU, this.VERSION_MENU);
      }
    }
  },

  /** Detecta si el menú guardado quedó incompleto por un fallo de guardado
   *  anterior (por ejemplo, le faltan categorías completas del menú oficial
   *  actual, como pasaría si solo se guardaron "Boneless" y "Alitas"). No
   *  se basa solo en la cantidad de productos para no confundir esto con
   *  que el propio negocio haya desactivado o eliminado productos a propósito. */
  _pareceMenuIncompleto(guardados, menuOficial) {
    if (!guardados || guardados.length === 0) return true;
    const categoriasGuardadas = new Set(guardados.map((p) => p.categoria));
    const categoriasOficiales = new Set(menuOficial.map((p) => p.categoria));
    let categoriasFaltantes = 0;
    categoriasOficiales.forEach((cat) => {
      if (!categoriasGuardadas.has(cat)) categoriasFaltantes += 1;
    });
    // Si faltan varias categorías completas del menú oficial, es casi
    // seguro que se trata de un menú viejo/truncado y no una decisión
    // deliberada de desactivar un par de categorías.
    return categoriasFaltantes >= 3;
  },

  /** Devuelve solo los productos activos (visibles para vender) */
  obtenerActivos() {
    return this.obtenerTodos().filter((p) => p.activo !== false);
  },

  /** Busca un producto por id */
  obtenerPorId(id) {
    return this.obtenerTodos().find((p) => p.id === id) || null;
  },

  /** Agrega un producto nuevo */
  agregar({ nombre, precio, categoria }) {
    const productos = this.obtenerTodos();
    const nuevo = {
      id: Utils.generarId('prod'),
      nombre: nombre.trim(),
      precio: Utils.redondear(precio),
      categoria: categoria || 'Otros',
      activo: true,
    };
    productos.push(nuevo);
    this._cache = productos;
    Storage.guardar(Storage.CLAVES.PRODUCTOS, productos);
    return nuevo;
  },

  /** Edita un producto existente */
  editar(id, cambios) {
    const productos = this.obtenerTodos();
    const idx = productos.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    productos[idx] = {
      ...productos[idx],
      ...cambios,
      precio: cambios.precio !== undefined ? Utils.redondear(cambios.precio) : productos[idx].precio,
    };
    this._cache = productos;
    Storage.guardar(Storage.CLAVES.PRODUCTOS, productos);
    return true;
  },

  /** Elimina un producto de forma permanente */
  eliminar(id) {
    const productos = this.obtenerTodos().filter((p) => p.id !== id);
    this._cache = productos;
    Storage.guardar(Storage.CLAVES.PRODUCTOS, productos);
  },

  /** Activa o desactiva un producto (soft delete, útil para temporadas/agotados) */
  alternarActivo(id) {
    const productos = this.obtenerTodos();
    const producto = productos.find((p) => p.id === id);
    if (producto) {
      producto.activo = !producto.activo;
      this._cache = productos;
      Storage.guardar(Storage.CLAVES.PRODUCTOS, productos);
    }
  },

  /** Reemplaza TODO el menú actual por el menú oficial de El Kraken (usar con precaución) */
  restaurarMenuOficial() {
    const menuOficial = this._generarMenuOficial();
    this._cache = menuOficial;
    const guardadoOk = Storage.guardar(Storage.CLAVES.PRODUCTOS, menuOficial);
    if (guardadoOk) {
      Storage.guardar(Storage.CLAVES.VERSION_MENU, this.VERSION_MENU);
    }
    return menuOficial;
  },

  /** Genera (sin guardar) el menú real y actualizado de El Kraken */
  _generarMenuOficial() {
    const p = (nombre, precio, categoria) => ({
      id: Utils.generarId('prod'),
      nombre,
      precio,
      categoria,
      activo: true,
    });

    return [
      // Favoritas
      p('Papas Bomba', 225, 'Favoritas'),

      // Papas y Botanas
      p('Papas Francesas', 65, 'Papas y Botanas'),
      p('Papas Gajo', 65, 'Papas y Botanas'),
      p('Dedos de Queso', 85, 'Papas y Botanas'),
      p('Aros de Cebolla', 85, 'Papas y Botanas'),
      p('Dedos de Queso Flamin Hot', 125, 'Papas y Botanas'),

      // Boneless
      p('6 Boneless', 115, 'Boneless'),
      p('12 Boneless', 220, 'Boneless'),
      p('18 Boneless', 300, 'Boneless'),

      // Alitas
      p('6 Alitas', 140, 'Alitas'),
      p('12 Alitas', 265, 'Alitas'),
      p('18 Alitas', 385, 'Alitas'),

      // Hamburguesas
      p('Cheeseburguer Sencilla', 115, 'Hamburguesas'),
      p('Cheeseburguer Doble', 150, 'Hamburguesas'),
      p('Bacon Cheeseburguer Sencilla', 160, 'Hamburguesas'),
      p('Bacon Cheeseburguer Doble', 200, 'Hamburguesas'),
      p('Cheese Jalapeño Sencilla', 125, 'Hamburguesas'),
      p('Cheese Jalapeño Doble', 160, 'Hamburguesas'),
      p('Chicken Sandwich Sencillo', 135, 'Hamburguesas'),
      p('Chicken Sandwich con Bacon', 160, 'Hamburguesas'),

      // Tacos
      p('Taco de Sirloin (Maíz)', 25, 'Tacos'),
      p('Taco de Sirloin (Harina)', 35, 'Tacos'),
      p('Taco de Discada (Maíz)', 25, 'Tacos'),
      p('Taco de Discada (Harina)', 35, 'Tacos'),
      p('Taco de Rib Eye (Maíz)', 60, 'Tacos'),
      p('Taco de Rib Eye (Harina)', 70, 'Tacos'),

      // Burritos
      p('Burrito de Sirloin', 125, 'Burritos'),
      p('Burrito de Discada', 125, 'Burritos'),
      p('Burrito de Rib Eye', 150, 'Burritos'),

      // Volcanes
      p('Volcán de Sirloin', 30, 'Volcanes'),
      p('Volcán de Discada', 30, 'Volcanes'),
      p('Volcán de Rib Eye', 65, 'Volcanes'),

      // Extras
      p('Chorizo Argentino o Chistorra Gratinada', 100, 'Extras'),
      p('Extra de Queso', 10, 'Extras'),
      p('Extra de Aguacate', 10, 'Extras'),
      p('Extra de Jalapeño', 15, 'Extras'),
      p('Extra (Salsa, Queso o Aderezo)', 25, 'Extras'),

      // Bebidas
      p('Refresco (600 ml)', 35, 'Bebidas'),
      p('Té Helado (Limón o Frambuesa)', 55, 'Bebidas'),
      p('Limonada Rosa', 65, 'Bebidas'),
      p('Botella de Agua', 15, 'Bebidas'),
      p('Michelada', 100, 'Bebidas'),
      p('Whisky', 130, 'Bebidas'),
      p('Corona Light', 35, 'Bebidas'),
      p('Indio', 35, 'Bebidas'),
      p('Modelo', 45, 'Bebidas'),
    ];
  },

  /** Siembra (genera y guarda) el menú oficial. Se usa cuando no hay
   *  absolutamente ningún producto guardado todavía. */
  _sembrarDatosIniciales() {
    const iniciales = this._generarMenuOficial();
    Storage.guardar(Storage.CLAVES.PRODUCTOS, iniciales);
    return iniciales;
  },
};
