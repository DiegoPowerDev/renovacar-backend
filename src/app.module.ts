import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { OrdenesTrabajoModule } from './ordenes-trabajo/ordenes-trabajo.module';
import { ClientesModule } from './clientes/clientes.module';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { PagosModule } from './pagos/pagos.module';
import { ProduccionModule } from './produccion/produccion.module';
import { CalidadEntregaModule } from './calidad-entrega/calidad-entrega.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    VehiculosModule,
    OrdenesTrabajoModule,
    ClientesModule,
    CotizacionesModule,
    PagosModule,
    ProduccionModule,
    CalidadEntregaModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
