import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';

@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  // GET /vehiculos/placa/ABC123  ← El más importante
  @Get('placa/:placa')
  findByPlaca(@Param('placa') placa: string) {
    return this.vehiculosService.findByPlaca(placa);
  }
  @Get('historial/:placa')
  historialCompleto(@Param('placa') placa: string) {
    return this.vehiculosService.historialCompleto(placa);
  }
  // POST /vehiculos
  @Post()
  create(@Body() body: any) {
    return this.vehiculosService.create(body);
  }

  // GET /vehiculos (solo para pruebas)
  @Get()
  findAll() {
    return this.vehiculosService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.vehiculosService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiculosService.remove(id);
  }
}
