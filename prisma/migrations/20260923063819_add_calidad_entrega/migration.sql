-- CreateTable
CREATE TABLE "ControlCalidad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "inspector" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordenId" TEXT NOT NULL,
    CONSTRAINT "ControlCalidad_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hora" TEXT,
    "entregadoPor" TEXT,
    "recibidoPor" TEXT,
    "kilometraje" INTEGER,
    "observaciones" TEXT,
    "conformidad" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordenId" TEXT NOT NULL,
    CONSTRAINT "Entrega_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ControlCalidad_ordenId_key" ON "ControlCalidad"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "Entrega_ordenId_key" ON "Entrega"("ordenId");
