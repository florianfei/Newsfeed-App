/* eslint-disable @typescript-eslint/dot-notation */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { Article } from '../../models/article.model';
import { DataService } from 'src/app/services/data.service';
import { delay, map, switchMap } from 'rxjs/operators';
import {
  AlertController,
  LoadingController,
  ModalController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { RatingModalPage } from '../modals/rating-modal.page';

@Component({
  selector: 'app-news-detail',
  templateUrl: './news-detail.page.html',
  styleUrls: ['./news-detail.page.scss'],
})
export class NewsDetailPage implements OnInit, OnDestroy {
  commentMessage;
  isLoading;
  userId;
  subgroup;
  loadedArticle: Article;
  loadedContent: string;
  loadedComment: string;
  private articleId: number;
  private source: number;
  private articleSubscription: Subscription;
  private articlesSubscription: Subscription;
  private articleCommentsSubscription: Subscription;

  constructor(
    private dataService: DataService,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (this.router.getCurrentNavigation().extras.state) {
        this.source = this.router.getCurrentNavigation().extras.state.source;
      }
    });
  }

  ngOnInit() {
    this.userId = this.dataService.userId;
    this.subgroup = this.dataService.subgroup;
    this.articleSubscription = this.dataService.articleContentSubject.subscribe(
      (content) => {
        this.loadedContent = content;
        if (this.loadedContent === undefined) {
          this.alertCtrl
            .create({
              header: 'Failed to fetch article content',
              message: 'The article with the given id is no longer available.',
              buttons: [
                {
                  text: 'Okay',
                  role: 'cancel',
                  handler: () => {
                    this.navCtrl.navigateBack('/news');
                  },
                },
              ],
            })
            .then((alertEl) => alertEl.present());
        }
      }
    );
    this.articleCommentsSubscription =
      this.dataService.articleCommentsSubject.subscribe((comments) => {
        const commentValue = comments.find(comment => comment['user_id'] === this.userId);
        this.loadedComment = commentValue === undefined ? null : commentValue;
      });
    // Article detail view opened directly (not entered via page view)
    if (this.dataService.articles === undefined) {
      this.articlesSubscription = this.dataService
        .fetchArticles()
        .subscribe(() => this.onLoadArticle());
    } else {
      // Page opened via page view
      this.onLoadArticle();
    }
  }

  ngOnDestroy() {
    this.articleSubscription.unsubscribe();
    this.articleCommentsSubscription.unsubscribe();
    if (this.articlesSubscription !== undefined) {
      this.articlesSubscription.unsubscribe();
    }
  }

  ionViewWillLeave() {
    if (this.loadedContent) {
      this.dataService.logViewClosed('artcl', this.articleId);
    }
  }

  onLoadArticle() {
    this.isLoading = true;
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'Loading article content' })
      .then((loadingEl) => {
        loadingEl.present();
        this.activatedRoute.paramMap
          .pipe(
            map((paramMap) => {
              if (!paramMap.has('articleId')) {
                this.navCtrl.navigateBack('/news');
                return;
              }
              const articleId = paramMap.get('articleId');
              this.articleId = Number(articleId);
              this.loadedArticle = this.dataService.fetchArticle(articleId);
              return articleId;
            }),
            switchMap((articleId) =>
              this.dataService.fetchArticleContent(articleId)
            )
          )
          .subscribe(
            (res) => {
              if (res !== undefined) {
                of([])
                  .pipe(delay(500))
                  .subscribe(() => {
                    if (this.source) {
                      this.dataService.logViewOpened(
                        'artcl',
                        this.articleId,
                        this.source
                      );
                    } else {
                      this.dataService.logViewOpened('artcl', this.articleId);
                    }
                  });
              }
              this.isLoading = false;
              loadingEl.dismiss();
            },
            (err) => {
              this.isLoading = false;
              loadingEl.dismiss();
              this.alertCtrl
                .create({
                  header: 'Failed to fetch article content',
                  message:
                    'Internet might be slow or unavailable, please check your connection.',
                  buttons: [
                    {
                      text: 'Okay',
                      role: 'cancel',
                      handler: () => {
                        this.navCtrl.navigateBack('/news');
                      },
                    },
                  ],
                })
                .then((alertEl) => alertEl.present());
            }
          );
      });
  }

  onComment() {
    if (this.commentMessage === undefined || !this.commentMessage) {
      this.alertCtrl
        .create({
          keyboardClose: true,
          message: 'Please enter valid text into the comment text area!',
          buttons: ['Okay'],
        })
        .then((alertEl) => alertEl.present());
      return;
    }
    this.toastCtrl
      .create({
        message: 'Submitting comment..',
        position: 'bottom',
        duration: 2000,
      })
      .then((submitToastEl) => {
        submitToastEl.present();
      });
    this.dataService
      .postComment(this.articleId.toString(), this.commentMessage)
      .subscribe(
        () => {
          this.toastCtrl
            .create({
              message: 'Comment successfully submitted!',
              position: 'bottom',
              duration: 2000,
            })
            .then((successToastEl) => {
              successToastEl.present();
            });
        },
        () => {
          this.toastCtrl
            .create({
              message: 'Failed to submit, connection failure',
              position: 'bottom',
              duration: 2000,
            })
            .then((failureToastEl) => {
              failureToastEl.present();
            });
        }
      );
  }

  onDeleteComment(comment: any) {
    if (comment['user_id'] !== this.userId) {
      return;
    }
    this.toastCtrl
      .create({
        message: 'Deleting comment..',
        position: 'bottom',
        duration: 2000,
      })
      .then((deleteToastEl) => {
        deleteToastEl.present();
      });
    this.dataService
      .postCommentDelete(this.articleId.toString(), comment['comment_id'])
      .subscribe(
        () => {
          this.toastCtrl
            .create({
              message: 'Comment successfully deleted!',
              position: 'bottom',
              duration: 2000,
            })
            .then((successToastEl) => {
              successToastEl.present();
            });
        },
        () => {
          this.toastCtrl
            .create({
              message: 'Failed to delete comment, connection failure',
              position: 'bottom',
              duration: 2000,
            })
            .then((failureToastEl) => {
              failureToastEl.present();
            });
        }
      );
  }

  onRating() {
    this.modalCtrl
      .create({
        component: RatingModalPage,
        cssClass: 'small-modal',
        backdropDismiss: true,
        componentProps: {
          articleId: this.articleId,
        },
      })
      .then((modal) => modal.present());
  }

  roundRating(rating: number) {
    return Math.round(rating * 2) / 2;
  }
}
