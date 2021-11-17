import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})
export class AboutPage implements OnInit {

  constructor(
    private navCtrl: NavController,
    private dataService: DataService
  ) { }

  ionViewDidEnter() {
    this.dataService.logViewOpened('about');
  }

  ionViewWillLeave() {
    this.dataService.logViewClosed('about');
  }

  ngOnInit() {
  }

  navigateBack() {
    this.navCtrl.navigateBack('/news');
  }

}
