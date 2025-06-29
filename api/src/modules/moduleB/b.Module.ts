import { bullMqRunner } from '@/shared/utils/helpers/bullMq';
import { moduleBActionEventListener, moduleBCompensateEventListener } from './apps/features/v1/add';

export const bModules: Function[] = [];
bullMqRunner.registerWorker(moduleBActionEventListener);
bullMqRunner.registerWorker(moduleBCompensateEventListener);
