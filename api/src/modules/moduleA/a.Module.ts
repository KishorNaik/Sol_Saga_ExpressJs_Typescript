import { bullMqRunner } from '@/shared/utils/helpers/bullMq';
import { moduleAActionEventListener, moduleACompensateEventListener } from './apps/features/v1/add';

export const aModules: Function[] = [];
bullMqRunner.registerWorker(moduleAActionEventListener);
bullMqRunner.registerWorker(moduleACompensateEventListener);
