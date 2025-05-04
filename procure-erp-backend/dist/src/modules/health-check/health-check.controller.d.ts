import { HealthCheckService } from './health-check.service';
import { CreateHealthCheckDto } from './dto/create-health-check.dto';
import { UpdateHealthCheckDto } from './dto/update-health-check.dto';
export declare class HealthCheckController {
    private readonly healthCheckService;
    constructor(healthCheckService: HealthCheckService);
    create(createHealthCheckDto: CreateHealthCheckDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateHealthCheckDto: UpdateHealthCheckDto): string;
    remove(id: string): string;
}
