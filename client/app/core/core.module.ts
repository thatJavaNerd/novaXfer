import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import CapitalizePipe from './capitalize.pipe';
import { EquivalencyService } from './equivalency.service';
import LargeHeaderComponent from './large-header.component';
import NavigationComponent from './navigation.component';
import SmallHeaderComponent from './small-header.component';
import SummarizePipe from './summarize.pipe';

@NgModule({
    imports: [
        HttpModule,
        // Import this so that the NavigationComponent can use routerLink
        RouterModule
    ],
    declarations: [
        CapitalizePipe,
        LargeHeaderComponent,
        NavigationComponent,
        SmallHeaderComponent,
        SummarizePipe
    ],
    exports: [
        CapitalizePipe,
        LargeHeaderComponent,
        SmallHeaderComponent,
        SummarizePipe
    ],
    providers: [ EquivalencyService ]
})
export default class CoreModule {}

