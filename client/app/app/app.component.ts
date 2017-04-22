import { Component, Inject } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Component({
    selector: 'novaxfer',
    template: `
    <input #course (keyup)="courseChange(course.value)" placeholder="Course" />
    <pre>{{ equivalencies | json }}</pre>
    `
})
export class AppComponent {
    public equivalencies: any;

    public constructor(@Inject(Http) private http: Http) {}

    public courseChange(course: string): void {
        const parts = course.trim().split(' ');
        if (parts.length !== 2) {
            console.log('Invalid');
            return;
        }

        this.http.get(`/api/v1/course/${parts[0]}/${parts[1]}`)
            .toPromise()
            .then((res) => {
                this.equivalencies = res.json().data.equivalencies;
            })
            .catch((res) => {
                switch (res.status) {
                    case 404:
                        console.log(res.json());
                        break;
                    case 500:
                        console.log('Server error');
                        break;
                    default:
                        console.log(res);
                }
            });
    }
}
