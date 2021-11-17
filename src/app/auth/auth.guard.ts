import { Injectable } from '@angular/core';
import {
  CanLoad,
  UrlTree,
  UrlSegment,
  Router,
  Route
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { DataService } from '../services/data.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanLoad {

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router) {}

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ):
    Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
      return this.authService.userIsAuthenticated.pipe(
        take(1),
        switchMap(isAuthenticated => {
          if (!isAuthenticated) {
            return this.authService.autoAuthenticate();
          } else {
            return of(isAuthenticated);
          }
        }),
        switchMap(isAuthenticated => {
          if (isAuthenticated) {
            return this.authService.requestSessionId().pipe(
              map(res => !!res));
          } else {
            return of(isAuthenticated);
          }
        }),
        tap(isAuthenticated => {
          if (!isAuthenticated) {
            this.router.navigateByUrl('/auth');
          } else {
            this.dataService.logAppStartup();
          }
        })
      );
    }
}
