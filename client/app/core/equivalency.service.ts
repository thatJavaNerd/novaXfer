
import { Inject, Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class EquivalencyService {
    public constructor(@Inject(Http) private http: Http) {}

    public course(subj: string, num: string): Promise<any> {
        return this.http.get(`/api/v1/course/${subj}/${num}`)
            .toPromise()
            .then((res) => res.json().data);
    }
}
