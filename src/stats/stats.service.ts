import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(filtros?: {
    desde?: string;
    hasta?: string;
    estado?: string;
    placa?: string;
    clienteId?: string;
  }) {
    const whereOT: any = {};

    // Filtro por fechas
    if (filtros?.desde || filtros?.hasta) {
      whereOT.fechaIngreso = {};
      if (filtros.desde) {
        whereOT.fechaIngreso.gte = new Date(filtros.desde);
      }
      if (filtros.hasta) {
        // incluir todo el día
        const hasta = new Date(filtros.hasta);
        hasta.setHours(23, 59, 59, 999);
        whereOT.fechaIngreso.lte = hasta;
      }
    }

    // Filtro por estado
    if (filtros?.estado) {
      whereOT.estado = filtros.estado;
    }

    // Filtro por placa
    if (filtros?.placa) {
      whereOT.vehiculo = {
        placa: {
          contains: filtros.placa.toUpperCase().trim(),
        },
      };
    }

    // Filtro por cliente
    if (filtros?.clienteId) {
      whereOT.vehiculo = {
        ...(whereOT.vehiculo || {}),
        clienteId: filtros.clienteId,
      };
    }

    // ======================
    // CONTEOS GENERALES
    // ======================
    const [
      totalClientes,
      totalVehiculos,
      totalOrdenes,
      ordenesEnProceso,
      ordenesListas,
      ordenesEntregadas,
      ordenesCanceladas,
      ordenesBorrador,
    ] = await Promise.all([
      this.prisma.cliente.count(),
      this.prisma.vehiculo.count(),
      this.prisma.ordenTrabajo.count({ where: whereOT }),
      this.prisma.ordenTrabajo.count({
        where: { ...whereOT, estado: 'EN_PROCESO' },
      }),
      this.prisma.ordenTrabajo.count({
        where: { ...whereOT, estado: 'LISTO' },
      }),
      this.prisma.ordenTrabajo.count({
        where: { ...whereOT, estado: 'ENTREGADO' },
      }),
      this.prisma.ordenTrabajo.count({
        where: { ...whereOT, estado: 'CANCELADA' },
      }),
      this.prisma.ordenTrabajo.count({
        where: { ...whereOT, estado: 'BORRADOR' },
      }),
    ]);

    // ======================
    // FINANZAS
    // ======================
    const ordenesFinanzas = await this.prisma.ordenTrabajo.findMany({
      where: whereOT,
      select: {
        total: true,
        totalPagado: true,
        saldoPendiente: true,
        estado: true,
      },
    });

    const totalFacturado = ordenesFinanzas.reduce(
      (acc, ot) => acc + ot.total,
      0,
    );
    const totalCobrado = ordenesFinanzas.reduce(
      (acc, ot) => acc + ot.totalPagado,
      0,
    );
    const totalPorCobrar = ordenesFinanzas.reduce(
      (acc, ot) => acc + ot.saldoPendiente,
      0,
    );

    // ======================
    // ÓRDENES POR ESTADO (para gráfico de torta / barras)
    // ======================
    const ordenesPorEstado = await this.prisma.ordenTrabajo.groupBy({
      by: ['estado'],
      where: whereOT,
      _count: { estado: true },
    });

    const porEstado = ordenesPorEstado.map((item) => ({
      estado: item.estado,
      cantidad: item._count.estado,
    }));

    // ======================
    // VEHÍCULOS EN TALLER (por etapa de producción)
    // ======================
    const etapasActivas = await this.prisma.etapaProduccion.findMany({
      where: {
        estado: { in: ['EN_PROCESO', 'PAUSADO', 'PENDIENTE'] },
        orden:
          filtros?.desde ||
          filtros?.hasta ||
          filtros?.estado ||
          filtros?.placa ||
          filtros?.clienteId
            ? { ...whereOT }
            : undefined,
      },
      include: {
        orden: {
          select: {
            numero: true,
            estado: true,
            vehiculo: {
              select: {
                placa: true,
                marca: true,
                modelo: true,
                cliente: { select: { nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { secuencia: 'asc' },
    });

    // Agrupar por nombre de etapa
    const vehiculosPorEtapa: Record<string, any[]> = {};
    for (const etapa of etapasActivas) {
      if (!vehiculosPorEtapa[etapa.nombre]) {
        vehiculosPorEtapa[etapa.nombre] = [];
      }
      vehiculosPorEtapa[etapa.nombre].push({
        etapaId: etapa.id,
        estadoEtapa: etapa.estado,
        responsable: etapa.responsable,
        ot: etapa.orden.numero,
        placa: etapa.orden.vehiculo.placa,
        vehiculo: `${etapa.orden.vehiculo.marca} ${etapa.orden.vehiculo.modelo}`,
        cliente: etapa.orden.vehiculo.cliente.nombre,
      });
    }

    const resumenEtapas = Object.entries(vehiculosPorEtapa).map(
      ([nombre, items]) => ({
        etapa: nombre,
        cantidad: items.length,
        vehiculos: items,
      }),
    );

    // ======================
    // ÚLTIMAS ÓRDENES
    // ======================
    const ultimasOrdenes = await this.prisma.ordenTrabajo.findMany({
      where: whereOT,
      take: 10,
      orderBy: { fechaIngreso: 'desc' },
      include: {
        vehiculo: {
          select: {
            placa: true,
            marca: true,
            modelo: true,
            cliente: { select: { nombre: true } },
          },
        },
      },
    });

    // ======================
    // VENTAS POR DÍA (últimos 30 días o rango filtrado)
    // ======================
    const desdeVentas = filtros?.desde
      ? new Date(filtros.desde)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const hastaVentas = filtros?.hasta ? new Date(filtros.hasta) : new Date();

    const ordenesParaGrafico = await this.prisma.ordenTrabajo.findMany({
      where: {
        ...whereOT,
        fechaIngreso: {
          gte: desdeVentas,
          lte: hastaVentas,
        },
        estado: { not: 'CANCELADA' },
      },
      select: {
        fechaIngreso: true,
        total: true,
        totalPagado: true,
      },
      orderBy: { fechaIngreso: 'asc' },
    });

    // Agrupar por día
    const ventasPorDiaMap = new Map<
      string,
      { facturado: number; cobrado: number; ordenes: number }
    >();

    for (const ot of ordenesParaGrafico) {
      const dia = ot.fechaIngreso.toISOString().split('T')[0];
      const actual = ventasPorDiaMap.get(dia) || {
        facturado: 0,
        cobrado: 0,
        ordenes: 0,
      };
      actual.facturado += ot.total;
      actual.cobrado += ot.totalPagado;
      actual.ordenes += 1;
      ventasPorDiaMap.set(dia, actual);
    }

    const ventasPorDia = Array.from(ventasPorDiaMap.entries()).map(
      ([fecha, data]) => ({
        fecha,
        ...data,
      }),
    );

    // ======================
    // RESPUESTA FINAL
    // ======================
    return {
      resumen: {
        clientes: totalClientes,
        vehiculos: totalVehiculos,
        ordenes: totalOrdenes,
        enProceso: ordenesEnProceso,
        listas: ordenesListas,
        entregadas: ordenesEntregadas,
        canceladas: ordenesCanceladas,
        borrador: ordenesBorrador,
      },
      finanzas: {
        totalFacturado,
        totalCobrado,
        totalPorCobrar,
        margenCobrado:
          totalFacturado > 0
            ? Math.round((totalCobrado / totalFacturado) * 100)
            : 0,
      },
      porEstado,
      vehiculosEnTaller: {
        total: etapasActivas.length,
        porEtapa: resumenEtapas,
      },
      ventasPorDia,
      ultimasOrdenes: ultimasOrdenes.map((ot) => ({
        numero: ot.numero,
        fecha: ot.fechaIngreso,
        estado: ot.estado,
        total: ot.total,
        totalPagado: ot.totalPagado,
        saldoPendiente: ot.saldoPendiente,
        placa: ot.vehiculo.placa,
        vehiculo: `${ot.vehiculo.marca} ${ot.vehiculo.modelo}`,
        cliente: ot.vehiculo.cliente.nombre,
      })),
    };
  }

  // Endpoint rápido solo de conteos (para cards)
  async getResumenRapido() {
    const [clientes, vehiculos, enProceso, listas, entregadas, porCobrar] =
      await Promise.all([
        this.prisma.cliente.count(),
        this.prisma.vehiculo.count(),
        this.prisma.ordenTrabajo.count({ where: { estado: 'EN_PROCESO' } }),
        this.prisma.ordenTrabajo.count({ where: { estado: 'LISTO' } }),
        this.prisma.ordenTrabajo.count({ where: { estado: 'ENTREGADO' } }),
        this.prisma.ordenTrabajo.aggregate({
          _sum: { saldoPendiente: true },
          where: { saldoPendiente: { gt: 0 } },
        }),
      ]);

    return {
      clientes,
      vehiculos,
      enProceso,
      listas,
      entregadas,
      porCobrar: porCobrar._sum.saldoPendiente || 0,
    };
  }
}
