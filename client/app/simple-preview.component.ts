import { Component, Inject, OnInit } from '@angular/core';
import {
    FormBuilder, FormGroup, Validators
} from '@angular/forms';

import { CourseEntry, Institution } from './common/api-models';
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
export default class SimplePreviewComponent implements OnInit {
    private static readonly COURSE_PATTERN = /^ *[A-Z]{3} +[0-9]{3} *$/i;
    private static readonly NBSP = String.fromCharCode(160);

    public form: FormGroup;
    public entry: CourseEntry;

    public institutions: Institution[];

    public constructor(
        @Inject(EquivalencyService) private equivService: EquivalencyService,
        @Inject(FormBuilder) private fb: FormBuilder
    ) {

        this.form = this.fb.group({
            course: ['', [Validators.required, Validators.pattern(SimplePreviewComponent.COURSE_PATTERN)]],
            institution: ['', [Validators.required]]
        });

        this.form.valueChanges
            .filter(() => this.form.valid)
            .debounceTime(300)
            .distinctUntilChanged()
            .switchMap((raw: InputForm) => {
                const courseParts = SimplePreviewComponent.normalizeWhitespace(raw.course).split(' ');
                return this.equivService.entry(courseParts[0].trim(), courseParts[1].trim(), raw.institution.trim());
            })
            .subscribe((val: CourseEntry) => {
                this.entry = val;
            });
    }

    public ngOnInit(): void {
        this.equivService.institutions().then((institutions: Institution[]) => {
            this.institutions = institutions;
        });
    }

    private static normalizeWhitespace(text) {
        return text.replace(new RegExp(`(?:\r\n|\r|\n|${SimplePreviewComponent.NBSP}| )+`, 'g'), ' ').trim();
    }
}

interface InputForm {
    course: string;
    institution: string;
}

