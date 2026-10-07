# Fugawi IA Control v047 — limpieza definitiva + ajuste ±1 px

Fecha: 2026-10-07

## Correcciones

1. Se eliminan físicamente del HTML operativo 22 botones de campañas antiguas.
2. Se retiran del runtime activo 24.603 bytes de definiciones legacy de campañas.
3. Se conserva únicamente:
   - Validar geometría / Q47;
   - Captura RAW genérica;
   - Salamanca · Estación de Cantalapiedra · 1 control.
4. Se restauran y refuerzan las flechas de ajuste ±1 px.
5. Se mantiene una botonera rápida superior y otra junto a la lupa/contexto.
6. Se incrementa el tamaño táctil de las flechas para iPad.
7. Service worker, app, manifest y assets quedan sincronizados en v047.

## Verificación

RAW_JS_SYNTAX=PASS
LEGACY_BUTTONS_PRESENT=0
ARROW_IDS_MISSING=0
ARROW_LISTENERS_MISSING=0
QUICK_NUDGE_FORCED_VISIBLE=SI
NUDGE_DOCK_VISIBLE_WHEN_LOADED=SI
SERVICE_WORKER_V047=PASS
MANIFEST_V047=PASS

MALLA_MODIFICADA=NO
RET89_MODIFICADO=NO
CUADRILATEROS_MODIFICADOS=NO
