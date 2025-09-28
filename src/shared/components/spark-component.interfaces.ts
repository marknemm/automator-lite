import type { SparkComponent } from './spark-component.js';

export interface SparkUpdatedWatch<C extends SparkComponent = SparkComponent> {
  property: keyof C;
  callback: (oldValue: C[keyof C]) => void;
}
