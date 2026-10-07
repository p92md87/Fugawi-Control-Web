# Fugawi IA Control v045 — Salamanca · Estación de Cantalapiedra

Fecha: 2026-10-07

## Objetivo

Simplificar la página operativa y añadir la campaña activa de Salamanca para el
control físico diagnóstico independiente:

`SAL-CF-CAN-EST-001`

## Interfaz visible

Se conservan únicamente:

- Validar geometría / Q47;
- Captura RAW genérica;
- Salamanca · Estación de Cantalapiedra · 1 control.

Las campañas específicas antiguas de Barcelona y Granada dejan de ocupar espacio
en la interfaz. Sus definiciones internas, referencias y evidencias históricas se
conservan para trazabilidad y regresión; no pueden iniciarse desde la página normal.

## Campaña Salamanca

Campaña:

`SALAMANCA_ESTACION_CANTALAPIEDRA_RAW18315_V001`

Raster obligatorio:

`SALAMANCA 4_5.jpg`

Dimensiones:

`18315 x 13827`

SHA256:

`6edb2280141118fe04292a0b88c7e9ea49e886e5a9de7647020014f6a6bd0eab`

Dominio:

`PIXEL_RASTER_ORIGINAL`

Referencia congelada:

`referencias/Referencia_Salamanca_Estacion_Cantalapiedra_v001.txt`

Control:

`SAL-CF-CAN-EST-001`

La Web centra exclusivamente una zona amplia aproximada:

`NAV_X=0.6048`

`NAV_Y=0.3244`

No muestra la coordenada oficial, no coloca cruceta automática y no calcula residual.

El usuario debe identificar visualmente el símbolo de estación y seleccionar
manualmente su centro. Se conserva ajuste fino ±1 px.

## Exportación

La exportación se habilita con:

`CONTROLES=1`

`TOTAL=1`

`COMPLETA=SI`

La traza registra:

- versión/build;
- raster, dimensiones y SHA256;
- dominio RAW;
- referencia congelada y SHA256;
- campaña;
- control;
- PIX_X / PIX_Y;
- SELECCION_ORIGEN;
- transformaciones de píxel = 0;
- malla no modificada.

## Caché y versión

Versión visible: `v045`

Build: `045.0`

Service worker: `fugawi-control-v045`

Se actualizan referencias de assets a `?v=045` y el manifest a v045.

## Verificación

- sintaxis JavaScript raw.js: PASS;
- campaña Salamanca definida: PASS;
- acceso principal Salamanca: PASS;
- acceso Salamanca en barra RAW: PASS;
- campañas antiguas ocultas: PASS;
- service worker v045: PASS;
- registro app.js v045: PASS;
- manifest v045: PASS;
- título v045: PASS.

## Invariantes

`MALLA_MODIFICADA=NO`

`RET89_MODIFICADO=NO`

`CUADRILATEROS_MODIFICADOS=NO`

`COORDENADA_OFICIAL_VISIBLE_DURANTE_CAPTURA=NO`

`CRUCETA_AUTOMATICA=NO`
