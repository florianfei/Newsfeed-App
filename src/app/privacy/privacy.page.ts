import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.page.html',
  styleUrls: ['./privacy.page.scss'],
})
export class PrivacyPage implements OnInit {

  constructor(
    private navCtrl: NavController,
    private dataService: DataService
  ) { }

  ionViewDidEnter() {
    this.dataService.logViewOpened('privacy');
  }

  ionViewWillLeave() {
    this.dataService.logViewClosed('privacy');
  }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.navigateBack('/news');
  }

}
