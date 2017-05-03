import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocsDisplayComponent } from './docs-display.component';

const routes: Routes = [
    { path: 'docs/:id', component: DocsDisplayComponent },
    { path: 'docs', redirectTo: '/docs/api', pathMatch: 'full' }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export default class DocsRoutingModule {}
