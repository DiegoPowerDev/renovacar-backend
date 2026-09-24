import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de Renova Car Service...');

  // Limpiar datos existentes (opcional, comenta si no quieres borrar)
  await prisma.pago.deleteMany();
  await prisma.itemCotizacion.deleteMany();
  await prisma.etapaProduccion.deleteMany();
  await prisma.controlCalidad.deleteMany();
  await prisma.entrega.deleteMany();
  await prisma.ordenTrabajo.deleteMany();
  await prisma.vehiculo.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.servicioCatalogo.deleteMany();

  // ======================
  // CLIENTES
  // ======================
  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: 'Juan Pérez García',
      dniRuc: '45678912',
      telefono: '999888777',
      whatsapp: '999888777',
      correo: 'juan.perez@email.com',
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: 'María López Vargas',
      dniRuc: '71234567',
      telefono: '987654321',
      whatsapp: '987654321',
      correo: 'maria.lopez@gmail.com',
    },
  });

  const cliente3 = await prisma.cliente.create({
    data: {
      nombre: 'Carlos Mendoza Ríos',
      dniRuc: '40123456',
      telefono: '945612378',
      whatsapp: '945612378',
      correo: 'carlos.mendoza@outlook.com',
    },
  });

  const cliente4 = await prisma.cliente.create({
    data: {
      nombre: 'Ana Torres Huamán',
      dniRuc: '72345678',
      telefono: '912345678',
      whatsapp: '912345678',
      correo: 'ana.torres@empresa.pe',
    },
  });

  const cliente5 = await prisma.cliente.create({
    data: {
      nombre: 'Empresa Transportes del Sur SAC',
      dniRuc: '20123456789',
      telefono: '014567890',
      whatsapp: '999111222',
      correo: 'flota@transportesdelsur.pe',
    },
  });

  // ======================
  // VEHÍCULOS
  // ======================
  const vehiculo1 = await prisma.vehiculo.create({
    data: {
      placa: 'ABC-123',
      marca: 'Toyota',
      modelo: 'Yaris',
      anio: 2022,
      color: 'Blanco',
      clienteId: cliente1.id,
    },
  });

  const vehiculo2 = await prisma.vehiculo.create({
    data: {
      placa: 'XYZ-456',
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2021,
      color: 'Plata',
      clienteId: cliente1.id,
    },
  });

  const vehiculo3 = await prisma.vehiculo.create({
    data: {
      placa: 'DEF-789',
      marca: 'Kia',
      modelo: 'Sportage',
      anio: 2023,
      color: 'Negro',
      clienteId: cliente2.id,
    },
  });

  const vehiculo4 = await prisma.vehiculo.create({
    data: {
      placa: 'GHI-321',
      marca: 'Hyundai',
      modelo: 'Tucson',
      anio: 2020,
      color: 'Rojo',
      clienteId: cliente3.id,
    },
  });

  const vehiculo5 = await prisma.vehiculo.create({
    data: {
      placa: 'JKL-654',
      marca: 'Nissan',
      modelo: 'Frontier',
      anio: 2019,
      color: 'Gris',
      clienteId: cliente5.id,
    },
  });

  const vehiculo6 = await prisma.vehiculo.create({
    data: {
      placa: 'MNO-987',
      marca: 'Chevrolet',
      modelo: 'Spark',
      anio: 2018,
      color: 'Azul',
      clienteId: cliente4.id,
    },
  });

  // ======================
  // CATÁLOGO DE SERVICIOS
  // ======================
  await prisma.servicioCatalogo.createMany({
    data: [
      {
        nombre: 'Pintura de puerta',
        descripcion: 'Pintura completa de una puerta',
        precioBase: 250,
      },
      {
        nombre: 'Planchado',
        descripcion: 'Enderezado de lámina',
        precioBase: 150,
      },
      {
        nombre: 'Pulido',
        descripcion: 'Pulido de carrocería',
        precioBase: 100,
      },
      {
        nombre: 'Detailing completo',
        descripcion: 'Lavado + descontaminación + protección',
        precioBase: 450,
      },
      {
        nombre: 'Pintura de capo',
        descripcion: 'Pintura completa del capo',
        precioBase: 320,
      },
      {
        nombre: 'Cambio de faro',
        descripcion: 'Suministro e instalación de faro',
        precioBase: 180,
      },
    ],
  });

  // ======================
  // ÓRDENES DE TRABAJO DE EJEMPLO
  // ======================
  const ot1 = await prisma.ordenTrabajo.create({
    data: {
      numero: 'OT-2026-000001',
      vehiculoId: vehiculo1.id,
      estado: 'ENTREGADO',
      estadoCotizacion: 'ACEPTADA',
      subtotal: 500,
      descuentoTotal: 0,
      total: 500,
      totalPagado: 500,
      saldoPendiente: 0,
      observaciones: 'Pintura puerta y pulido',
      kilometraje: 32000,
      items: {
        create: [
          {
            nombre: 'Pintura de puerta',
            cantidad: 1,
            precioUnitario: 250,
            descuento: 0,
            subtotal: 250,
          },
          {
            nombre: 'Pulido',
            cantidad: 1,
            precioUnitario: 100,
            descuento: 0,
            subtotal: 100,
          },
          {
            nombre: 'Planchado',
            cantidad: 1,
            precioUnitario: 150,
            descuento: 0,
            subtotal: 150,
          },
        ],
      },
      pagos: {
        create: [
          {
            monto: 300,
            metodo: 'YAPE',
            comprobante: 'OP-111222',
            observaciones: 'Adelanto',
          },
          {
            monto: 200,
            metodo: 'EFECTIVO',
            observaciones: 'Saldo al entregar',
          },
        ],
      },
    },
  });

  const ot2 = await prisma.ordenTrabajo.create({
    data: {
      numero: 'OT-2026-000002',
      vehiculoId: vehiculo3.id,
      estado: 'EN_PROCESO',
      estadoCotizacion: 'ACEPTADA',
      subtotal: 450,
      descuentoTotal: 0,
      total: 450,
      totalPagado: 200,
      saldoPendiente: 250,
      observaciones: 'Detailing completo',
      kilometraje: 18500,
      items: {
        create: [
          {
            nombre: 'Detailing completo',
            cantidad: 1,
            precioUnitario: 450,
            descuento: 0,
            subtotal: 450,
          },
        ],
      },
      pagos: {
        create: [
          { monto: 200, metodo: 'TRANSFERENCIA', comprobante: 'TRX-998877' },
        ],
      },
    },
  });

  const ot3 = await prisma.ordenTrabajo.create({
    data: {
      numero: 'OT-2026-000003',
      vehiculoId: vehiculo1.id,
      estado: 'BORRADOR',
      estadoCotizacion: 'BORRADOR',
      subtotal: 0,
      total: 0,
      totalPagado: 0,
      saldoPendiente: 0,
      observaciones: 'Cliente consultó por rayones en lateral',
      kilometraje: 33500,
    },
  });

  console.log('✅ Seed completado correctamente');
  console.log(`   - ${5} clientes creados`);
  console.log(`   - ${6} vehículos creados`);
  console.log(`   - ${3} órdenes de trabajo creadas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
