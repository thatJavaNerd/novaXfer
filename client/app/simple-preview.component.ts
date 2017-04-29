import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { CourseSummary, EquivalencyService } from './core/equivalency.service';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

@Component({
    selector: 'simple-preview',
    templateUrl: '/partial/simple-preview',
    styleUrls: [ 'build/simple-preview.css' ],
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
            .map(SimplePreviewComponent.makeSuccinct)
            .subscribe((cs: SuccinctCourseSummary) => {
                this.summary = cs;
            });
    }

    private static makeSuccinct(cs: CourseSummary): SuccinctCourseSummary {
        return cs === null ? null : {
            institutions: SimplePreviewComponent.formatInstitutions(cs.institutions),
            course: cs.subject + ' ' + cs.number,
            exists: cs.exists,
            icon: cs.exists ? 'check_circle' : 'block',
            link: cs.exists ? `/course/${cs.subject}/${cs.number}` : null
        };
    }

    private static formatInstitutions(i: string[]): string {
        if (i.length === 0) return null;
        if (i.length === 1) return i[0];
        if (i.length === 2) return i[0] + ' and ' + i[1];
        return `${i[0]}, ${i[1]}, and ${i.length - 2} more`;
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
