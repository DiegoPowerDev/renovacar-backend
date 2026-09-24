import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  // Crear cliente
  async create(data: {
    nombre: string;
    dniRuc?: string;
    telefono?: string;
    whatsapp?: string;
    correo?: string;
  }) {
    // Validar si el DNI/RUC ya existe
    if (data.dniRuc) {
      const existe = await this.prisma.cliente.findUnique({
        where: { dniRuc: data.dniRuc },
      });

      if (existe) {
        throw new ConflictException(
          `Ya existe un cliente con DNI/RUC ${data.dniRuc}`,
        );
      }
    }

    return this.prisma.cliente.create({
      data: {
        nombre: data.nombre,
        dniRuc: data.dniRuc,
        telefono: data.telefono,
        whatsapp: data.whatsapp,
        correo: data.correo,
      },
    });
  }

  // Buscar por ID
  async findOne(nombre: string) {
    const cliente = await this.prisma.cliente.findMany({
      where: { nombre },
      include: {
        vehiculos: {
          include: {
            ordenes: {
              orderBy: { fechaIngreso: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`No se encontraron clientes con ese nombre`);
    }

    return cliente;
  }

  // Buscar por DNI/RUC
  async findByDniRuc(dniRuc: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { dniRuc },
      include: {
        vehiculos: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException(
        `No se encontró cliente con DNI/RUC ${dniRuc}`,
      );
    }

    return cliente;
  }

  // Buscar por teléfono o WhatsApp
  async findByTelefono(telefono: string) {
    return this.prisma.cliente.findMany({
      where: {
        OR: [
          { telefono: { contains: telefono } },
          { whatsapp: { contains: telefono } },
        ],
      },
      include: {
        vehiculos: true,
      },
    });
  }

  // Listar todos
  async findAll() {
    const data = await this.prisma.cliente.findMany({
      orderBy: { creadoEn: 'desc' },
    });
    return data;
  }

  // Actualizar cliente
  async update(
    id: string,
    data: {
      nombre?: string;
      dniRuc?: string;
      telefono?: string;
      whatsapp?: string;
      correo?: string;
    },
  ) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    // Validar DNI/RUC único si se está cambiando
    if (data.dniRuc && data.dniRuc !== cliente.dniRuc) {
      const existe = await this.prisma.cliente.findUnique({
        where: { dniRuc: data.dniRuc },
      });

      if (existe) {
        throw new ConflictException(
          `Ya existe un cliente con DNI/RUC ${data.dniRuc}`,
        );
      }
    }

    return this.prisma.cliente.update({
      where: { id },
      data,
      include: {
        vehiculos: true,
      },
    });
  }

  // Eliminar cliente (solo si no tiene vehículos)
  async remove(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: { vehiculos: true },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    if (cliente.vehiculos.length > 0) {
      throw new ConflictException(
        `No se puede eliminar el cliente porque tiene ${cliente.vehiculos.length} vehículo(s) asociado(s)`,
      );
    }

    return this.prisma.cliente.delete({
      where: { id },
    });
  }
}
