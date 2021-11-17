/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable no-underscore-dangle */
import { App } from '@capacitor/app';
import { Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';
import { Platform } from '@ionic/angular';
import { Subscription, from, Subject, forkJoin, of } from 'rxjs';
import { EventTypes } from '../models/event-types.enum';
import { BrowsingEvent } from '../models/browsing-event.model';
import { SessionEvent } from '../models/session-event.model';
import { AuthService } from './auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { Article } from '../models/article.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // Constants
  private ARTICLES = '';
  private ARTICLES_SUBGROUP = '';
  private EVENTS_BROWSE = '';
  private EVENTS_SESSION = '';
  private COMMENTS_ADD = '';
  private COMMENTS_DELETE = '';
  private RATINGS = '';

  private viewIds = {
    listAll: -1,
    listEcnm: -2,
    listPltcs: -3,
    listHlth: -4,
    listClmt: -5,
    listEntmt: -6,
    history: -7,
    about: -8,
    privacy: -9
  };
  private initialLoadedId = 0;
  private initialFocusId = 0;
  private initialMatchId = 0;
  private _userId;
  private _subgroup;
  private _sessionId;
  private _loadId = this.initialLoadedId;
  private _focusId = this.initialFocusId;
  private _matchId = this.initialMatchId;
  private onPauseSubscription: Subscription;
  private onResumeSubscription: Subscription;

  private _articles: Article[];
  private _recentArticlesSubject: Subject<Article[]> = new Subject<Article[]>();
  private _articleSubject: Subject<Article[]> = new Subject<Article[]>();
  private _articleContentSubject: Subject<string> = new Subject<string>();
  private _articleCommentsSubject: Subject<string[]> = new Subject<string[]>();

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private http: HttpClient
  ) {
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });
    this.authService.userId.subscribe((userId) => {
      this._userId = userId;
    });
    this.authService.subgroup.subscribe((subgroup) => {
      this._subgroup = subgroup;
    });
    this.authService.sessionId.subscribe((sessionId) => {
      this._sessionId = sessionId;
      this._focusId = this.initialFocusId;
      this._loadId = this.initialLoadedId;
    });
    this.platform.ready().then(() => {
      if (!this.onResumeSubscription) {
        this.onResumeSubscription = this.platform.resume.subscribe(() =>
          this.logAppResumed()
        );
      }
      if (!this.onPauseSubscription) {
        this.onPauseSubscription = this.platform.pause.subscribe(() =>
          this.logAppPaused()
        );
      }
    });
  }

  fetchArticle(articleId: string) {
    return this._articles.find(
      (article) => article.id.toString() === articleId
    );
  }

  fetchArticleContent(articleId: string) {
    return this.http
      .get(environment.apiEndpoint + this.ARTICLES + articleId)
      .pipe(
        map((data) => data['article']),
        tap((article) => {
          this._articleCommentsSubject.next(article['comments']);
        }),
        map((article) => article['content']),
        tap((content) => this._articleContentSubject.next(content))
      );
  }

  fetchArticles() {
    return this.http.get(environment.apiEndpoint + this.ARTICLES_SUBGROUP + this._subgroup).pipe(
      map((data) => {
        if (
          data.hasOwnProperty('success') &&
          data['success'] &&
          data.hasOwnProperty('articles')
        ) {
          return data['articles'];
        }
        return [];
      }),
      map((articleArray) => {
        const newsArticles: Article[] = [];
        for (const a of articleArray) {
          const publishedStr: string = a['published_at'];
          const createdStr: string = a['created_at'];
          if (!publishedStr || !createdStr) {
            break;
          }
          const published = publishedStr.split(',');
          const created = createdStr.split(',');
          const currArticle = {
            id: a['id'],
            title: a['headline'],
            author: a['author'],
            imageUrl: a['img_url'],
            category: a['category'],
            readingTime: a['reading_time'],
            rating: a['rating'],
            publishedDate: published[0] + ', ' + published[1],
            createdDate: created[0] + ', ' + created[1],
            content: [],
          };
          newsArticles.push(currArticle);
        }
        return newsArticles;
      }),
      tap((articles) => {
        this._articles = articles;
        this._articleSubject.next([...this._articles]);
      })
    );
  }

  fetchArticleHistory(history: number[]) {
    if (history.length === 0) {
      return of([]).pipe(tap(() => this._recentArticlesSubject.next([])));
    }
    const historyHttp = history.map((articleId) =>
      this.http.get(environment.apiEndpoint + this.ARTICLES + articleId)
    );
    return forkJoin(historyHttp).pipe(
      map((responses) =>
        responses.filter((res) => !(res instanceof HttpErrorResponse))
      ),
      map((responses) => responses.map((res) => res['article'])),
      map((articleArray) => {
        const newsArticles: Article[] = [];
        for (const a of articleArray) {
          const publishedStr: string = a['published_at'];
          const createdStr: string = a['created_at'];
          if (!publishedStr || !createdStr) {
            break;
          }
          const published = publishedStr.split(',');
          const created = createdStr.split(',');
          const currArticle = {
            id: a['id'],
            title: a['headline'],
            author: a['author'],
            imageUrl: a['img_url'],
            category: a['category'],
            readingTime: a['reading_time'],
            rating: a['rating'],
            publishedDate: published[0] + ', ' + published[1],
            createdDate: created[0] + ', ' + created[1],
            content: [],
          };
          newsArticles.push(currArticle);
        }
        return newsArticles;
      }),
      tap((articles) => {
        this._recentArticlesSubject.next([...articles]);
      })
    );
  }

  postComment(articleId: string, commentContent: string) {
    return this.http.post(environment.apiEndpoint + this.COMMENTS_ADD, {
      user_id: this.userId,
      article_id: articleId,
      text: commentContent,
    });
  }

  postCommentDelete(articleId: string, commentId: string) {
    return this.http.post(
      environment.apiEndpoint + this.COMMENTS_DELETE + commentId,
      {}
    );
  }

  postRating(articleId: string, rating: number) {
    return this.http.post(environment.apiEndpoint + this.RATINGS, {
      user_id: this.userId,
      article_id: articleId,
      rating,
    });
  }

  logViewOpened(view: string, viewId: number = -1, source: number = 0) {
    if (viewId >= 0) {
      this.pushBrowsingEvent(EventTypes.viewOpened, viewId, source);
      this.backlogReadHistory(viewId);
    } else {
      this.pushBrowsingEvent(EventTypes.viewOpened, this.viewIds[view], source);
    }
  }

  logViewClosed(view: string, viewId: number = -1, source: number = 0) {
    if (viewId >= 0) {
      this.pushBrowsingEvent(EventTypes.viewClosed, viewId, source);
    } else {
      this.pushBrowsingEvent(EventTypes.viewClosed, this.viewIds[view], source);
    }
  }

  logAppStartup() {
    this.pushSessionEvent(EventTypes.appOpened);
  }

  private logAppResumed() {
    this.pushSessionEvent(EventTypes.appResumed);
  }

  private logAppPaused() {
    this.pushSessionEvent(EventTypes.appPaused);
    const storageAccess = [];
    storageAccess.push(from(Storage.get({ key: 'sessionEvents' })));
    storageAccess.push(from(Storage.get({ key: 'browsingEvents' })));
    forkJoin(storageAccess).subscribe((results) => {
      let ssEvData = [];
      let brEvData = [];
      if (results[0] && results[0]['value']) {
        ssEvData = JSON.parse(results[0]['value']);
      }
      if (results[1] && results[1]['value']) {
        brEvData = JSON.parse(results[0]['value']);
      }
      if (ssEvData.length > 0 || brEvData.length > 0) {
        this.pushEventData(ssEvData, brEvData);
      }
    });
  }

  private pushSessionEvent(ev: EventTypes) {
    const sessionEvData: SessionEvent = {
      timestamp: Date.now(),
      user_id: this._userId,
      session_id: this._sessionId,
      event: ev,
      match_id: this._matchId,
    };
    if (ev === EventTypes.appPaused) {
      this._matchId++;
      this._focusId++;
    }
    this.http
      .post(environment.apiEndpoint + this.EVENTS_SESSION, sessionEvData)
      .subscribe(
        () => {},
        () => {
          this.backlogSessionEvent(sessionEvData);
        }
      );
  }

  private pushBrowsingEvent(ev: EventTypes, viewId: number, source: number) {
    if (!this._sessionId) {
      return;
    }
    if (ev === EventTypes.viewOpened) {
      this._loadId++;
      this._focusId++;
    }
    const browsingEvData: BrowsingEvent = {
      timestamp: Date.now(),
      user_id: this._userId,
      session_id: this._sessionId,
      event: ev,
      load_id: this._loadId,
      focus_id: this._focusId,
      view_id: viewId,
      source,
    };
    this.http
      .post(environment.apiEndpoint + this.EVENTS_BROWSE, browsingEvData)
      .subscribe(
        () => {},
        () => {
          this.backlogBrowsingEvent(browsingEvData);
        }
      );
  }

  private backlogReadHistory(articleId: number) {
    from(Storage.get({ key: 'readHistory' })).subscribe(
      (storedData) => {
        let history = [];
        if (storedData && storedData.value) {
          history = JSON.parse(storedData.value);
        }
        const idx = history.findIndex((el) => el === articleId);
        if (idx >= 0) {
          history = history.filter((value, i) => i !== idx);
        }
        history.push(articleId);
        const data = JSON.stringify(history);
        Storage.set({ key: 'readHistory', value: data });
      }
    );
  }

  private backlogSessionEvent(ssEv: SessionEvent) {
    from(Storage.get({ key: 'sessionEvents' })).subscribe(
      (storedData) => {
        let ssEvData = [];
        if (storedData && storedData.value) {
          ssEvData = JSON.parse(storedData.value);
        }
        ssEvData.push(ssEv);
        const data = JSON.stringify(ssEvData);
        Storage.set({ key: 'sessionEvents', value: data });
      }
    );
  }

  private backlogBrowsingEvent(brEv: BrowsingEvent) {
    from(Storage.get({ key: 'browsingEvents' })).subscribe(
      (storedData) => {
        let brEvData = [];
        if (storedData && storedData.value) {
          brEvData = JSON.parse(storedData.value);
        }
        brEvData.push(brEv);
        const data = JSON.stringify(brEvData);
        Storage.set({ key: 'browsingEvents', value: data });
      }
    );
  }

  private pushEventData(
    sessionEvents: SessionEvent[],
    browsingEvents: BrowsingEvent[]
  ) {
    const sessionPostRequests = sessionEvents.map((sessionEvent) =>
      this.http
        .post(environment.apiEndpoint + this.EVENTS_SESSION, sessionEvent)
        .pipe(catchError((err) => of(err)))
    );
    const browsingPostRequests = browsingEvents.map((browsingEvent) =>
      this.http
        .post(environment.apiEndpoint + this.EVENTS_BROWSE, browsingEvent)
        .pipe(catchError((err) => of(err)))
    );

    forkJoin(sessionPostRequests)
      .pipe(
        map((responses) =>
          responses.map((response) => response instanceof HttpErrorResponse)
        )
      )
      .subscribe((boolMask) => {
        if (!boolMask.reduce((a, b) => a || b)) {
          Storage.remove({ key: 'sessionEvents' });
        } else {
          const data = JSON.stringify(
            sessionEvents.filter((value, idx) => boolMask[idx])
          );
          Storage.set({ key: 'sessionEvents', value: data });
        }
      });

    forkJoin(browsingPostRequests)
      .pipe(
        map((responses) =>
          responses.map((response) => response instanceof HttpErrorResponse)
        )
      )
      .subscribe((boolMask) => {
        if (!boolMask.reduce((a, b) => a || b)) {
          Storage.remove({ key: 'browsingEvents' });
        } else {
          const data = JSON.stringify(
            browsingEvents.filter((value, idx) => boolMask[idx])
          );
          Storage.set({ key: 'browsingEvents', value: data });
        }
      });
  }

  get userId() {
    return this._userId;
  }

  get subgroup() {
    return this._subgroup;
  }

  get sessionId() {
    return this._sessionId;
  }

  get articles() {
    return this._articles;
  }

  get recentArticlesSubject() {
    return this._recentArticlesSubject;
  }

  get articlesSubject() {
    return this._articleSubject;
  }

  get articleContentSubject() {
    return this._articleContentSubject;
  }

  get articleCommentsSubject() {
    return this._articleCommentsSubject;
  }
}
