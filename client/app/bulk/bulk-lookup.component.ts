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
    public availableInstitutions: ReadonlyArray<Institution>;

    public readonly institutions: string[] = [];
    public readonly courses: string[] = [''];

    private courseHelper: PatternHelper<KeyCourse>;

    private parsedCourses: KeyCourse[] = [];

    /**
     * Keeps track of which courses are valid. The validity of a course at
     * this.institutions[i] can be found at this.courseValidities[i].
     */
    private courseValidities: boolean[];

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
        // Initialize to an empty array
        this.parsedCourses = [];
        // Assume all courses are valid by default
        this.courseValidities = _.fill(Array(this.courses.length), true);

        this.equiv.institutions().then((data: Institution[]) => {
            this.availableInstitutions = Object.freeze(data);
            // Add the first institution
            this.addInstitution();
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

                const entry = _.find(data.courses, findFn);
                this.matrix[i][instIndex] = entry === undefined ? null : entry.equivalencies;
            }
        });
    }

    public onChangeCourse(courseIndex: number, course: string) {
        if (courseIndex === this.courses.length - 1 && this.courses[courseIndex] !== '') {
            // Ensure that the last row is always an empty textbox
            this.courses.push('');
        } else if (courseIndex !== this.courses.length - 1 && this.courses[courseIndex] === '') {
            // The user has deleted the contents of the textbox, remove this row
            this.courses.splice(courseIndex, 1);
            this.matrix.splice(courseIndex, 1);
            return;
        }

        // Handle courses that don't match the course regex first
        if (!this.courseHelper.matches(course)) {
            // Set every index to undefined so that nothing gets rendered in
            // the template
            for (let i = 0; i < this.institutions.length; i++) {
                if (this.matrix[courseIndex] === undefined)
                    this.matrix[courseIndex] = [];

                this.matrix[courseIndex][i] = undefined;
            }

            // Let the template know this course is invalid
            this.courseValidities[courseIndex] = false;

            // Unset the current parsed course so that if the user happens to
            // delete one character of the course string and then enter it back
            // this function will still request it
            this.parsedCourses[courseIndex] = undefined;
            return;
        }

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

                const newData = equivMapping[acronym];

                // Adjust the matrix for the new information. The template
                // expects a value of 'null' to mean that there are no institutions,
                // while a value of 'undefined' means that the course hasn't been
                // looked up yet
                this.matrix[courseIndex][institutionIndex] =
                    newData === undefined ? null : newData;
            }

            // Update the parsed courses so that we can prevent multiple
            // requests for the same course
            this.parsedCourses[courseIndex] = parsed;
            this.courseValidities[courseIndex] = true;
        });
    }

    public addInstitution() {
        const findFn = (i: Institution) => !this.institutions.includes(i.acronym);

        // Push the first unused institution or if all of them are being shown,
        // the first institution
        const institution = _.find(this.availableInstitutions, findFn);
        this.institutions.push(
            institution !== undefined ?
                institution.acronym : this.availableInstitutions[0].acronym);
    }

    public trackByIndex(index: number, item: any) {
        return index;
    }
}
