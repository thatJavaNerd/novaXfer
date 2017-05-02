import { Component, OnInit } from '@angular/core';
import { EquivalencyService } from '../core/equivalency.service';

import {
    CourseEntry, Institution, InstitutionFocusedEquivalency,
    KeyCourse
} from '../common/api-models';

import * as _ from 'lodash';

declare const module: any;

@Component({
    selector: 'bulk-lookup',
    templateUrl: './bulk-lookup.html',
    styleUrls: [ './bulk-lookup.css' ],
    moduleId: module.id
})
export default class BulkLookupComponent implements OnInit {
    public availableInstitutions: Institution[];

    public readonly institutions: string[] = ['', ''];
    public readonly courses: string[] = ['FOR 202', 'MTH 163'];

    private parsedCourses: KeyCourse[] = [
        {
            subject: 'FOR',
            number: '202'
        },
        {
            subject: 'MTH',
            number: '163'
        }
    ];

    /**
     * A 2-dimensional array of equivalency data where the each subarray
     * represents equivalencies for a given institution. The equivalency data
     * for the third institution (from the left) and the first course (from the
     * top) is specified at `matrix[0][2]`.
     *
     * Succinctly, `matrix[courseIndex][institutionIndex]`
     */
    public readonly matrix: CourseEntry[][] = [];

    public constructor(private equiv: EquivalencyService) {}

    public ngOnInit(): void {
        this.equiv.institutions().then((data: Institution[]) => {
            this.availableInstitutions = data;
        });
    }

    public onChangeInstitution(i: number, acronym: string) {
        this.equiv.forInstitution(acronym, this.parsedCourses).then((data: InstitutionFocusedEquivalency) => {

            for (let j = 0; j < this.parsedCourses.length; j++) {
                const findFn = (c: CourseEntry): boolean =>
                    c.subject === this.parsedCourses[j].subject &&
                        c.number === this.parsedCourses[j].number;

                if (this.matrix[j] === undefined)
                    this.matrix[j] = [];
                this.matrix[j][i] = _.find(data.courses, findFn);
            }
        });
    }

    public onChangeCourse(i: number, course: string) {
        console.log(i, course);
    }

    public coursesTrackBy(index: number, item: any) {
        return index;
    }
}
