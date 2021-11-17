import { Component, Input } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-rating-modal',
  templateUrl: './rating-modal.page.html'
})
export class RatingModalPage {
  @Input() articleId: number;
  ratingScore = 3;

  constructor(
    private dataService: DataService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController) {
  }

  onSubmit(form: NgForm) {
    if (!form.controls.rating.value) {
      return;
    }
    this.loadingCtrl.create({
      keyboardClose: true,
      message: 'Submitting rating...'
    }).then(loadingEl => {
      loadingEl.present();
      this.dataService.postRating(this.articleId.toString(), form.controls.rating.value).subscribe(
        () => {
          loadingEl.dismiss();
          this.toastCtrl.create({
            message: 'Successfully submitted rating!',
            position: 'bottom',
            duration: 2000
          }).then(
            successToastEl => {
              successToastEl.present();
              this.modalCtrl.dismiss();
            }
          );
        },
        () => {
          loadingEl.dismiss();
          this.toastCtrl.create({
            message: 'Failed to submit rating, please check your connection.',
            position: 'bottom',
            duration: 2000
          }).then(
            failureToastEl => {
              failureToastEl.present();
              this.modalCtrl.dismiss();
            }
          );
        }
      );
    });
  }
}
