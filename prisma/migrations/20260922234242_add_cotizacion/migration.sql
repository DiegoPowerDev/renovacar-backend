-- CreateTable
CREATE TABLE "ServicioCatalogo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioBase" REAL NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ItemCotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "cantidad" REAL NOT NULL DEFAULT 1,
    "precioUnitario" REAL NOT NULL,
    "descuento" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "ordenId" TEXT NOT NULL,
    "servicioCatalogoId" TEXT,
    CONSTRAINT "ItemCotizacion_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemCotizacion_servicioCatalogoId_fkey" FOREIGN KEY ("servicioCatalogoId") REFERENCES "ServicioCatalogo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    CONSTRAINT "OrdenTrabajo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrdenTrabajo" ("actualizadoEn", "creadoEn", "estado", "fechaIngreso", "fechaPrometida", "id", "kilometraje", "nivelCombustible", "numero", "observaciones", "vehiculoId") SELECT "actualizadoEn", "creadoEn", "estado", "fechaIngreso", "fechaPrometida", "id", "kilometraje", "nivelCombustible", "numero", "observaciones", "vehiculoId" FROM "OrdenTrabajo";
DROP TABLE "OrdenTrabajo";
ALTER TABLE "new_OrdenTrabajo" RENAME TO "OrdenTrabajo";
CREATE UNIQUE INDEX "OrdenTrabajo_numero_key" ON "OrdenTrabajo"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
