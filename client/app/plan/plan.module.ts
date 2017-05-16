import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CoreModule } from '../core/core.module';

import { InstitutionSyncService } from './institution-sync.service';
import { PlanRoutingModule } from './plan-routing.module';
import { PlanComponent } from './plan.component';
import { SemesterComponent } from './semester.component';

@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        FormsModule,
        PlanRoutingModule
    ],
    declarations: [
        PlanComponent,
        SemesterComponent
    ],
    providers: [
        InstitutionSyncService
    ]
})
export class PlanModule {}
