import { InjectionToken } from '@angular/core';
import cytoscape, { type Core, type CytoscapeOptions } from 'cytoscape';

export type FabricaCytoscape = (opcoes: CytoscapeOptions) => Core;

export const FABRICA_CYTOSCAPE = new InjectionToken<FabricaCytoscape>('FABRICA_CYTOSCAPE', {
  providedIn: 'root',
  factory: () => (opcoes) => cytoscape(opcoes),
});
