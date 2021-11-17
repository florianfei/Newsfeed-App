import { Component, OnInit } from '@angular/core';

import { MenuController, NavController, Platform } from '@ionic/angular';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token
} from '@capacitor/push-notifications';
import { NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private menuCtrl: MenuController,
    private navCtrl: NavController
  ) {
  }

  ngOnInit() {
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      }
    });

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration',
      (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
      }
    );

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError',
      (error: any) => {
        console.log('Error on registration: ' + JSON.stringify(error));
      }
    );

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push received: ' + JSON.stringify(notification));
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        const data = notification.notification.data;
        // console.log('Action performed: ' + JSON.stringify(notification.notification));
        const navigationExtras: NavigationExtras = { state: { source: 1 } };
        if (data.articleId) {
          this.navCtrl.navigateForward(['news', data.articleId], navigationExtras);
        }
      }
    );
  }

  menuNavigate(route: string) {
    this.menuCtrl.close();
    this.navCtrl.navigateForward(route);
  }
}
