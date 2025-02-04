import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/start-page/start-page.module').then(m => m.StartPageModule)
  },
  {
    path: 'game',
    loadChildren: () => import('./features/game/game.module').then(m => m.GameModule)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
