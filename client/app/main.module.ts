import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { CoreModule } from './core/core.module';
import { MainComponent } from './main.component';
import SimplePreviewComponent from './simple-preview.component';

@NgModule({
    imports: [
        BrowserModule,
        CoreModule,
        ReactiveFormsModule
    ],
    declarations: [
        MainComponent,
        SimplePreviewComponent
    ],
    bootstrap: [ MainComponent ]
})
export default class MainModule {}
