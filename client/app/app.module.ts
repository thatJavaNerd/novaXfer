import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { DocsModule } from './docs/docs.module';
import { HomeModule } from './home/home.module';
import { PlanModule } from './plan/plan.module';
import { NotFoundComponent } from './not-found.component';

@NgModule({
    imports: [
        BrowserModule,
        CoreModule,
        CommonModule,

        HomeModule,
        DocsModule,
        PlanModule,
        AppRoutingModule
    ],
    declarations: [
        AppComponent,
        NotFoundComponent
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule {}
