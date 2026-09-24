-- CreateTable
CREATE TABLE "EtapaProduccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "secuencia" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "responsable" TEXT,
    "fechaInicio" DATETIME,
    "fechaFin" DATETIME,
    "observaciones" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "ordenId" TEXT NOT NULL,
    CONSTRAINT "EtapaProduccion_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
