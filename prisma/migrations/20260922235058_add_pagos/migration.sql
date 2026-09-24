-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monto" REAL NOT NULL,
    "metodo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comprobante" TEXT,
    "observaciones" TEXT,
    "registradoPor" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordenId" TEXT NOT NULL,
    CONSTRAINT "Pago_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrdenTrabajo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "fechaIngreso" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaPrometida" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "kilometraje" INTEGER,
    "nivelCombustible" TEXT,
    "estadoCotizacion" TEXT NOT NULL DEFAULT 'BORRADOR',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "descuentoTotal" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "totalPagado" REAL NOT NULL DEFAULT 0,
    "saldoPendiente" REAL NOT NULL DEFAULT 0,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    CONSTRAINT "OrdenTrabajo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrdenTrabajo" ("actualizadoEn", "creadoEn", "descuentoTotal", "estado", "estadoCotizacion", "fechaIngreso", "fechaPrometida", "id", "kilometraje", "nivelCombustible", "numero", "observaciones", "subtotal", "total", "vehiculoId") SELECT "actualizadoEn", "creadoEn", "descuentoTotal", "estado", "estadoCotizacion", "fechaIngreso", "fechaPrometida", "id", "kilometraje", "nivelCombustible", "numero", "observaciones", "subtotal", "total", "vehiculoId" FROM "OrdenTrabajo";
DROP TABLE "OrdenTrabajo";
ALTER TABLE "new_OrdenTrabajo" RENAME TO "OrdenTrabajo";
CREATE UNIQUE INDEX "OrdenTrabajo_numero_key" ON "OrdenTrabajo"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
