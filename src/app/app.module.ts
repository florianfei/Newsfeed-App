import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { RatingModalPage } from './news/modals/rating-modal.page';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule, PERSISTENCE } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';
import { HttpInterceptorService } from './services/http-interceptor.service';

@NgModule({
  declarations: [AppComponent, RatingModalPage],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, FormsModule,
            AngularFireModule.initializeApp(environment.firebaseConfig), AngularFireAuthModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
              { provide: PERSISTENCE, useValue: 'local' },
              { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}
