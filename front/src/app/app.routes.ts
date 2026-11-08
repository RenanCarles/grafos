import type { Routes } from '@angular/router';
import { Shell } from './core/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'visoes' },
      {
        path: 'visoes',
        loadChildren: () => import('./features/visoes/visoes.routes').then((m) => m.VISOES_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'visoes' },
];
