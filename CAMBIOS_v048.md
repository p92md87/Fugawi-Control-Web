# Fugawi IA Control v048 — segundo control independiente Salamanca

Fecha: 2026-10-07

## Causa

La estación de Cantalapiedra aporta un primer diagnóstico, pero no justifica por sí sola una corrección local de la malla. Se incorpora un segundo control físico anterior a 1977 con coordenada oficial independiente.

## Control añadido

- ID: SAL-CF-TRA-PK26150-001
- Objeto: puente del río Trabancos / cruce ferrocarril–río.
- Línea: Medina del Campo–Salamanca.
- PK ferroviario: 26+150.
- Fuente PK: BOE-A-2007-18473.
- Fuente de coordenada: Confederación Hidrográfica del Duero, proyecto CA-24/2019.
- Coordenada ETRS89 / UTM 30N: E=320183.578, N=4560855.329.
- Captura: manual en PIXEL_RASTER_ORIGINAL.
- La Web centra sólo una zona amplia y no muestra la coordenada oficial ni coloca cruceta automática.

## Alcance

Se modifican únicamente los archivos de la Web de captura y se añade la referencia congelada.

MALLA_MODIFICADA=NO
RET89_MODIFICADO=NO
CUADRILATEROS_MODIFICADOS=NO
FUGAWI_OPERATIVO_MODIFICADO=NO

## Decisión posterior

No se autoriza ninguna corrección local. Sólo después de la captura RAW se calcularán cuadrilátero, u/v, E/N interpoladas, DE, DN y residual. Una corrección local sólo podrá plantearse si este segundo control reproduce de forma compatible la desviación observada en el primer control.
