import { Injectable } from '@nestjs/common';
import { CreateHealthCheckDto } from './dto/create-health-check.dto';
import { UpdateHealthCheckDto } from './dto/update-health-check.dto';

@Injectable()
export class HealthCheckService {
  create(createHealthCheckDto: CreateHealthCheckDto) {
    return 'This action adds a new healthCheck';
  }

  findAll() {
    return `This action returns all healthCheck`;
  }

  findOne(id: number) {
    return `This action returns a #${id} healthCheck`;
  }

  update(id: number, updateHealthCheckDto: UpdateHealthCheckDto) {
    return `This action updates a #${id} healthCheck`;
  }

  remove(id: number) {
    return `This action removes a #${id} healthCheck`;
  }
}
