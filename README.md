# Fugawi IA Control

Panel web de ingeniería para preparar y auditar órdenes de desarrollo del proyecto Fugawi.

## Estado
- **v006**: interfaz guiada por tareas y validador geométrico Q47, optimizada para iPad.
- Muestra a primera vista versión operativa, siguiente versión, modo, protección de arquitectura y estado del flujo.
- Incluye tarjetas para regresiones, mejoras, reestructuración, comparación, nuevas versiones y pruebas.
- Genera órdenes técnicas con las protecciones de ingeniería de Fugawi.
- Incluye «Validar geometría / Q47»: selección local de `4-5 SALAMANCA.PNG`, recorte Q47, cuatro subcuadriláteros, sombreado del exterior de Q47, toque de control, exclusiones, diagnóstico de distancia al borde, interpolación bilineal, controles pendientes IGN/PNOA, «Nueva prueba Q47», registro de la selección actual y exportación de traza.
- El validador reproduce la geometría Q47 de P3N_042 sin modificar P3N_042. El PNG 18315×13827 se mantiene separado del espacio geométrico P3N 18316×13828 y se convierte proporcionalmente entre ambos.
- Mantiene historial local y exportación TXT/JSON.
- El repositorio operativo `Fugawi` permanece privado y separado.
- Este repositorio público no contiene el raster Salamanca; el PNG se procesa localmente en el navegador. No debe contener mapas, trazas privadas, tokens ni claves.
- La ejecución directa GitHub/Codex queda para una fase posterior mediante un puente autenticado seguro.

## Publicación
GitHub Pages mediante GitHub Actions.

## URL
https://p92md87.github.io/Fugawi-Control-Web/
