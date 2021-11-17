import { Component, OnDestroy, OnInit } from '@angular/core';
import { Storage } from '@capacitor/storage';
import { AlertController, LoadingController } from '@ionic/angular';
import { from, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Article } from 'src/app/models/article.model';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
})
export class HistoryPage implements OnInit, OnDestroy {
  recentArticles: Article[];
  isLoading: boolean;
  private recentArticlesSubscription: Subscription;

  constructor(
    private dataService: DataService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ionViewDidEnter() {
    this.dataService.logViewOpened('history');
  }

  ionViewWillLeave() {
    this.dataService.logViewClosed('history');
  }

  ngOnInit() {
    this.recentArticlesSubscription = this.dataService.recentArticlesSubject.subscribe(articles => {
      this.recentArticles = articles;
    });
    this.isLoading = true;
    this.loadingCtrl
      .create({
        keyboardClose: true,
        message: 'Loading history...',
      })
      .then((loadingEl) => {
        loadingEl.present();
        from(Storage.get({ key: 'readHistory' }))
          .pipe(
            map((storedData) => {
              let history = [];
              if (storedData && storedData.value) {
                history = JSON.parse(storedData.value);
              }
              history = history.slice(-10);
              return history.reverse();
            }),
            switchMap((history) =>
              this.dataService.fetchArticleHistory(history)
            )
          )
          .subscribe(res => {
            loadingEl.dismiss();
            this.isLoading = false;
          },
          err => {
            loadingEl.dismiss();
            this.isLoading = false;
            this.alertCtrl
              .create({
                header: 'Failed to fetch recent articles',
                message: 'Internet might be slow or unavailable, please check your connection.',
                buttons: ['Okay'],
              })
              .then((alertEl) => alertEl.present());
          });
      });
  }

  ngOnDestroy() {
    this.recentArticlesSubscription.unsubscribe();
  }
}
