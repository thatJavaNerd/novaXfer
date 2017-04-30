import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import AppComponent from './app.component';
import CapitalizePipe from './capitalize.pipe';
import CoreModule from './core/core.module';
import LargeHeaderComponent from './large-header.component';
import SimplePreviewComponent from './simple-preview.component';
import SummarizePipe from './summarize.pipe';

@NgModule({
    imports: [
        BrowserModule,
        CommonModule,
        CoreModule,
        ReactiveFormsModule
    ],
    declarations: [
        AppComponent,
        CapitalizePipe,
        LargeHeaderComponent,
        SimplePreviewComponent,
        SummarizePipe
    ],
    bootstrap: [ AppComponent ]
})
export default class AppModule {}
