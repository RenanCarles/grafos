import type { Resource } from '@angular/core';

/** Lê o valor de um resource sem lançar quando ele está em erro. */
export function valorDe<T>(recurso: Resource<T | undefined>): T | undefined {
  return recurso.hasValue() ? recurso.value() : undefined;
}
