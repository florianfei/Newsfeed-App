import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'news',
    pathMatch: 'full'
  },
  {
    path: 'news',
    children: [
      {
        path: '',
        loadChildren: () => import('./news/news.module').then( m => m.NewsPageModule),
        canLoad: [AuthGuard]
      },
      {
        path: ':articleId',
        loadChildren: () => import('./news/news-detail/news-detail.module').then(m => m.NewsDetailPageModule),
        canLoad: [AuthGuard]
      },
      {
        path: 'history',
        loadChildren: () => import('./news/history/history.module').then(m => m.HistoryPageModule),
        canLoad: [AuthGuard]
      },
    ]
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then( m => m.AuthPageModule)
  },
  {
    path: 'about',
    loadChildren: () => import('./about/about.module').then( m => m.AboutPageModule),
    canLoad: [AuthGuard]
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then( m => m.UserPageModule),
    canLoad: [AuthGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
