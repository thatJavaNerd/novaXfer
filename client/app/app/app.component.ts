import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';

import { CourseSummary, EquivalencyService } from '../core/equivalency.service';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'novaxfer',
    template: `
        <input [formControl]="input" type="text">
        <pre>{{ summary | async | json }}</pre>
    `,
    providers: [ EquivalencyService ]
})
export class AppComponent {
    public input = new FormControl();
    public summary: Observable<CourseSummary>;

    public constructor(@Inject(EquivalencyService) private equivService: EquivalencyService) {
        this.summary = this.input.valueChanges
            .debounceTime(300)
            .distinctUntilChanged()
            .map((course: string) => course.trim().split(' '))
            .switchMap((parts: string[]) => this.equivService.courseSummary(parts[0], parts[1]));
    }
}
