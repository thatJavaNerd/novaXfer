import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Router } from '@angular/router';

import AppRoutingModule from './app-routing.module';
import AppComponent from './app.component';
import BulkModule from './bulk/bulk.module';
import CoreModule from './core/core.module';
import DocsModule from './docs/docs.module';
import HomeModule from './home/home.module';
import NotFoundComponent from './not-found.component';

@NgModule({
    imports: [
        BrowserModule,
        CoreModule,
        CommonModule,

        HomeModule,
        BulkModule,
        DocsModule,
        AppRoutingModule
    ],
    declarations: [
        AppComponent,
        NotFoundComponent
    ],
    bootstrap: [ AppComponent ]
})
export default class AppModule {
    constructor(router: Router) {
        console.log('Routes: ', JSON.stringify(router.config, undefined, 2));
    }
}
