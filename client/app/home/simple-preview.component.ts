import { Component, OnInit } from '@angular/core';
import {
    FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { Response } from '@angular/http';

import { CourseEntry, Institution } from '../common/api-models';
import { EquivalencyService } from '../core/equivalency.service';
import { PatternService } from '../core/pattern.service';

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

    public form: FormGroup;
    public entry: CourseEntry;

    public institutions: Institution[];

    public constructor(
        private equivService: EquivalencyService,
        private pattern: PatternService,
        private fb: FormBuilder,
    ) {

        this.form = this.fb.group({
            course: ['', [Validators.required, pattern.get('course').validator()]],
            institution: ['', [Validators.required]]
        });

        this.form.valueChanges
            .filter(() => this.form.valid)
            .debounceTime(300)
            .distinctUntilChanged()
            .switchMap(async (raw: InputForm) => {
                const course = pattern.get('course').parse(raw.course);
                try {
                    const inst = raw.institution.trim();

                    return await this.equivService.entry(course, inst);
                } catch (ex) {
                    if (ex instanceof Response) {
                        return null;
                    }

                    throw ex;
                }
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
}

interface InputForm {
    course: string;
    institution: string;
}

