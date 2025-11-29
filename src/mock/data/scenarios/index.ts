import { ScenarioTimeline } from '../types';
import { scenario1 } from './dbOverload';
import { scenario2 } from './storageFull';
import { scenario3 } from './cacheFailure';
import { scenario4 } from './networkBottleneck';

export const SCENARIO_TIMELINES: ScenarioTimeline[] = [
  scenario1,
  scenario2,
  scenario3,
  scenario4,
];

export { scenario1, scenario2, scenario3, scenario4 };
