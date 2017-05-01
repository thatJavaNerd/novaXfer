import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Router } from '@angular/router';

import AppRoutingModule from './app-routing.module';
import AppComponent from './app.component';
import HomeModule from './home/home.module';

@NgModule({
    imports: [
        BrowserModule,
        CommonModule,

        HomeModule,
        AppRoutingModule
    ],
    declarations: [
        AppComponent
    ],
    bootstrap: [ AppComponent ]
})
export default class AppModule {
    constructor(router: Router) {
        console.log('Routes: ', JSON.stringify(router.config, undefined, 2));
    }
}
