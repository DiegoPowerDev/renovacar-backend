import { Module } from '@nestjs/common';
import { CalidadEntregaService } from './calidad-entrega.service';
import { CalidadEntregaController } from './calidad-entrega.controller';

@Module({
  controllers: [CalidadEntregaController],
  providers: [CalidadEntregaService],
})
export class CalidadEntregaModule {}
