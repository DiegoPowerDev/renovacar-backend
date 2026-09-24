import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // Dashboard completo con filtros
  // GET /stats?desde=2026-01-01&hasta=2026-09-23&estado=EN_PROCESO&placa=ABC
  @Get()
  getDashboard(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('estado') estado?: string,
    @Query('placa') placa?: string,
    @Query('clienteId') clienteId?: string,
  ) {
    return this.statsService.getDashboard({
      desde,
      hasta,
      estado,
      placa,
      clienteId,
    });
  }

  // Resumen rápido para las cards del home
  // GET /stats/resumen
  @Get('resumen')
  getResumen() {
    return this.statsService.getResumenRapido();
  }
}
