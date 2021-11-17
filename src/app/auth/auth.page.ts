/* eslint-disable @typescript-eslint/dot-notation */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { forkJoin, from, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  authTokenStored;
  otpInput;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.authService.userIsAuthenticated
      .pipe(
        take(1),
        switchMap((isAuthenticated) => {
          // console.log("Before check");
          if (!isAuthenticated) {
            // console.log("Automatically authenticating");
            return this.authService.autoAuthenticate();
          } else {
            // console.log("Not authenticating");
            return of(isAuthenticated);
          }
        })
      )
      .subscribe((isAuthenticated) => {
        this.authTokenStored = isAuthenticated;
      });
  }

  onStart(ev: any) {
    if (!this.otpInput) {
      // console.log('No value present in the authentication field!');
      this.showAlert('No value present in the authentication field!', 'Make sure to input the correct one-time pad.');
      return;
    }
    this.isLoading = true;
    this.loadingCtrl
      .create({
        keyboardClose: true,
        message: 'Checking validity of one-time pad..',
      })
      .then((loadingOtp) => {
        loadingOtp.present();
        this.authService.checkOtp(this.otpInput).subscribe((res) => {
          if (res['success'] && res['is_valid']) {
            this.isLoading = false;
            loadingOtp.dismiss();
            this.isLoading = true;
            this.loadingCtrl
              .create({
                keyboardClose: true,
                message: 'Authenticating and creating session...',
              })
              .then((loadingEl) => {
                loadingEl.present();
                this.authService
                  .authenticate(res['subgroup'])
                  .pipe(
                    switchMap((isAuthenticated) =>
                      this.authService.requestSessionId()
                    )
                  )
                  .subscribe(
                    (resData) => {
                      // if either response fails, dismiss
                      // console.log(resData);
                      this.isLoading = false;
                      loadingEl.dismiss();
                      this.router.navigateByUrl('/news');
                    },
                    (errRes) => {
                      this.isLoading = false;
                      loadingEl.dismiss();
                      this.showAlert(
                        'Authentication / Session creation failed',
                        'Failed to establish a connection with the Firebase server, please check your internet connection.'
                      );
                    }
                  );
              });
          } else {
            this.isLoading = false;
            loadingOtp.dismiss();
            this.showAlert(
              'One-time pad is not valid',
              'The provided input is not a valid one-time pad. Please check your input for any mistakes.'
            );
          }
        },
        (err) => {
          // console.log(err);
          this.isLoading = false;
          loadingOtp.dismiss();
          this.showAlert(
            'Failed to establish connection with server',
            'Please check your internet connection and then try again.'
          );
        });
      });
  }

  onSessionStart(ev: any) {
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'Creating session...' })
      .then((loadingEl) => {
        loadingEl.present();
        this.authService.requestSessionId().subscribe(
          (resData) => {
            this.isLoading = false;
            loadingEl.dismiss();
            this.router.navigateByUrl('/news');
          },
          (errRes) => {
            this.isLoading = false;
            loadingEl.dismiss();
            this.showAlert(
              'Session creation failed',
              'Unable to connect to server to fetch sessionId. Please check your internet connection and then try again'
            );
          }
        );
      });
  }

  private showAlert(header: string, message: string) {
    this.alertCtrl
      .create({
        header,
        message,
        buttons: ['Okay'],
      })
      .then((alertEl) => alertEl.present());
  }
}
