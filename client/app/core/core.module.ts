import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import CapitalizePipe from './capitalize.pipe';
import { EquivalencyService } from './equivalency.service';
import LargeHeaderComponent from './large-header.component';
import NavigationComponent from './navigation.component';
import SmallHeaderComponent from './small-header.component';

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
        SmallHeaderComponent
    ],
    exports: [
        CapitalizePipe,
        LargeHeaderComponent,
        SmallHeaderComponent,
    ],
    providers: [ EquivalencyService ]
})
export default class CoreModule {}

