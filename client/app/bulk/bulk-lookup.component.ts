import { Component, OnInit } from '@angular/core';
import { EquivalencyService } from '../core/equivalency.service';

import {
    CourseEntry, CourseEquivalencyDocument, Institution,
    InstitutionFocusedEquivalency,
    KeyCourse
} from '../common/api-models';

import * as _ from 'lodash';
import { PatternHelper, PatternService } from '../core/pattern.service';

declare const module: any;

@Component({
    selector: 'bulk-lookup',
    templateUrl: './bulk-lookup.html',
    styleUrls: [ './bulk-lookup.css' ],
    moduleId: module.id
})
export default class BulkLookupComponent implements OnInit {
    public availableInstitutions: Institution[];

    public readonly institutions: string[] = ['UVA', 'VT'];
    public readonly courses: string[] = ['MTH 163', 'CSC 202'];

    private courseHelper: PatternHelper<KeyCourse>;

    private parsedCourses: KeyCourse[] = [];

    /**
     * A 2-dimensional array of equivalency data where the each subarray
     * represents equivalencies for a given institution. The equivalency data
     * for the third institution (from the left) and the first course (from the
     * top) is specified at `matrix[0][2]`.
     *
     * Succinctly, `matrix[courseIndex][institutionIndex]`
     */
    public readonly matrix: CourseEquivalencyDocument[][][] = [];

    public constructor(
        private equiv: EquivalencyService,
        private pattern: PatternService
    ) {}

    public ngOnInit(): void {
        this.courseHelper = this.pattern.get('course');
        this.parsedCourses = _.map(this.courses, (c) => this.courseHelper.parse(c));

        this.equiv.institutions().then((data: Institution[]) => {
            this.availableInstitutions = data;
        });
    }

    public onChangeInstitution(instIndex: number, acronym: string) {
        this.equiv.forInstitution(acronym, this.parsedCourses).then((data: InstitutionFocusedEquivalency) => {
            for (let i = 0; i < this.parsedCourses.length; i++) {
                const findFn = (c: CourseEntry): boolean =>
                    c.subject === this.parsedCourses[i].subject &&
                        c.number === this.parsedCourses[i].number;

                if (this.matrix[i] === undefined)
                    this.matrix[i] = [];
                this.matrix[i][instIndex] = _.find(data.courses, findFn).equivalencies;
            }
        });
    }

    public onChangeCourse(courseIndex: number, course: string) {
        if (this.courseHelper.matches(course)) {
            const parsed = this.courseHelper.parse(course);

            const prevCourse = this.parsedCourses[courseIndex];

            // No need to do extra work
            if (prevCourse !== undefined &&
                parsed.subject === prevCourse.subject &&
                parsed.number === prevCourse.number)
                return;

            // Request data for this institution, filtering data so that it only
            // includes the institutions we currently have
            this.equiv.forCourse(parsed, this.institutions).then((data: CourseEntry) => {
                // Group the result by each equivalency's acronym so that all
                // equivalencies for UVA can be accessed at equivMapping['UVA']
                const equivMapping = _.groupBy(data.equivalencies, (e) => e.institution);

                for (const acronym of this.institutions) {
                    // Find the index of each institution in the array
                    const institutionIndex = _.findIndex(this.institutions, (i) => i === acronym);

                    // If institutionIndex < 0, then there's a bug in either the
                    // server/client side. Fail hard so the user isn't presented
                    // bad info
                    if (institutionIndex < 0)
                        throw new Error('Unidentified institution: ' + acronym);

                    // Make sure we don't run into any 'cant assign property x
                    // of undefined' errors
                    if (this.matrix[courseIndex] === undefined)
                        this.matrix[courseIndex] = [];

                    // Adjust the matrix for the new information
                    this.matrix[courseIndex][institutionIndex] = equivMapping[acronym];
                }

                // Update the parsed courses so that we can prevent multiple
                // requests for the same course
                this.parsedCourses[courseIndex] = parsed;
            });
        }
    }

    public coursesTrackBy(index: number, item: any) {
        return index;
    }
}
