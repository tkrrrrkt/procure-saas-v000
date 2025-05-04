"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHealthCheckDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_health_check_dto_1 = require("./create-health-check.dto");
class UpdateHealthCheckDto extends (0, mapped_types_1.PartialType)(create_health_check_dto_1.CreateHealthCheckDto) {
}
exports.UpdateHealthCheckDto = UpdateHealthCheckDto;
//# sourceMappingURL=update-health-check.dto.js.map