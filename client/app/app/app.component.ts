import { Component, Inject } from '@angular/core';

import 'rxjs/add/operator/toPromise';
import { EquivalencyService } from '../core/equivalency.service';

@Component({
    selector: 'novaxfer',
    template: `
    <input #course (keyup)="courseChange(course.value)" placeholder="Course" />
    <pre>{{ equivalencies | json }}</pre>
    `,
    providers: [ EquivalencyService ]
})
export class AppComponent {
    public equivalencies: any;

    public constructor(@Inject(EquivalencyService) private equiv: EquivalencyService) {}

    public courseChange(course: string): void {
        const parts = course.trim().split(' ');
        if (parts.length !== 2) {
            console.log('Invalid');
            return;
        }

        this.equiv.course(parts[0], parts[1]).then((val: any) => {
            this.equivalencies = val;
        });
    }
}
