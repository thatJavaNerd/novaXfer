import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';

import { CoreModule } from '../core/core.module';
import { MainComponent } from './main.component';

@NgModule({
    imports: [
        BrowserModule,
        CoreModule,
        HttpModule,
        ReactiveFormsModule
    ],
    declarations: [
        MainComponent
    ],
    bootstrap: [ MainComponent ]
})
export default class MainModule {}
