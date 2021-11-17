/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Storage } from '@capacitor/storage';
import { forkJoin } from 'rxjs';
import { BehaviorSubject, from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private OTP_CHECK = '';
  private USERS_SIGNIN = '';
  private USERS_LOGIN = '';
  private _userId = new BehaviorSubject<string>(null);
  private _subgroup = new BehaviorSubject<string>(null);
  private _sessionId = new BehaviorSubject<string>(null);

  constructor(private http: HttpClient, private fireauth: AngularFireAuth) {}

  get userIsAuthenticated() {
    return this._userId.asObservable().pipe(
      map((userId) => {
        if (userId) {
          return !!userId;
        } else {
          return false;
        }
      })
    );
  }

  get subgroup() {
    return this._subgroup.asObservable();
  }

  get userId() {
    return this._userId.asObservable();
  }

  get sessionId() {
    return this._sessionId.asObservable();
  }

  checkOtp(otp: string) {
    return this.http.get(environment.apiEndpoint + this.OTP_CHECK + otp).pipe(
      tap((res) => {
        if (res['subgroup']) {
          this._subgroup.next(res['subgroup']);
          this.storeSubgroup(res['subgroup']);
        }
      }));
  }

  authenticate(subgroup: string) {
    return this.firebaseSignIn().pipe(
      switchMap(() =>
        this.fireauth.idToken.pipe(switchMap((token) => {
          if (!token) {
            return of(token);
          } else {
            // return this.userSignUp(token);
            // console.log(token + Date.now());
            return this.userSignUp(token + Date.now(), subgroup);
          }
        }))
      ),
      tap((res) => {
        if (res) {
          // console.log(res);
          this._userId.next(res['user'].user_id);
          this.storeAuthId(res['user'].user_id);
        }
      })
    );
    // tap((resData) => {
    //   this._userId.next(resData['user'].uid);
    //   this.storeAuthToken(resData['user'].uid);
    // })
  }

  requestSessionId() {
    return this.createSession().pipe(
      tap((resData) => {
        this._sessionId.next(resData['session_id']);
      })
    );
  }

  autoAuthenticate() {
    const storageRequests = [from(Storage.get({key: 'userId'})), from(Storage.get({key: 'subgroup'}))];
    return forkJoin(storageRequests).pipe(
      map(storedData => {
        if (!storedData || !storedData[0].value || !storedData[1].value) {
          return null;
        } else {
          return storedData;
        }
      }),
      tap(storedData => {
        if (storedData && storedData[0].value && storedData[1].value) {
          const dataUser = JSON.parse(storedData[0].value);
          this._userId.next(dataUser['userId']);
          const dataSubgroup = JSON.parse(storedData[1].value);
          this._subgroup.next(dataSubgroup['subgroup']);
        }
      }),
      map(storedData => {
        if (storedData && storedData[0].value && storedData[1].value) {
          return true;
        } else {
          return false;
        }
      })
    );
  }

  private createSession() {
    return this.http.get(environment.apiEndpoint + this.USERS_SIGNIN);
  }

  private firebaseSignIn() {
    return from(
      new Promise<any>((resolve, reject) => {
        this.fireauth
          .signInAnonymously()
          .then((data) => {
            resolve(data);
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            reject(`login failed ${error.message}`);
          });
      })
    );
  }

  private userSignUp(token: string, subgroup: string) {
    const data = { fcm_token: token , subgroup};
    return this.http.post(environment.apiEndpoint + this.USERS_LOGIN, data);
  }

  private storeAuthId(authUserId: string) {
    const data = JSON.stringify({
      userId: authUserId
    });
    Storage.set({ key: 'userId', value: data});
  }

  private storeSubgroup(subgroup: string) {
    const data = JSON.stringify({
      subgroup
    });
    Storage.set({ key: 'subgroup', value: data});
  }
}
