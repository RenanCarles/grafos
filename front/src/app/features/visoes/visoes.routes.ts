import type { Routes } from '@angular/router';

export const VISOES_ROUTES: Routes = [
  {
    path: '',
    title: 'Visões',
    loadComponent: () => import('./pages/visoes-lista/visoes-lista').then((m) => m.VisoesLista),
  },
  {
    path: 'nova',
    title: 'Nova visão',
    loadComponent: () => import('./pages/visao-editor/visao-editor').then((m) => m.VisaoEditor),
  },
  {
    path: ':id/editar',
    title: 'Editar visão',
    loadComponent: () => import('./pages/visao-editor/visao-editor').then((m) => m.VisaoEditor),
  },
  {
    path: ':id',
    title: 'Visualizar visão',
    loadComponent: () =>
      import('../visualizador/pages/visualizador/visualizador').then((m) => m.Visualizador),
  },
];
