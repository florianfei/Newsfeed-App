/* eslint-disable @typescript-eslint/dot-notation */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, LoadingController, MenuController, Platform } from '@ionic/angular';
import { forkJoin, from, Subscription } from 'rxjs';
import { Article } from '../models/article.model';
import { DataService } from '../services/data.service';
import { Storage } from '@capacitor/storage';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage implements OnInit, OnDestroy {
  isLoading;
  articles: Article[];
  filteredArticles: Article[];
  readArticles: Set<any>;
  filter = '';
  prevFilter = '';
  private articlesSubscription: Subscription;
  private onResumeSubscription: Subscription;

  constructor(
    private dataService: DataService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private menuCtrl: MenuController,
  ) { }

  ngOnInit() {
    this.articlesSubscription = this.dataService.articlesSubject.subscribe(articles => {
      this.articles = [...articles];
      this.sortByCategory();
    });
    this.autoRefresh();
  }

  openMenu() {
    this.menuCtrl.enable(true, 'menu');
    this.menuCtrl.open('menu');
  }

  ionViewWillEnter() {
  }

  ionViewDidEnter() {
    if (this.dataService.sessionId) {
      this.dataService.logViewOpened(this.refactorCategory(this.filter));
    }
  }

  ionViewWillLeave() {
    this.dataService.logViewClosed(this.refactorCategory(this.filter));
  }

  ngOnDestroy() {
    this.articlesSubscription.unsubscribe();
    this.onResumeSubscription.unsubscribe();
  }

  autoRefresh() {
    this.isLoading = true;
    this.loadingCtrl.create({ keyboardClose: true, message: 'Fetching articles'})
    .then(loadingEl => {
      loadingEl.present();
      const fetchRead = from(Storage.get({ key: 'readHistory' })).pipe(
        map((storedData) => {
          let history = [];
          if (storedData && storedData.value) {
            history = JSON.parse(storedData.value);
          }
          history = history.slice(-10);
          return history.reverse();
        }),
      );
      const articleData = [fetchRead, this.dataService.fetchArticles()];
      forkJoin(articleData).subscribe(res => {
        this.readArticles = new Set(res[0]);
        console.log(this.readArticles);
        loadingEl.dismiss();
        this.isLoading = false;
        if (res[1] === undefined) {
          this.showAlert('Failed to fetch articles', 'Failed to fetch articles, check your internet connection.');
        }
      },
      err => {
        this.isLoading = false;
        loadingEl.dismiss();
        this.showAlert('Failed to fetch articles', 'Internet might be slow or unavailable, please check your connection.');
      });
    });
  }

  doRefresh(ev) {
    const fetchRead = from(Storage.get({ key: 'readHistory' })).pipe(
      map((storedData) => {
        let history = [];
        if (storedData && storedData.value) {
          history = JSON.parse(storedData.value);
        }
        history = history.slice(-10);
        return history.reverse();
      }),
    );
    const articleData = [fetchRead, this.dataService.fetchArticles()];
    forkJoin(articleData).subscribe(res => {
      this.readArticles = new Set(res[0]);
      console.log(this.readArticles);
      ev.target.complete();
      if (res[1] === undefined) {
        this.showAlert('Failed to fetch articles', 'Failed to fetch articles, check your internet connection.');
      }
    },
    err => {
      ev.target.complete();
      this.showAlert('Failed to fetch articles', 'Internet might be slow or unavailable, please check your connection.');
    });
  }

  sortByCategory() {
    this.filteredArticles = this.filter === '' ? [...this.articles] : [...this.articles.filter(article =>
      article.category.toLowerCase() === this.filter)];
  }

  onFilterUpdate(ev: Event) {
    this.dataService.logViewClosed(this.refactorCategory(this.prevFilter));
    this.prevFilter = ev['detail'].value;
    this.sortByCategory();
    this.dataService.logViewOpened(this.refactorCategory(this.filter));
  }

  addRead(articleId: string) {
    this.readArticles.add(+articleId);
    this.readArticles = new Set(this.readArticles);
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

  private refactorCategory(category: string) {
    switch(category) {
      case 'economy': {
        return 'listEcnm';
      }
      case 'politics': {
        return 'listPltcs';
      }
      case 'health': {
        return 'listHlth';
      }
      case 'climate': {
        return 'listClmt';
      }
      case 'entertainment': {
        return 'listEntmt';
      }
      default: {
        return 'listAll';
      }
    }
  }
}
