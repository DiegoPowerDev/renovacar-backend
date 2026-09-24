import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { ProduccionService } from './produccion.service';

@Controller('produccion')
export class ProduccionController {
  constructor(private readonly produccionService: ProduccionService) {}

  // Generar etapas para una OT
  // POST /produccion/generar
  @Post('generar')
  generar(@Body() body: { numeroOT: string; tipo?: string }) {
    return this.produccionService.generarEtapas(body.numeroOT, body.tipo);
  }

  // Ver etapas de una OT
  // GET /produccion/OT-2026-000001
  @Get(':numeroOT')
  obtener(@Param('numeroOT') numeroOT: string) {
    return this.produccionService.obtenerEtapas(numeroOT);
  }

  // Iniciar etapa
  // PATCH /produccion/etapa/:id/iniciar
  @Patch('etapa/:id/iniciar')
  iniciar(@Param('id') id: string, @Body('responsable') responsable?: string) {
    return this.produccionService.iniciarEtapa(id, responsable);
  }

  // Pausar etapa
  // PATCH /produccion/etapa/:id/pausar
  @Patch('etapa/:id/pausar')
  pausar(
    @Param('id') id: string,
    @Body('observaciones') observaciones?: string,
  ) {
    return this.produccionService.pausarEtapa(id, observaciones);
  }

  // Terminar etapa
  // PATCH /produccion/etapa/:id/terminar
  @Patch('etapa/:id/terminar')
  terminar(
    @Param('id') id: string,
    @Body('observaciones') observaciones?: string,
  ) {
    return this.produccionService.terminarEtapa(id, observaciones);
  }

  // Asignar responsable
  // PATCH /produccion/etapa/:id/responsable
  @Patch('etapa/:id/responsable')
  asignar(@Param('id') id: string, @Body('responsable') responsable: string) {
    return this.produccionService.asignarResponsable(id, responsable);
  }

  // Dashboard de producción
  // GET /produccion/dashboard/resumen
  @Get('dashboard/resumen')
  dashboard() {
    return this.produccionService.dashboardProduccion();
  }
}
