import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CalidadEntregaService } from './calidad-entrega.service';

@Controller('calidad-entrega')
export class CalidadEntregaController {
  constructor(private readonly service: CalidadEntregaService) {}

  // Registrar Control de Calidad
  // POST /calidad-entrega/control
  @Post('control')
  controlCalidad(
    @Body()
    body: {
      numeroOT: string;
      aprobado: boolean;
      observaciones?: string;
      inspector?: string;
    },
  ) {
    return this.service.registrarControlCalidad(body);
  }

  // Registrar Entrega
  // POST /calidad-entrega/entrega
  @Post('entrega')
  entrega(
    @Body()
    body: {
      numeroOT: string;
      entregadoPor?: string;
      recibidoPor: string;
      kilometraje?: number;
      observaciones?: string;
      conformidad?: boolean;
    },
  ) {
    return this.service.registrarEntrega(body);
  }

  // Ver estado final de una OT
  // GET /calidad-entrega/OT-2026-000001
  @Get(':numeroOT')
  estadoFinal(@Param('numeroOT') numeroOT: string) {
    return this.service.obtenerEstadoFinal(numeroOT);
  }
}
