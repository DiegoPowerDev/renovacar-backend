import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalidadEntregaService {
  constructor(private prisma: PrismaService) {}

  // ======================
  // CONTROL DE CALIDAD
  // ======================

  async registrarControlCalidad(data: {
    numeroOT: string;
    aprobado: boolean;
    observaciones?: string;
    inspector?: string;
  }) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: data.numeroOT },
      include: { controlCalidad: true, etapas: true },
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${data.numeroOT} no encontrada`);
    }

    // Verificar que todas las etapas estén terminadas
    const etapasPendientes = orden.etapas.filter(
      (e) => e.estado !== 'TERMINADO',
    );
    if (etapasPendientes.length > 0) {
      throw new BadRequestException(
        `Aún hay ${etapasPendientes.length} etapa(s) sin terminar. No se puede hacer control de calidad.`,
      );
    }

    // Si ya existe un control, lo actualizamos
    if (orden.controlCalidad) {
      await this.prisma.controlCalidad.update({
        where: { ordenId: orden.id },
        data: {
          aprobado: data.aprobado,
          observaciones: data.observaciones,
          inspector: data.inspector,
          fecha: new Date(),
        },
      });
    } else {
      await this.prisma.controlCalidad.create({
        data: {
          ordenId: orden.id,
          aprobado: data.aprobado,
          observaciones: data.observaciones,
          inspector: data.inspector,
        },
      });
    }

    // Actualizar estado de la OT
    const nuevoEstado = data.aprobado ? 'LISTO' : 'EN_PROCESO';

    await this.prisma.ordenTrabajo.update({
      where: { id: orden.id },
      data: { estado: nuevoEstado },
    });

    return this.obtenerEstadoFinal(data.numeroOT);
  }

  // ======================
  // ENTREGA
  // ======================

  async registrarEntrega(data: {
    numeroOT: string;
    entregadoPor?: string;
    recibidoPor: string;
    kilometraje?: number;
    observaciones?: string;
    conformidad?: boolean;
  }) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: data.numeroOT },
      include: {
        controlCalidad: true,
        entrega: true,
        pagos: true,
      },
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${data.numeroOT} no encontrada`);
    }

    // Validaciones obligatorias
    if (!orden.controlCalidad || !orden.controlCalidad.aprobado) {
      throw new BadRequestException(
        'No se puede entregar: el control de calidad no está aprobado',
      );
    }

    if (orden.saldoPendiente > 0) {
      throw new BadRequestException(
        `No se puede entregar: hay un saldo pendiente de S/ ${orden.saldoPendiente.toFixed(2)}`,
      );
    }

    if (orden.entrega) {
      throw new BadRequestException('Esta orden ya fue entregada');
    }

    // Registrar entrega
    await this.prisma.entrega.create({
      data: {
        ordenId: orden.id,
        entregadoPor: data.entregadoPor,
        recibidoPor: data.recibidoPor,
        kilometraje: data.kilometraje,
        observaciones: data.observaciones,
        conformidad: data.conformidad ?? true,
        hora: new Date().toLocaleTimeString('es-PE', { hour12: false }),
      },
    });

    // Cambiar estado de la OT a ENTREGADO
    await this.prisma.ordenTrabajo.update({
      where: { id: orden.id },
      data: { estado: 'ENTREGADO' },
    });

    return this.obtenerEstadoFinal(data.numeroOT);
  }

  // ======================
  // CONSULTA FINAL
  // ======================

  async obtenerEstadoFinal(numeroOT: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: numeroOT },
      include: {
        vehiculo: {
          include: { cliente: true },
        },
        controlCalidad: true,
        entrega: true,
        pagos: true,
        etapas: {
          orderBy: { secuencia: 'asc' },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${numeroOT} no encontrada`);
    }

    return {
      numero: orden.numero,
      estado: orden.estado,
      placa: orden.vehiculo.placa,
      cliente: orden.vehiculo.cliente.nombre,
      total: orden.total,
      totalPagado: orden.totalPagado,
      saldoPendiente: orden.saldoPendiente,
      controlCalidad: orden.controlCalidad,
      entrega: orden.entrega,
      etapasCompletadas: orden.etapas.filter((e) => e.estado === 'TERMINADO')
        .length,
      totalEtapas: orden.etapas.length,
    };
  }
}
