import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { CreateHealthCheckDto } from './dto/create-health-check.dto';
import { UpdateHealthCheckDto } from './dto/update-health-check.dto';

@Controller('health-check')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Post()
  create(@Body() createHealthCheckDto: CreateHealthCheckDto) {
    return this.healthCheckService.create(createHealthCheckDto);
  }

  @Get()
  findAll() {
    return this.healthCheckService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.healthCheckService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHealthCheckDto: UpdateHealthCheckDto) {
    return this.healthCheckService.update(+id, updateHealthCheckDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.healthCheckService.remove(+id);
  }
}
