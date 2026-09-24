import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // Crear cliente
  // POST /clientes
  @Post()
  create(
    @Body()
    body: {
      nombre: string;
      dniRuc?: string;
      telefono?: string;
      whatsapp?: string;
      correo?: string;
    },
  ) {
    return this.clientesService.create(body);
  }

  // Listar todos
  // GET /clientes
  @Get()
  findAll() {
    return this.clientesService.findAll();
  }

  // Buscar por DNI/RUC
  // GET /clientes/dni/12345678
  @Get('dni/:dniRuc')
  findByDniRuc(@Param('dniRuc') dniRuc: string) {
    return this.clientesService.findByDniRuc(dniRuc);
  }

  // Buscar por teléfono
  // GET /clientes/telefono/999888777
  @Get('telefono/:telefono')
  findByTelefono(@Param('telefono') telefono: string) {
    return this.clientesService.findByTelefono(telefono);
  }

  // Buscar por ID
  // GET /clientes/clxxxxxxxx
  @Get(':nombre')
  findOne(@Param('nombre') nombre: string) {
    return this.clientesService.findOne(nombre);
  }

  // Actualizar
  // PATCH /clientes/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      nombre?: string;
      dniRuc?: string;
      telefono?: string;
      whatsapp?: string;
      correo?: string;
    },
  ) {
    return this.clientesService.update(id, body);
  }

  // Eliminar
  // DELETE /clientes/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientesService.remove(id);
  }
}
