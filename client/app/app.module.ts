import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import AppComponent from './app.component';
import HomeComponent from './home/home.component';
import HomeModule from './home/home.module';

const routes: Routes = [
    { path: '', component: HomeComponent }
];

@NgModule({
    imports: [
        BrowserModule,
        CommonModule,
        HomeModule,
        RouterModule.forRoot(routes)
    ],
    declarations: [
        AppComponent
    ],
    bootstrap: [ AppComponent ]
})
export default class AppModule {}
