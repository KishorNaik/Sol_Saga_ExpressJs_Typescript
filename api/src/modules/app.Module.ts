import { aModules } from './moduleA/a.Module';
import { bModules } from './moduleB/b.Module';
import { cModules } from './moduleC/c.Module';

export const modulesFederation: Function[] = [...aModules, ...bModules, ...cModules];
