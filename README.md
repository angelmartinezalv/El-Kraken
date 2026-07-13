# El Kraken POS — Versión 1 (HTML + CSS + JS)

Sistema de punto de venta local para el restaurante El Kraken, construido únicamente
con HTML5, CSS3 y JavaScript (ES6+), sin frameworks ni servidor.

## Cómo usarlo

### Opción A — Solo en una computadora (sin vista de cocina)
1. Descarga/descomprime toda la carpeta `elkrake-pos`.
2. Abre `Principal.html` con doble clic (funciona en cualquier navegador moderno: Chrome, Edge, Firefox).
3. No necesitas instalar nada ni tener internet, **excepto** para exportar a Excel
   en `corte.html`, que carga la librería SheetJS desde un CDN la primera vez.

### Opción B — Con pantalla de cocina en otra computadora (misma red) — RECOMENDADA
Para no tener que buscar entre los archivos ni escribir direcciones a mano,
usa los dos lanzadores incluidos:

**En la computadora de CAJA:**
1. Instala [Node.js](https://nodejs.org) una sola vez (versión "LTS").
2. Doble clic en **`Iniciar_El_Kraken.bat`**. Esto prende el servidor y abre
   el navegador automáticamente en `http://localhost:3000`. Deja esa ventana
   negra abierta (se puede minimizar) mientras el negocio esté funcionando.
3. En esa misma ventana aparece la IP que debes usar en la cocina, por
   ejemplo `http://192.168.1.5:3000/cocina.html`.

**En la computadora de COCINA (una sola vez):**
1. Abre `Abrir_Cocina.bat` con el Bloc de notas (clic derecho → "Editar" o "Abrir con → Bloc de notas").
2. Cambia la línea `set IP_DE_LA_CAJA=...` por la dirección que te mostró la
   computadora de caja en el paso anterior.
3. Guarda el archivo. De ahí en adelante, solo doble clic en
   `Abrir_Cocina.bat` y se abre solo la pantalla de cocina — no hace falta
   escribir nada más.

Nota: solo los **pedidos abiertos** (mesas en curso) se comparten con la
cocina. Ventas, cortes y el menú siguen guardándose únicamente en la
computadora de caja, tal como antes.

## Flujo de trabajo típico (pedir primero, cobrar después)

1. **pedidos.html** — Muestra las "mesas / cuentas abiertas". Crea una nueva
   (ej. "Mesa 3" o "Juan - para llevar") y agrega los productos que va pidiendo
   el cliente. La cuenta se queda abierta mientras la gente come — puedes tener
   varias mesas abiertas al mismo tiempo y regresar a agregarles productos.
2. **cobro.html** — Cuando el cliente termina de comer, entra a su cuenta y
   toca "Cobrar esta cuenta". Ahí se calcula el cambio, se registra la venta
   y se imprime el ticket (pensado para impresora térmica).
3. **ventas.html** — Historial de ventas ya cobradas, filtrable por fecha,
   con el nombre de la mesa/cliente de cada una.
4. **corte.html** — Genera el corte de caja del día y expórtalo a Excel.
5. **productos.html** — Administra el menú. Incluye un botón para restaurar
   el menú oficial de El Kraken en cualquier momento.

## Menú precargado (El Kraken)

- **Favoritas:** Papas Bomba — $225
- **Boneless:** 6 ($115), 12 ($220), 18 ($300)
- **Alitas:** 6 ($140), 12 ($265), 18 ($385)

Se muestra un aviso de la promoción vigente (papas de cortesía con la compra
de cualquier paquete de Boneless o Alitas) en la pantalla de pedidos, para que
el personal lo recuerde al tomar la orden.

## Dónde se guardan los datos

Toda la información (productos, ventas, cortes) se guarda en el **LocalStorage**
del navegador, es decir, en la misma computadora/tablet donde se usa. Si se borra
la caché del navegador, se pierden los datos — se recomienda exportar cortes a
Excel periódicamente como respaldo.

## Estructura del proyecto

```
elkrake-pos/
├── index.html          → Dashboard principal
├── pedidos.html         → Registro de pedidos
├── cobro.html           → Cobro y cálculo del cambio
├── ventas.html          → Historial de ventas
├── corte.html           → Corte de caja + exportación a Excel
├── productos.html       → Administración del menú
├── css/
│   ├── base.css         → Variables, layout, navegación, botones
│   └── componentes.css  → Componentes específicos (tarjetas, tablas, ticket)
├── js/
│   ├── data/            → Acceso a datos (LocalStorage) — capa a reemplazar al migrar a BD/API
│   │   ├── cuentas.js    → Mesas/cuentas abiertas (pedir primero, cobrar después)
│   │   ├── productos.js  → Menú (CRUD)
│   │   ├── ventas.js     → Historial de ventas ya cobradas
│   │   └── corte.js      → Corte de caja diario
│   ├── ui/               → Componentes de interfaz compartidos (navegación)
│   └── utils/            → Funciones auxiliares (moneda, fechas, notificaciones)
└── data/                 → Reservado para respaldos/configuración futura
```

## Siguientes pasos sugeridos (ver documento de escalabilidad)

- Migrar `js/data/*.js` para que consuman una API (Django REST Framework, Node, etc.)
  en vez de LocalStorage — el resto del código no necesita cambios.
- Agregar inicio de sesión y roles de usuario.
- Agregar gestión de mesas e inventario.
- Migrar la interfaz a React reutilizando la lógica ya modular.
