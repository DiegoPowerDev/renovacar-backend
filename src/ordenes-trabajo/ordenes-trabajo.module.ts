import { Module } from '@nestjs/common';
import { OrdenesTrabajoService } from './ordenes-trabajo.service';
import { OrdenesTrabajoController } from './ordenes-trabajo.controller';

@Module({
  controllers: [OrdenesTrabajoController],
  providers: [OrdenesTrabajoService],
})
export class OrdenesTrabajoModule {}
