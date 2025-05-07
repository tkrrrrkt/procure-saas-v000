// src/common/decorators/privileged-operation.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * 特権操作を示すメタデータキー
 */
export const PRIVILEGED_OPERATION_KEY = 'privileged_operation';

/**
 * 特権操作としてマークするデコレーター
 * @param description 特権操作の説明
 */
export const PrivilegedOperation = (description: string = '') => 
  SetMetadata(PRIVILEGED_OPERATION_KEY, { description });