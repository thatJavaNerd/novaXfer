import { Component, OnInit } from '@angular/core';
import { Institution, Semester } from '../common/api-models';
import { EquivalencyService } from '../core/equivalency.service';

import * as _ from 'lodash';

@Component({
    template: `
        <site-header></site-header>
        <main>
            <div *ngFor="let semester of semesters">
                <semester [model]="semester" [institutions]="institutions"></semester>
            </div>
        </main>
    `
})
export class PlanComponent implements OnInit {
    public semesters: Semester[] = [
        {
            name: 'Fall 2016',
            courses: [
                { subject: 'CSC', number: '202' },
                { subject: 'ACC', number: '211' },
                { subject: 'ENG', number: '111' },
                { subject: 'PSY', number: '201' }
            ]
        },
        {
            name: 'Spring 2017',
            courses: [
                { subject: 'ENG', number: '112' },
                { subject: 'PSY', number: '202' },
            ]
        }
    ];
    public institutions: string[] = [];

    public constructor(
        private equiv: EquivalencyService
    ) {}

    public ngOnInit(): void {
        this.equiv.institutions().then((data: Institution[]) => {
            this.institutions = _.slice(_.map(data, (i) => i.acronym), 0, 3);
        });
    }
}
