import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { EquivalencyService } from './core/equivalency.service';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

declare const module: any;

@Component({
    selector: 'simple-preview',
    moduleId: module.id,
    templateUrl: './simple-preview.html',
    styleUrls: [ './simple-preview.css' ],
    providers: [ EquivalencyService ]
})
export default class SimplePreviewComponent {
    private static readonly COURSE_PATTERN = /^ *[A-Z]{3} +[0-9]{3} *$/i;
    private static readonly NBSP = String.fromCharCode(160);

    public input = new FormControl('',
        [
            Validators.required,
            Validators.pattern(SimplePreviewComponent.COURSE_PATTERN)
        ]);

    public summary: SuccinctCourseSummary;

    public constructor(@Inject(EquivalencyService) private equivService: EquivalencyService) {
        this.input.valueChanges
            .filter(() => this.input.valid)
            .debounceTime(300)
            .distinctUntilChanged()
            .switchMap((raw: string) => {
                this.summary = null;
                const parts = SimplePreviewComponent.normalizeWhitespace(raw).split(' ');
                return this.equivService.courseSummary(parts[0].trim(), parts[1].trim());
            })
            .subscribe((cs: SuccinctCourseSummary) => {
                this.summary = cs;
            });
    }

    private static normalizeWhitespace(text) {
        return text.replace(new RegExp(`(?:\r\n|\r|\n|${SimplePreviewComponent.NBSP}| )+`, 'g'), ' ').trim();
    }
}

export interface SuccinctCourseSummary {
    institutions: string;
    course: string;
    exists: boolean;
    icon: string;
    link: string;
}
