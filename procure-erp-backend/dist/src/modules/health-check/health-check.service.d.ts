import { CreateHealthCheckDto } from './dto/create-health-check.dto';
import { UpdateHealthCheckDto } from './dto/update-health-check.dto';
export declare class HealthCheckService {
    create(createHealthCheckDto: CreateHealthCheckDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateHealthCheckDto: UpdateHealthCheckDto): string;
    remove(id: number): string;
}
