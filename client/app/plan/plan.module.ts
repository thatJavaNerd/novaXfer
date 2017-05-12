import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CoreModule } from '../core/core.module';

import { PlanLookupComponent } from './plan-lookup.component';
import { PlanRoutingModule } from './plan-routing.module';
import { PlanComponent } from './plan.component';

@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        FormsModule,
        PlanRoutingModule
    ],
    declarations: [
        PlanComponent,
        PlanLookupComponent
    ]
})
export class PlanModule {}
