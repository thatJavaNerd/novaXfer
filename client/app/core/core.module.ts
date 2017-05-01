import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import CapitalizePipe from './capitalize.pipe';
import { EquivalencyService } from './equivalency.service';
import LargeHeaderComponent from './large-header.component';
import NavigationComponent from './navigation.component';

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
    ],
    exports: [
        CapitalizePipe,
        LargeHeaderComponent
    ],
    providers: [ EquivalencyService ]
})
export default class CoreModule {}

