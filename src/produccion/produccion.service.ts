import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProduccionService {
  constructor(private prisma: PrismaService) {}

  // Plantillas de etapas según el tipo de trabajo
  private readonly plantillas: Record<string, string[]> = {
    PINTURA: [
      'RECEPCIÓN',
      'DESARMADO',
      'PLANCHADO',
      'PREPARACIÓN',
      'PINTURA',
      'SECADO',
      'ARMADO',
      'PULIDO',
      'CONTROL DE CALIDAD',
      'LISTO PARA ENTREGA',
    ],
    DETAILING: [
      'RECEPCIÓN',
      'LAVADO',
      'DESCONTAMINACIÓN',
      'PULIDO',
      'PROTECCIÓN',
      'CONTROL DE CALIDAD',
      'LISTO PARA ENTREGA',
    ],
    GENERAL: [
      'RECEPCIÓN',
      'DIAGNÓSTICO',
      'REPARACIÓN',
      'CONTROL DE CALIDAD',
      'LISTO PARA ENTREGA',
    ],
  };

  // Crear las etapas de una OT según una plantilla
  async generarEtapas(numeroOT: string, tipo: string = 'GENERAL') {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: numeroOT },
      include: { etapas: true },
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${numeroOT} no encontrada`);
    }

    if (orden.etapas.length > 0) {
      throw new BadRequestException('Esta orden ya tiene etapas generadas');
    }

    const plantilla =
      this.plantillas[tipo.toUpperCase()] || this.plantillas.GENERAL;

    const etapasData = plantilla.map((nombre, index) => ({
      ordenId: orden.id,
      nombre,
      secuencia: index + 1,
      estado: 'PENDIENTE',
    }));

    await this.prisma.etapaProduccion.createMany({
      data: etapasData,
    });

    // Cambiar estado de la OT a EN_PROCESO si aún está en BORRADOR o COTIZADA
    if (['BORRADOR', 'COTIZADA'].includes(orden.estado)) {
      await this.prisma.ordenTrabajo.update({
        where: { id: orden.id },
        data: { estado: 'EN_PROCESO' },
      });
    }

    return this.obtenerEtapas(numeroOT);
  }

  // Obtener todas las etapas de una OT
  async obtenerEtapas(numeroOT: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: numeroOT },
      include: {
        etapas: {
          orderBy: { secuencia: 'asc' },
        },
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

    if (!orden) {
      throw new NotFoundException(`Orden ${numeroOT} no encontrada`);
    }

    return {
      numero: orden.numero,
      placa: orden.vehiculo.placa,
      cliente: orden.vehiculo.cliente.nombre,
      estadoOT: orden.estado,
      etapas: orden.etapas,
    };
  }

  // Iniciar una etapa
  async iniciarEtapa(etapaId: string, responsable?: string) {
    const etapa = await this.prisma.etapaProduccion.findUnique({
      where: { id: etapaId },
    });

    if (!etapa) {
      throw new NotFoundException('Etapa no encontrada');
    }

    if (etapa.estado === 'TERMINADO') {
      throw new BadRequestException('Esta etapa ya está terminada');
    }

    return this.prisma.etapaProduccion.update({
      where: { id: etapaId },
      data: {
        estado: 'EN_PROCESO',
        fechaInicio: etapa.fechaInicio || new Date(),
        responsable: responsable || etapa.responsable,
      },
    });
  }

  // Pausar una etapa
  async pausarEtapa(etapaId: string, observaciones?: string) {
    const etapa = await this.prisma.etapaProduccion.findUnique({
      where: { id: etapaId },
    });

    if (!etapa) {
      throw new NotFoundException('Etapa no encontrada');
    }

    if (etapa.estado !== 'EN_PROCESO') {
      throw new BadRequestException(
        'Solo se puede pausar una etapa en proceso',
      );
    }

    return this.prisma.etapaProduccion.update({
      where: { id: etapaId },
      data: {
        estado: 'PAUSADO',
        observaciones: observaciones || etapa.observaciones,
      },
    });
  }

  // Terminar una etapa
  async terminarEtapa(etapaId: string, observaciones?: string) {
    const etapa = await this.prisma.etapaProduccion.findUnique({
      where: { id: etapaId },
      include: { orden: true },
    });

    if (!etapa) {
      throw new NotFoundException('Etapa no encontrada');
    }

    if (etapa.estado === 'TERMINADO') {
      throw new BadRequestException('Esta etapa ya está terminada');
    }

    const etapaActualizada = await this.prisma.etapaProduccion.update({
      where: { id: etapaId },
      data: {
        estado: 'TERMINADO',
        fechaFin: new Date(),
        observaciones: observaciones || etapa.observaciones,
      },
    });

    // Verificar si todas las etapas están terminadas
    const etapasPendientes = await this.prisma.etapaProduccion.count({
      where: {
        ordenId: etapa.ordenId,
        estado: { not: 'TERMINADO' },
      },
    });

    if (etapasPendientes === 0) {
      await this.prisma.ordenTrabajo.update({
        where: { id: etapa.ordenId },
        data: { estado: 'CONTROL_CALIDAD' },
      });
    }

    return etapaActualizada;
  }

  // Asignar responsable a una etapa
  async asignarResponsable(etapaId: string, responsable: string) {
    const etapa = await this.prisma.etapaProduccion.findUnique({
      where: { id: etapaId },
    });

    if (!etapa) {
      throw new NotFoundException('Etapa no encontrada');
    }

    return this.prisma.etapaProduccion.update({
      where: { id: etapaId },
      data: { responsable },
    });
  }

  // Dashboard simple: vehículos por etapa
  async dashboardProduccion() {
    const etapas = await this.prisma.etapaProduccion.findMany({
      where: {
        estado: { in: ['EN_PROCESO', 'PAUSADO', 'PENDIENTE'] },
      },
      include: {
        orden: {
          select: {
            numero: true,
            vehiculo: {
              select: {
                placa: true,
                marca: true,
                modelo: true,
              },
            },
          },
        },
      },
      orderBy: { secuencia: 'asc' },
    });

    // Agrupar por nombre de etapa
    const resumen: Record<string, any[]> = {};

    for (const etapa of etapas) {
      if (!resumen[etapa.nombre]) {
        resumen[etapa.nombre] = [];
      }
      resumen[etapa.nombre].push({
        etapaId: etapa.id,
        estado: etapa.estado,
        responsable: etapa.responsable,
        ot: etapa.orden.numero,
        placa: etapa.orden.vehiculo.placa,
        vehiculo: `${etapa.orden.vehiculo.marca} ${etapa.orden.vehiculo.modelo}`,
      });
    }

    return resumen;
  }
}
