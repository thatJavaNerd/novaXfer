import { NgModule } from '@angular/core';

import CoreModule from '../core/core.module';
import { DocsDisplayComponent } from './docs-display.component';
import DocsRoutingModule from './docs-routing.module';

@NgModule({
    imports: [
        CoreModule,
        DocsRoutingModule
    ],
    declarations: [
        DocsDisplayComponent
    ]
})
export default class DocsModule {}
