import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BulkComponent } from './bulk.component';

const routes: Routes = [
    { path: 'bulk', component: BulkComponent }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class BulkRoutingModule {}
