import {
    Component, Input, OnInit
} from '@angular/core';
import { Response } from '@angular/http';

import { PLACEHOLDER_COURSE } from '../core/constants';
import { EquivalencyService } from '../core/equivalency.service';
import { PatternHelper, PatternService } from '../core/pattern.service';

import {
    CourseEntry, CourseEquivalencyDocument, Institution,
    InstitutionFocusedEquivalency,
    KeyCourse, Semester
} from '../common/api-models';

import * as _ from 'lodash';
import { InstitutionSyncService } from './institution-sync.service';

@Component({
    selector: 'semester',
    templateUrl: 'semester.pug',
    styleUrls: [ 'semester.scss' ]
})
export class SemesterComponent implements OnInit {
    @Input() public model: Semester;
    @Input() public institutions: string[] = [];

    public availableInstitutions: ReadonlyArray<Institution>;

    public courses: string[] = [''];

    public placeholderCourse: string;
    private courseHelper: PatternHelper<KeyCourse>;

    private parsedCourses: KeyCourse[] = [];

    /**
     * Keeps track of which courses are valid. The validity of a course at
     * this.courses[i] can be found at this.courseValidities[i].
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
        private pattern: PatternService,
        private instSync: InstitutionSyncService
    ) {}

    public ngOnInit(): void {
        this.courseHelper = this.pattern.get('course');
        this.parsedCourses = _.clone(this.model.courses);
        this.courses = _.map(this.model.courses, (c) => c.subject + ' ' + c.number);
        // Assume all courses are valid by default
        this.courseValidities = _.fill(Array(this.courses.length), true);
        this.placeholderCourse = PLACEHOLDER_COURSE;

        this.equiv.institutions().then((data: Institution[]) => {
            this.availableInstitutions = Object.freeze(data);
        });

        this.instSync.observable.subscribe((data: [string, number]) => {
            this.updateInstitution(data[1], data[0]);
        });
    }

    public updateInstitution(instIndex: number, acronym: string) {
        if (this.institutions[instIndex] !== acronym)
            this.institutions[instIndex] = acronym;

        this.equiv.forInstitution(acronym, this.parsedCourses).then((data: InstitutionFocusedEquivalency) => {
            for (let i = 0; i < this.parsedCourses.length; i++) {
                const findFn = (c: CourseEntry): boolean =>
                    c.subject === this.parsedCourses[i].subject &&
                        c.number === this.parsedCourses[i].number;

                if (this.matrix[i] === undefined)
                    this.matrix[i] = [];

                if (this.parsedCourses[i] !== undefined) {
                    const entry = _.find(data.courses, findFn);
                    this.matrix[i][instIndex] = entry === undefined ? null : entry.equivalencies;
                } else {
                    this.matrix[i][instIndex] = undefined;
                }
            }
        });
    }

    public onChangeInstitution(instIndex: number, acronym: string) {
        this.updateInstitution(instIndex, acronym);
        this.instSync.onChangeInstitution(acronym, instIndex);
    }

    public onChangeCourse(courseIndex: number, course: string) {
        if (courseIndex === this.courses.length - 1 && this.courses[courseIndex] !== '') {
            // Ensure that the last row is always an empty textbox
            this.courses.push('');
            const index = courseIndex + 1;

            if (this.matrix[index] === undefined)
                this.matrix[index] = [];

            // Fill the matrix row with 'undefined' so that the table gets
            // rendered properly
            for (let instIndex = 0; instIndex < this.institutions.length; instIndex++) {
                this.matrix[index][instIndex] = undefined;
            }
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

            // We normally validate the course after the user leaves the textbox,
            // but we don't want them thinking that the course is invalid when
            // that isn't the case, so update it manually here
            this.courseValidities[courseIndex] = true;
        }).catch((error: any) => {
            if (error instanceof Response) {
                // Silently swallow the error if it's a 404
                if (error.status !== 404) {
                    throw error;
                }

                return;
            }

            throw error;
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

        const index = this.institutions.length - 1;
        this.updateInstitution(index, this.institutions[index]);

        const courseIndex = this.courses.length - 1;
        if (this.matrix[courseIndex] === undefined)
            this.matrix[courseIndex] = [];

        // Set the cell at the bottom right of the matrix to undefined so the
        // table renders correctly
        this.matrix[courseIndex][index] = undefined;
    }

    public removeInstitution(instIndex: number) {
        // Remove from the institutions array
        this.institutions.splice(instIndex, 1);

        // Remove all data for this course from each top-level array in the matrix
        for (let j = 0; j < this.courses.length; j++) {
            if (this.matrix[j] === undefined)
                this.matrix[j] = [];

            this.matrix[j].splice(instIndex, 1);
        }
    }

    public updateValidity(i: number) {
        this.courseValidities[i] = this.courseHelper.matches(this.courses[i]);
    }

    public trackByIndex(index: number, item: any) {
        return index;
    }
}
