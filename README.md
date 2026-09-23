# Fugawi IA Control

Panel web de ingeniería para preparar y auditar órdenes de desarrollo del proyecto Fugawi.

## Estado
- **v017**: añade «Ir a zona aproximada» a la campaña Granada. Cada objetivo centra automáticamente una región amplia del raster sin colocar cruceta ni sugerir píxel; conserva zoom táctil/paneo y pasa al área del siguiente control tras registrarlo. La campaña pasa a V002 y sustituye Moreda —fuera de la envolvente útil del raster— por la Presa de Iznájar.
- **v016**: añade navegación táctil tipo Fugawi al capturador RAW: arrastre con un dedo para desplazar el raster, pellizco con dos dedos para zoom continuo 1×–8× manteniendo el área bajo los dedos, y toque breve para seleccionar el píxel RAW. Conserva los botones 1×/2×/4× y el ajuste fino ±1 px.
- **v015**: mueve el conjunto ampliación local + flechas fuera de la superficie del mapa, colocándolo al inicio de la columna lateral contigua. En pantallas anchas queda alineado junto al mapa sin ocultarlo; en pantallas estrechas pasa a bloque normal sin superposición.
- **v014**: agrupa la ampliación local 40×40 px RAW y las flechas de ajuste ±1 px en un único panel flotante sobre el mapa, para mantener mapa, lupa y ajuste fino en la misma zona visual durante la captura en iPad.
- **v013**: mueve las flechas de ajuste fino ±1 px desde el inspector lateral a un control flotante superpuesto al mapa para mantenerlas visibles durante la localización en iPad. Conserva íntegra la campaña Granada v012 y el dominio RAW.
- **v012**: añade una campaña guiada de seis controles independientes para Granada sobre `GRANADA 3_6.PNG`, con verificación estricta de 18748×13831 px y SHA-256, objetivos GR-CF01…GR-CF06, captura secuencial en `PIXEL_RASTER_ORIGINAL` y exportación de traza específica para contraste posterior IGN/PNOA. Mantiene el validador Q47 y el RAW genérico.
- Muestra a primera vista versión operativa, siguiente versión, modo, protección de arquitectura y estado del flujo.
- Incluye tarjetas para regresiones, mejoras, reestructuración, comparación, nuevas versiones y pruebas.
- Genera órdenes técnicas con las protecciones de ingeniería de Fugawi.
- Incluye «Validar geometría / Q47»: selección local de `4-5 SALAMANCA.PNG`, recorte Q47, cuatro subcuadriláteros, sombreado del exterior de Q47, toque de control, exclusiones, diagnóstico de distancia al borde, interpolación bilineal, controles pendientes IGN/PNOA, «Nueva prueba Q47», registro de selección, control histórico certificado La Carolina 45367, comparación selección/control, separación entre autotest de regresión y validación geográfica, y exportación de traza. La cruceta de selección táctil se dibuja en rojo para mejorar su visibilidad sobre el raster.
- El validador reproduce la geometría Q47 de P3N_042 sin modificar P3N_042. El PNG 18315×13827 se mantiene separado del espacio geométrico P3N 18316×13828 y se convierte proporcionalmente entre ambos.
- Incluye «Captura RAW de controles»: carga local de cualquier raster, coordenadas en `PIXEL_RASTER_ORIGINAL`, zoom visual 1×/2×/4×, cruceta roja, ampliación local 40×40 px, ajuste fino de 1 píxel, clasificación del objeto, SHA-256 del raster y exportación de traza. No calcula coordenadas geográficas ni modifica la malla.
- La campaña Granada de v012 bloquea nombres/tipos de los seis objetivos, valida la identidad del raster antes de aceptar capturas, impide duplicar un objetivo y exporta sólo los controles de campaña cuando este modo está activo.
- Mantiene historial local y exportación TXT/JSON.
- El repositorio operativo `Fugawi` permanece privado y separado.
- Este repositorio público no contiene el raster Salamanca; el PNG se procesa localmente en el navegador. No debe contener mapas, trazas privadas, tokens ni claves.
- La ejecución directa GitHub/Codex queda para una fase posterior mediante un puente autenticado seguro.

## Publicación
GitHub Pages mediante GitHub Actions.

## URL
https://p92md87.github.io/Fugawi-Control-Web/
