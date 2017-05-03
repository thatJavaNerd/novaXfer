import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

import CoreModule from '../core/core.module';
import { DocsDisplayComponent } from './docs-display.component';
import DocsRoutingModule from './docs-routing.module';
import { DocsService } from './docs.service';

@NgModule({
    imports: [
        CoreModule,
        DocsRoutingModule,
        HttpModule
    ],
    declarations: [
        DocsDisplayComponent
    ],
    providers: [
        DocsService
    ]
})
export default class DocsModule {}
