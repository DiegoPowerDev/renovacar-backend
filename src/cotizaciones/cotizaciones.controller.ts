import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { CotizacionesService } from './cotizaciones.service';

@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  // ======================
  // CATÁLOGO (rutas fijas primero)
  // ======================

  @Get('catalogo/servicios')
  listarCatalogo(@Query('todos') todos?: string) {
    return this.cotizacionesService.listarCatalogo(todos === 'true');
  }

  @Get('catalogo/servicios/:id')
  obtenerCatalogo(@Param('id') id: string) {
    return this.cotizacionesService.obtenerServicioCatalogo(id);
  }

  @Post('catalogo/servicios')
  crearCatalogo(
    @Body()
    body: {
      nombre: string;
      descripcion?: string;
      precioBase: number;
    },
  ) {
    return this.cotizacionesService.crearServicioCatalogo(body);
  }

  @Patch('catalogo/servicios/:id')
  actualizarCatalogo(
    @Param('id') id: string,
    @Body()
    body: {
      nombre?: string;
      descripcion?: string;
      precioBase?: number;
      activo?: boolean;
    },
  ) {
    return this.cotizacionesService.actualizarServicioCatalogo(id, body);
  }

  @Delete('catalogo/servicios/:id')
  eliminarCatalogo(@Param('id') id: string) {
    return this.cotizacionesService.eliminarServicioCatalogo(id);
  }

  // ======================
  // ITEMS DE COTIZACIÓN
  // ======================

  @Post('items')
  agregarItem(
    @Body()
    body: {
      numeroOT: string;
      nombre: string;
      descripcion?: string;
      cantidad?: number;
      precioUnitario: number;
      descuento?: number;
      servicioCatalogoId?: string;
    },
  ) {
    return this.cotizacionesService.agregarItem(body);
  }

  @Delete('items/:itemId')
  eliminarItem(@Param('itemId') itemId: string) {
    return this.cotizacionesService.eliminarItem(itemId);
  }

  // ======================
  // COTIZACIÓN POR OT (dinámicas al final)
  // ======================

  @Get(':numeroOT')
  obtener(@Param('numeroOT') numeroOT: string) {
    return this.cotizacionesService.obtenerCotizacion(numeroOT);
  }

  @Patch(':numeroOT/estado')
  cambiarEstado(
    @Param('numeroOT') numeroOT: string,
    @Body('estado') estado: string,
  ) {
    return this.cotizacionesService.cambiarEstadoCotizacion(numeroOT, estado);
  }
}
