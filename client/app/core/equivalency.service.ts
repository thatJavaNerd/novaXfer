import { Inject, Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import * as _ from 'lodash';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class EquivalencyService {
    public constructor(@Inject(Http) private http: Http) {}

    public async for(subj: string, num: string, institution: string): Promise<CourseSummary> {
        try {
            const data = (await this.http.get(`/api/v1/course/${subj}/${num}/${institution}`)
                .toPromise()).json().data;

            return {
                subject: data.subject,
                number: data.number,
                institutions: _.uniq(_.map(data.equivalencies, (e: any) => e.institution)),
                exists: true
            };
        } catch (err) {
            if (err instanceof Response) {
                return {
                    subject: null,
                    number: null,
                    institutions: [],
                    exists: false
                };
            }
            throw err;
        }
    }
}
