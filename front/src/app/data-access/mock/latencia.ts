import { InjectionToken } from '@angular/core';
import { delay, type MonoTypeOperatorFunction } from 'rxjs';

export interface FaixaLatencia {
  min: number;
  max: number;
}

export const LATENCIA_MOCK = new InjectionToken<FaixaLatencia>('LATENCIA_MOCK', {
  providedIn: 'root',
  factory: () => ({ min: 300, max: 600 }),
});

export function comLatencia<T>(faixa: FaixaLatencia): MonoTypeOperatorFunction<T> {
  return delay(faixa.min + Math.random() * (faixa.max - faixa.min));
}
