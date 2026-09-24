import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiculosService {
  constructor(private prisma: PrismaService) {}

  // Buscar por placa (el endpoint más importante del sistema)
  async findByPlaca(placa: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa: placa.toUpperCase().trim() },
      include: {
        cliente: true,
        ordenes: {
          orderBy: { fechaIngreso: 'desc' },
          take: 10, // últimas 10 órdenes
        },
      },
    });

    if (!vehiculo) {
      throw new NotFoundException(`No se encontró vehículo con placa ${placa}`);
    }

    return vehiculo;
  }
  async create(data: {
    placa: string;
    marca: string;
    modelo: string;
    anio?: number;
    color?: string;
    vin?: string;
    // Opción A: cliente existente
    clienteId?: string;
    // Opción B: buscar por DNI/RUC
    dniRuc?: string;
    // Opción C: crear cliente nuevo
    cliente?: {
      nombre: string;
      dniRuc?: string;
      telefono?: string;
      whatsapp?: string;
      correo?: string;
    };
  }) {
    const placa = data.placa.toUpperCase().trim();

    // Validar placa única
    const existePlaca = await this.prisma.vehiculo.findUnique({
      where: { placa },
    });
    if (existePlaca) {
      throw new ConflictException(
        `Ya existe un vehículo con la placa ${placa}`,
      );
    }

    let clienteId: string;

    // ----- 1. Por clienteId directo -----
    if (data.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: data.clienteId },
      });
      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${data.clienteId} no encontrado`,
        );
      }
      clienteId = cliente.id;
    }
    // ----- 2. Por DNI/RUC -----
    else if (data.dniRuc) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { dniRuc: data.dniRuc },
      });
      if (!cliente) {
        throw new NotFoundException(
          `No se encontró cliente con DNI/RUC ${data.dniRuc}`,
        );
      }
      clienteId = cliente.id;
    }
    // ----- 3. Crear cliente nuevo -----
    else if (data.cliente?.nombre) {
      // Si viene dniRuc y ya existe, reutilizar ese cliente
      if (data.cliente.dniRuc) {
        const existente = await this.prisma.cliente.findUnique({
          where: { dniRuc: data.cliente.dniRuc },
        });
        if (existente) {
          clienteId = existente.id;
        } else {
          const nuevo = await this.prisma.cliente.create({
            data: {
              nombre: data.cliente.nombre,
              dniRuc: data.cliente.dniRuc,
              telefono: data.cliente.telefono,
              whatsapp: data.cliente.whatsapp,
              correo: data.cliente.correo,
            },
          });
          clienteId = nuevo.id;
        }
      } else {
        const nuevo = await this.prisma.cliente.create({
          data: {
            nombre: data.cliente.nombre,
            telefono: data.cliente.telefono,
            whatsapp: data.cliente.whatsapp,
            correo: data.cliente.correo,
          },
        });
        clienteId = nuevo.id;
      }
    } else {
      throw new BadRequestException(
        'Debes indicar clienteId, dniRuc o los datos de un cliente nuevo',
      );
    }

    // Crear el vehículo vinculado
    return this.prisma.vehiculo.create({
      data: {
        placa,
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio,
        color: data.color,
        vin: data.vin,
        clienteId,
      },
      include: {
        cliente: true,
      },
    });
  }

  // Listar todos (para pruebas)
  async findAll() {
    return this.prisma.vehiculo.findMany({
      include: { cliente: true },
      orderBy: { creadoEn: 'desc' },
    });
  }

  // Historial completo por placa (la pantalla más importante)
  async historialCompleto(placa: string) {
    const placaNormalizada = placa.toUpperCase().trim();

    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa: placaNormalizada },
      include: {
        cliente: true,
        ordenes: {
          orderBy: { fechaIngreso: 'desc' },
          include: {
            items: true,
            pagos: {
              orderBy: { fecha: 'asc' },
            },
            etapas: {
              orderBy: { secuencia: 'asc' },
            },
            controlCalidad: true,
            entrega: true,
          },
        },
      },
    });

    if (!vehiculo) {
      throw new NotFoundException(`No se encontró vehículo con placa ${placa}`);
    }

    // Armar el historial resumido de OTs
    const historial = vehiculo.ordenes.map((ot) => {
      const servicios =
        ot.items.map((i) => i.nombre).join(', ') || 'Sin servicios';

      return {
        fecha: ot.fechaIngreso,
        numero: ot.numero,
        servicios,
        total: ot.total,
        totalPagado: ot.totalPagado,
        saldoPendiente: ot.saldoPendiente,
        estado: ot.estado,
        estadoCotizacion: ot.estadoCotizacion,
        tieneControlCalidad: !!ot.controlCalidad,
        aprobadoCalidad: ot.controlCalidad?.aprobado ?? false,
        entregado: !!ot.entrega,
        fechaEntrega: ot.entrega?.fecha ?? null,
      };
    });

    // Totales generales del vehículo
    const totalFacturado = vehiculo.ordenes.reduce(
      (acc, ot) => acc + ot.total,
      0,
    );
    const totalCobrado = vehiculo.ordenes.reduce(
      (acc, ot) => acc + ot.totalPagado,
      0,
    );
    const ordenesEntregadas = vehiculo.ordenes.filter(
      (ot) => ot.estado === 'ENTREGADO',
    ).length;
    const ordenesEnProceso = vehiculo.ordenes.filter((ot) =>
      ['EN_PROCESO', 'CONTROL_CALIDAD', 'LISTO'].includes(ot.estado),
    ).length;

    return {
      vehiculo: {
        id: vehiculo.id,
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        color: vehiculo.color,
        vin: vehiculo.vin,
      },
      propietario: {
        id: vehiculo.cliente.id,
        nombre: vehiculo.cliente.nombre,
        dniRuc: vehiculo.cliente.dniRuc,
        telefono: vehiculo.cliente.telefono,
        whatsapp: vehiculo.cliente.whatsapp,
        correo: vehiculo.cliente.correo,
      },
      resumen: {
        totalOrdenes: vehiculo.ordenes.length,
        ordenesEntregadas,
        ordenesEnProceso,
        totalFacturado,
        totalCobrado,
        saldoGeneral: totalFacturado - totalCobrado,
      },
      historial,
      // Detalle completo de cada OT (por si el frontend quiere expandir)
      ordenesDetalle: vehiculo.ordenes,
    };
  }
  async update(
    id: string,
    data: {
      placa?: string;
      marca?: string;
      modelo?: string;
      anio?: number;
      color?: string;
      vin?: string;
    },
  ) {
    const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id } });

    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }

    // Si cambia la placa, validar que no exista otra igual
    if (data.placa) {
      const placa = data.placa.toUpperCase().trim();
      if (placa !== vehiculo.placa) {
        const existe = await this.prisma.vehiculo.findUnique({
          where: { placa },
        });
        if (existe) {
          throw new ConflictException(
            `Ya existe un vehículo con la placa ${placa}`,
          );
        }
        data.placa = placa;
      }
    }

    return this.prisma.vehiculo.update({
      where: { id },
      data: {
        placa: data.placa,
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio,
        color: data.color,
        vin: data.vin,
      },
      include: { cliente: true },
    });
  }

  // Eliminar vehículo (solo si no tiene órdenes)
  async remove(id: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id },
      include: { ordenes: true },
    });

    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }

    if (vehiculo.ordenes.length > 0) {
      throw new ConflictException(
        `No se puede eliminar: el vehículo tiene ${vehiculo.ordenes.length} orden(es) de trabajo asociada(s)`,
      );
    }

    return this.prisma.vehiculo.delete({
      where: { id },
    });
  }
}
