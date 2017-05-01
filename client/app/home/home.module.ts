import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import CoreModule from '../core/core.module';

import HomeRoutingModule from './home-routing.module';
import HomeComponent from './home.component';
import SimplePreviewComponent from './simple-preview.component';
import SummarizePipe from './summarize.pipe';

@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        ReactiveFormsModule,
        HomeRoutingModule
    ],
    declarations: [
        HomeComponent,
        SimplePreviewComponent,
        SummarizePipe
    ]
})
export default class HomeModule {}
