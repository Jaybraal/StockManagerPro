# StockManagerPro — Facturación electrónica (uso interno) — Diseño

**Fecha:** 2026-07-13
**Alcance:** Conectar StockManagerPro a un emisor real de facturas electrónicas (e-CF) para uso interno del propio negocio del usuario (ferretería). NO es un plan para vender StockManagerPro como SaaS a terceros — eso ya se descartó (falta módulo de ventas completo, mercado local ya copado por Alegra/ManguPos/POSIUM).

## Estado real del código (verificado hoy)

- `backend/app.py:1656` — `POST /api/webhook/invoice/<tenant_id>`: endpoint público autenticado por API key (`X-API-Key` header o `?api_key=`), ya en producción. Espera `{ invoice_number?, items: [{barcode|name, quantity}] }`, descuenta stock por `Product`, registra `StockMovement` con `reason='Factura {invoice_number} (sistema externo)'`, emite alerta de stock bajo por WebSocket si aplica.
- `backend/app.py:1622-1650` — `GET /api/billing/<tenant_id>/config` y `POST /api/billing/<tenant_id>/regenerate-key`: ya gestionan la API key de este webhook desde el panel de Settings.
- `backend/utils/websocket.py:27-56` — `emit_invoice_request`/`emit_invoice_ready`/`emit_invoice_rejected`: funciones que emiten eventos con `sale_id`, `ncf`, `cashier_id` — **pero ninguna se llama desde ningún lado del backend** (confirmado con grep). Es scaffolding preparado para un futuro flujo de caja/venta que nunca se construyó, no hay `Sale` model ni NCF real en ningún lado hoy.
- Conclusión: el diseño del sistema YA asume correctamente el patrón correcto — "la venta y el NCF ocurren en otro sistema, StockManagerPro solo escucha y descuenta inventario". No hay que rediseñar StockManagerPro, hay que elegir qué sistema externo emite la factura.

## Corrección importante sobre la fecha límite

Hubo una discrepancia entre dos búsquedas hechas hoy: una fuente dijo 15 de noviembre de 2026, otra (DGII directamente, "DGII exhorta a MIPYMES... antes del 15 de mayo de 2026") dice **15 de mayo de 2026** para MIPYMES/profesionales liberales bajo la Ley 32-23. Hoy es 13 de julio de 2026 — **esa fecha ya pasó**. El usuario debe confirmar directamente en dgii.gov.do (o con un contador) cuál es el plazo real que le aplica a su categoría específica de contribuyente antes de asumir que hay margen — no lo dejes para después.

## Tres caminos evaluados

1. **Facturador Gratuito de la DGII** — gratis, certificado digital sin costo, pensado para MIPYMES sin sistema propio, con soporte/capacitación. Es un portal para cargar facturas manualmente, no una API — no se integra con el webhook de StockManagerPro sin trabajo manual doble (cajero factura ahí Y el stock hay que descontarlo aparte).
2. **Integración directa con la API RESTful de la DGII** — el contribuyente debe autorizarse ante la DGII como emisor con sistema propio; hay librerías open-source y la integración en sí toma 1-3 semanas de desarrollo una vez autorizado. Sin costo recurrente de terceros, pero el trámite de autorización/certificación ante la DGII es el cuello de botella (tiempo no controlado por nosotros).
3. **Alegra Facturación Electrónica/POS** — desde US$19-25/mes (Plan Emprendedor), incluye emisión de e-CF conforme a la Ley 32-23, prueba gratis de 15 días, soporte 24/7. Tiene API para integraciones externas (requiere plan Plus) y soporta Zapier para automatizar sin código.

## Recomendación

**Camino 3 (Alegra) es el más rápido y el que mejor encaja con lo que StockManagerPro ya espera.** Arquitectura recomendada:

```
Cliente compra → Alegra POS/Facturación (checkout + emite e-CF real ante DGII)
                        │
                        │ webhook / Zapier / script de sincronización
                        ▼
        POST /api/webhook/invoice/<tenant_id>  (StockManagerPro, ya existe)
                        │
                        ▼
        Descuenta stock, registra StockMovement, alerta stock bajo
```

Alegra se convierte en el punto de venta real (caja + e-CF), StockManagerPro sigue siendo el sistema de inventario, exactamente el rol para el que ya está construido su webhook. Costo: ~US$19-25/mes, sin desarrollo nuevo del lado de StockManagerPro (el endpoint ya existe y ya recibe `{invoice_number, items}}` — solo hay que armar la pieza intermedia que traduzca el evento "factura creada" de Alegra a ese payload, vía su API o Zapier).

**Camino 2 (DGII directo) queda como alternativa de más largo plazo** si el usuario prefiere no pagar mensualidad y no le urge — el trámite de autorización ante la DGII es el paso que decide el tiempo real, no la integración en sí.

## Qué falta decidir (le corresponde al usuario, no a este spec)

1. Confirmar con la DGII o un contador cuál es el plazo real de cumplimiento para su categoría — puede que ya esté vencido.
2. Si acepta pagar ~$20/mes por Alegra, o prefiere el camino gratuito de la DGII asumiendo más trámite/tiempo.
3. Si Alegra: confirmar si su plan Plus (con API) es necesario desde el día uno, o si Zapier alcanza para el volumen de ventas real de la ferretería.

## Fuera de alcance

Construir un checkout/caja propio dentro de StockManagerPro, o integrar con cualquier proveedor de facturación que no sea Alegra o la DGII directa (no se investigaron otros por acotar el alcance).
