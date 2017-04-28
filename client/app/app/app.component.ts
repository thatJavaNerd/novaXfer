import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { CourseSummary, EquivalencyService } from '../core/equivalency.service';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'novaxfer',
    templateUrl: '/partial/app',
    providers: [ EquivalencyService ]
})
export class AppComponent {
    private static readonly COURSE_PATTERN = / *[A-Z]{3} ?[0-9]{3} */i;
    public input = new FormControl('',
        [
            Validators.required,
            Validators.pattern(AppComponent.COURSE_PATTERN)
        ]);

    public summary: Observable<CourseSummary>;

    public constructor(@Inject(EquivalencyService) private equivService: EquivalencyService) {
        this.summary = this.input.valueChanges
            .filter(AppComponent.validateCourse)
            .debounceTime(300)
            .distinctUntilChanged()
            .map((course: string) => course.trim().split(' '))
            .switchMap((parts: string[]) => this.equivService.courseSummary(parts[0], parts[1]));
    }

    private static validateCourse(input: string): boolean {
        return input !== undefined && AppComponent.COURSE_PATTERN.test(input);
    }
}
