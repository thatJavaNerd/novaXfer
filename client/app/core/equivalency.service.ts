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

    public entry(subj: string, num: string, institution?: string): Promise<CourseEntry> {
        let url = `/api/v1/course/${subj}/${num}`;
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

    private async get<T>(url: string): Promise<T> {
        return ((await this.http.get(url).toPromise()).json() as SuccessResponse).data;
    }
}
