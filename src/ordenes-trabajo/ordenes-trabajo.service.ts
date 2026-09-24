import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdenesTrabajoService {
  constructor(private prisma: PrismaService) {}

  // Generar número de OT automático: OT-2026-000001
  private async generarNumeroOT(): Promise<string> {
    const anio = new Date().getFullYear();
    const prefijo = `OT-${anio}-`;

    const ultimaOT = await this.prisma.ordenTrabajo.findFirst({
      where: {
        numero: {
          startsWith: prefijo,
        },
      },
      orderBy: {
        numero: 'desc',
      },
    });

    let siguiente = 1;

    if (ultimaOT) {
      const partes = ultimaOT.numero.split('-');
      const ultimoNumero = parseInt(partes[2], 10);
      siguiente = ultimoNumero + 1;
    }

    return `${prefijo}${siguiente.toString().padStart(6, '0')}`;
  }

  // Crear una nueva OT a partir de una placa
  async crearDesdePlaca(data: {
    placa: string;
    fechaPrometida?: string;
    observaciones?: string;
    kilometraje?: number;
    nivelCombustible?: string;
  }) {
    const placa = data.placa.toUpperCase().trim();

    // 1. Buscar el vehículo
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa },
      include: { cliente: true },
    });

    if (!vehiculo) {
      throw new NotFoundException(
        `No existe un vehículo con la placa ${placa}`,
      );
    }

    // 2. Generar número de OT
    const numero = await this.generarNumeroOT();

    // 3. Crear la OT
    const orden = await this.prisma.ordenTrabajo.create({
      data: {
        numero,
        vehiculoId: vehiculo.id,
        fechaPrometida: data.fechaPrometida
          ? new Date(data.fechaPrometida)
          : null,
        observaciones: data.observaciones,
        kilometraje: data.kilometraje,
        nivelCombustible: data.nivelCombustible,
        estado: 'BORRADOR',
      },
      include: {
        vehiculo: {
          include: {
            cliente: true,
          },
        },
      },
    });

    return orden;
  }

  // Buscar OT por número
  async findByNumero(numero: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero },
      include: {
        vehiculo: {
          include: {
            cliente: true,
          },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException(`No se encontró la orden ${numero}`);
    }

    return orden;
  }

  // Listar todas las OTs de una placa (historial)
  async findByPlaca(placa: string) {
    const placaNormalizada = placa.toUpperCase().trim();

    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa: placaNormalizada },
    });

    if (!vehiculo) {
      throw new NotFoundException(`No existe vehículo con placa ${placa}`);
    }

    return this.prisma.ordenTrabajo.findMany({
      where: { vehiculoId: vehiculo.id },
      orderBy: { fechaIngreso: 'desc' },
      include: {
        vehiculo: {
          include: { cliente: true },
        },
      },
    });
  }

  // Cambiar estado de una OT
  async cambiarEstado(numero: string, nuevoEstado: string) {
    const estadosValidos = [
      'BORRADOR',
      'COTIZADA',
      'EN_PROCESO',
      'CONTROL_CALIDAD',
      'LISTO',
      'ENTREGADO',
      'CANCELADA',
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new BadRequestException(`Estado inválido: ${nuevoEstado}`);
    }

    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero },
    });

    if (!orden) {
      throw new NotFoundException(`No se encontró la orden ${numero}`);
    }

    return this.prisma.ordenTrabajo.update({
      where: { numero },
      data: { estado: nuevoEstado },
      include: {
        vehiculo: {
          include: { cliente: true },
        },
      },
    });
  }

  // Listar todas (para pruebas / dashboard)
  async findAll() {
    return this.prisma.ordenTrabajo.findMany({
      orderBy: { fechaIngreso: 'desc' },
      include: {
        vehiculo: {
          include: { cliente: true },
        },
      },
    });
  }
}
