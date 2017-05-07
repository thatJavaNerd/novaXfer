import { Component } from '@angular/core';

@Component({
    selector: 'home',
    template: `
        <site-header [large]="true"></site-header>
        <main>
            <simple-preview></simple-preview>
        </main>
    `
})
export class HomeComponent {}
