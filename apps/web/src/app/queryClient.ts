import { createQueryClient } from '@user-management/api';
import { logger } from '@/services/logger';

export const queryClient = createQueryClient({ logger });
