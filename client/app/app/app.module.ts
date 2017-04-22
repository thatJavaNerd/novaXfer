import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';

import { CoreModule } from '../core/core.module';
import { AppComponent } from './app.component';

@NgModule({
    imports: [
        BrowserModule,
        CoreModule,
        FormsModule,
        HttpModule
    ],
    declarations: [
        AppComponent
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule {}
