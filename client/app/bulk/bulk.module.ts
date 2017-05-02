import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import CoreModule from '../core/core.module';

import BulkLookupComponent from './bulk-lookup.component';
import BulkRoutingModule from './bulk-routing.module';
import BulkComponent from './bulk.component';

@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        FormsModule,
        BulkRoutingModule
    ],
    declarations: [
        BulkComponent,
        BulkLookupComponent
    ]
})
export default class BulkModule {}
