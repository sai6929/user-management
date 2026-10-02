import { createLogger } from '@user-management/shared';
import { env } from '@/config/env';

export const logger = createLogger({ level: env.logLevel });
