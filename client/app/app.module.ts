import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import AppComponent from './app.component';
import CoreModule from './core/core.module';
import SimplePreviewComponent from './simple-preview.component';

@NgModule({
    imports: [
        BrowserModule,
        CoreModule,
        ReactiveFormsModule
    ],
    declarations: [
        AppComponent,
        SimplePreviewComponent
    ],
    bootstrap: [ AppComponent ]
})
export default class AppModule {}
