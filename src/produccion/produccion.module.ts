import { Module } from '@nestjs/common';
import { ProduccionService } from './produccion.service';
import { ProduccionController } from './produccion.controller';

@Module({
  controllers: [ProduccionController],
  providers: [ProduccionService],
})
export class ProduccionModule {}
