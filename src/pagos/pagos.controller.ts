import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // Registrar un pago
  // POST /pagos
  @Post()
  registrar(
    @Body()
    body: {
      numeroOT: string;
      monto: number;
      metodo: string;
      comprobante?: string;
      observaciones?: string;
      fecha?: string;
      registradoPor?: string;
    },
  ) {
    return this.pagosService.registrarPago(body);
  }

  // Resumen de pagos de una OT
  // GET /pagos/OT-2026-000001
  @Get(':numeroOT')
  resumen(@Param('numeroOT') numeroOT: string) {
    return this.pagosService.obtenerResumenPagos(numeroOT);
  }

  // Eliminar un pago
  // DELETE /pagos/item/:pagoId
  @Delete('item/:pagoId')
  eliminar(@Param('pagoId') pagoId: string) {
    return this.pagosService.eliminarPago(pagoId);
  }

  // Listar todos los pagos (reportes)
  // GET /pagos
  @Get()
  findAll() {
    return this.pagosService.findAll();
  }
}
