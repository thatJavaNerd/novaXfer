import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class DocsService {
    public constructor(private http: Http) {}

    public fetch(id: string): Promise<string> {
        return this.http.get('/assets/docs/' + id + '.html')
            .toPromise()
            .then((res: Response) => res.text());
    }
}
