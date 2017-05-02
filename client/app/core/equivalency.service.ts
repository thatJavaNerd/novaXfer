import { Inject, Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import {
    CourseEntry, Institution, InstitutionFocusedEquivalency,
    KeyCourse
} from '../common/api-models';
import { SuccessResponse } from '../common/responses';

import * as _ from 'lodash';

@Injectable()
export class EquivalencyService {
    public constructor(@Inject(Http) private http: Http) {}

    public entry(course: KeyCourse, institution?: string): Promise<CourseEntry> {
        let url = `/api/v1/course/${course.subject}/${course.number}`;
        if (institution !== undefined)
            url += '/' + institution;

        return this.get<CourseEntry>(url);
    }

    public async institutions(): Promise<Institution[]> {
        return this.get<Institution[]>('/api/v1/institution');
    }

    public async forInstitution(institution: string, courses: KeyCourse[]) {
        const courseString = _.join(_.map(courses, (c) => `${c.subject}:${c.number}`), ',');
        const url = `/api/v1/institution/${institution}/${courseString}`;

        return this.get<InstitutionFocusedEquivalency>(url);
    }

    public async forCourse(course: KeyCourse, institutions: string[]): Promise<CourseEntry> {
        const instString = _.join(institutions, ',');
        const url = `/api/v1/course/${course.subject}/${course.number}/${instString}`;

        return this.get<CourseEntry>(url);
    }

    private async get<T>(url: string): Promise<T> {
        return ((await this.http.get(url).toPromise()).json() as SuccessResponse).data;
    }
}
