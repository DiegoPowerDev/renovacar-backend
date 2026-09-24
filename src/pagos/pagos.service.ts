import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagosService {
  constructor(private prisma: PrismaService) {}

  // Recalcular totales de pago de una OT
  private async recalcularPagos(ordenId: string) {
    const pagos = await this.prisma.pago.findMany({
      where: { ordenId },
    });

    const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);

    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id: ordenId },
    });

    if (!orden) return;

    const saldoPendiente = Math.max(orden.total - totalPagado, 0);

    return this.prisma.ordenTrabajo.update({
      where: { id: ordenId },
      data: {
        totalPagado,
        saldoPendiente,
      },
    });
  }

  // Registrar un pago
  async registrarPago(data: {
    numeroOT: string;
    monto: number;
    metodo: string;
    comprobante?: string;
    observaciones?: string;
    fecha?: string;
    registradoPor?: string;
  }) {
    const metodosValidos = [
      'EFECTIVO',
      'YAPE',
      'PLIN',
      'TRANSFERENCIA',
      'TARJETA',
      'OTRO',
    ];

    if (!metodosValidos.includes(data.metodo.toUpperCase())) {
      throw new BadRequestException(
        `Método de pago inválido. Usa: ${metodosValidos.join(', ')}`,
      );
    }

    if (data.monto <= 0) {
      throw new BadRequestException('El monto debe ser mayor a 0');
    }

    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: data.numeroOT },
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${data.numeroOT} no encontrada`);
    }

    // Crear el pago
    const pago = await this.prisma.pago.create({
      data: {
        ordenId: orden.id,
        monto: data.monto,
        metodo: data.metodo.toUpperCase(),
        comprobante: data.comprobante,
        observaciones: data.observaciones,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        registradoPor: data.registradoPor,
      },
    });

    // Recalcular totales
    await this.recalcularPagos(orden.id);

    // Devolver la OT actualizada con sus pagos
    return this.obtenerResumenPagos(data.numeroOT);
  }

  // Obtener resumen de pagos de una OT
  async obtenerResumenPagos(numeroOT: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: numeroOT },
      include: {
        pagos: {
          orderBy: { fecha: 'asc' },
        },
        vehiculo: {
          include: { cliente: true },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${numeroOT} no encontrada`);
    }

    return {
      numero: orden.numero,
      total: orden.total,
      totalPagado: orden.totalPagado,
      saldoPendiente: orden.saldoPendiente,
      estado: orden.estado,
      estadoCotizacion: orden.estadoCotizacion,
      cliente: orden.vehiculo.cliente.nombre,
      placa: orden.vehiculo.placa,
      pagos: orden.pagos,
    };
  }

  // Eliminar un pago (solo si es necesario)
  async eliminarPago(pagoId: string) {
    const pago = await this.prisma.pago.findUnique({
      where: { id: pagoId },
      include: { orden: true },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    await this.prisma.pago.delete({ where: { id: pagoId } });
    await this.recalcularPagos(pago.ordenId);

    return this.obtenerResumenPagos(pago.orden.numero);
  }

  // Listar todos los pagos (para reportes)
  async findAll() {
    return this.prisma.pago.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        orden: {
          select: {
            numero: true,
            total: true,
            vehiculo: {
              select: {
                placa: true,
                cliente: {
                  select: { nombre: true },
                },
              },
            },
          },
        },
      },
    });
  }
}
