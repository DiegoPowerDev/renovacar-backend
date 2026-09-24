import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { OrdenesTrabajoService } from './ordenes-trabajo.service';

@Controller('ordenes-trabajo')
export class OrdenesTrabajoController {
  constructor(private readonly ordenesService: OrdenesTrabajoService) {}

  // Crear OT desde una placa
  // POST /ordenes-trabajo
  @Post()
  crear(
    @Body()
    body: {
      placa: string;
      fechaPrometida?: string;
      observaciones?: string;
      kilometraje?: number;
      nivelCombustible?: string;
    },
  ) {
    return this.ordenesService.crearDesdePlaca(body);
  }

  // Buscar OT por número
  // GET /ordenes-trabajo/OT-2026-000001
  @Get(':numero')
  findByNumero(@Param('numero') numero: string) {
    return this.ordenesService.findByNumero(numero);
  }

  // Historial de una placa
  // GET /ordenes-trabajo/placa/ABC123
  @Get('placa/:placa')
  findByPlaca(@Param('placa') placa: string) {
    return this.ordenesService.findByPlaca(placa);
  }

  // Cambiar estado
  // PATCH /ordenes-trabajo/OT-2026-000001/estado
  @Patch(':numero/estado')
  cambiarEstado(
    @Param('numero') numero: string,
    @Body('estado') estado: string,
  ) {
    return this.ordenesService.cambiarEstado(numero, estado);
  }

  // Listar todas (solo pruebas)
  @Get()
  findAll() {
    return this.ordenesService.findAll();
  }
}
