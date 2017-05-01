import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import AppRoutingModule from './app-routing.module';
import AppComponent from './app.component';
import HomeModule from './home/home.module';
import { Router } from '@angular/router';

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
        console.log(router.config);
    }
}
