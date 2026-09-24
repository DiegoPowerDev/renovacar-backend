import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CotizacionesService {
  constructor(private prisma: PrismaService) {}

  // Recalcular totales de una OT
  private async recalcularTotales(ordenId: string) {
    const items = await this.prisma.itemCotizacion.findMany({
      where: { ordenId },
    });

    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const descuentoTotal = items.reduce((acc, item) => acc + item.descuento, 0);
    const total = subtotal; // ya viene con descuento aplicado por ítem

    return this.prisma.ordenTrabajo.update({
      where: { id: ordenId },
      data: {
        subtotal,
        descuentoTotal,
        total,
      },
    });
  }

  // Agregar un servicio a una OT
  async agregarItem(data: {
    numeroOT: string;
    nombre: string;
    descripcion?: string;
    cantidad?: number;
    precioUnitario: number;
    descuento?: number;
    servicioCatalogoId?: string;
  }) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: data.numeroOT },
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${data.numeroOT} no encontrada`);
    }

    if (orden.estadoCotizacion === 'ACEPTADA') {
      throw new BadRequestException(
        'No se puede modificar una cotización ya aceptada',
      );
    }

    const cantidad = data.cantidad ?? 1;
    const descuento = data.descuento ?? 0;
    const subtotal = cantidad * data.precioUnitario - descuento;

    if (subtotal < 0) {
      throw new BadRequestException('El subtotal no puede ser negativo');
    }

    const item = await this.prisma.itemCotizacion.create({
      data: {
        ordenId: orden.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        cantidad,
        precioUnitario: data.precioUnitario,
        descuento,
        subtotal,
        servicioCatalogoId: data.servicioCatalogoId,
      },
    });

    await this.recalcularTotales(orden.id);

    return this.obtenerCotizacion(data.numeroOT);
  }

  // Obtener la cotización completa de una OT
  async obtenerCotizacion(numeroOT: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: numeroOT },
      include: {
        items: {
          orderBy: { creadoEn: 'asc' },
        },
        vehiculo: {
          include: { cliente: true },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${numeroOT} no encontrada`);
    }

    return orden;
  }

  // Eliminar un ítem de la cotización
  async eliminarItem(itemId: string) {
    const item = await this.prisma.itemCotizacion.findUnique({
      where: { id: itemId },
      include: { orden: true },
    });

    if (!item) {
      throw new NotFoundException('Ítem no encontrado');
    }

    if (item.orden.estadoCotizacion === 'ACEPTADA') {
      throw new BadRequestException(
        'No se puede modificar una cotización ya aceptada',
      );
    }

    await this.prisma.itemCotizacion.delete({ where: { id: itemId } });
    await this.recalcularTotales(item.ordenId);

    return this.obtenerCotizacion(item.orden.numero);
  }

  // Cambiar estado de la cotización
  async cambiarEstadoCotizacion(numeroOT: string, nuevoEstado: string) {
    const estadosValidos = ['BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA'];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new BadRequestException(`Estado inválido: ${nuevoEstado}`);
    }

    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { numero: numeroOT },
    });

    if (!orden) {
      throw new NotFoundException(`Orden ${numeroOT} no encontrada`);
    }

    // Lógica de negocio según el estado
    let nuevoEstadoOT = orden.estado;

    if (nuevoEstado === 'ACEPTADA') {
      nuevoEstadoOT = 'EN_PROCESO';
    }

    if (nuevoEstado === 'RECHAZADA') {
      nuevoEstadoOT = 'CANCELADA';
    }

    return this.prisma.ordenTrabajo.update({
      where: { numero: numeroOT },
      data: {
        estadoCotizacion: nuevoEstado,
        estado: nuevoEstadoOT,
      },
      include: {
        items: true,
        vehiculo: {
          include: { cliente: true },
        },
      },
    });
  }

  // Listar servicios del catálogo
  async listarCatalogo(incluirInactivos = false) {
    return this.prisma.servicioCatalogo.findMany({
      where: incluirInactivos ? undefined : { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async obtenerServicioCatalogo(id: string) {
    const servicio = await this.prisma.servicioCatalogo.findUnique({
      where: { id },
    });

    if (!servicio) {
      throw new NotFoundException(`Servicio de catálogo ${id} no encontrado`);
    }

    return servicio;
  }

  async crearServicioCatalogo(data: {
    nombre: string;
    descripcion?: string;
    precioBase: number;
  }) {
    if (!data.nombre?.trim()) {
      throw new BadRequestException('El nombre es obligatorio');
    }

    if (data.precioBase == null || data.precioBase < 0) {
      throw new BadRequestException('El precio base debe ser 0 o mayor');
    }

    return this.prisma.servicioCatalogo.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        precioBase: data.precioBase,
      },
    });
  }

  async actualizarServicioCatalogo(
    id: string,
    data: {
      nombre?: string;
      descripcion?: string;
      precioBase?: number;
      activo?: boolean;
    },
  ) {
    const servicio = await this.prisma.servicioCatalogo.findUnique({
      where: { id },
    });

    if (!servicio) {
      throw new NotFoundException(`Servicio de catálogo ${id} no encontrado`);
    }

    if (data.nombre !== undefined && !data.nombre.trim()) {
      throw new BadRequestException('El nombre no puede estar vacío');
    }

    if (data.precioBase !== undefined && data.precioBase < 0) {
      throw new BadRequestException('El precio base debe ser 0 o mayor');
    }

    return this.prisma.servicioCatalogo.update({
      where: { id },
      data: {
        nombre: data.nombre?.trim(),
        descripcion:
          data.descripcion !== undefined
            ? data.descripcion.trim() || null
            : undefined,
        precioBase: data.precioBase,
        activo: data.activo,
      },
    });
  }

  async eliminarServicioCatalogo(id: string, hard = false) {
    const servicio = await this.prisma.servicioCatalogo.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!servicio) {
      throw new NotFoundException(`Servicio de catálogo ${id} no encontrado`);
    }

    // Si ya se usó en cotizaciones, solo desactivar
    if (servicio.items.length > 0 || !hard) {
      return this.prisma.servicioCatalogo.update({
        where: { id },
        data: { activo: false },
      });
    }

    return this.prisma.servicioCatalogo.delete({
      where: { id },
    });
  }
}
