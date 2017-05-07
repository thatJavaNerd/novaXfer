import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { CapitalizePipe } from './capitalize.pipe';
import { EquivalencyService } from './equivalency.service';
import { NavigationComponent } from './navigation.component';
import { PatternService } from './pattern.service';
import { SiteHeaderComponent } from './site-header.component';
import { SummarizePipe } from './summarize.pipe';

@NgModule({
    imports: [
        CommonModule,
        HttpModule,
        ReactiveFormsModule,
        // Import this so that the NavigationComponent can use routerLink
        RouterModule
    ],
    declarations: [
        CapitalizePipe,
        NavigationComponent,
        SiteHeaderComponent,
        SummarizePipe
    ],
    exports: [
        CapitalizePipe,
        SiteHeaderComponent,
        SummarizePipe
    ],
    providers: [
        EquivalencyService,
        PatternService
    ]
})
export class CoreModule {}

