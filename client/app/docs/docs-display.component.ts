import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { DocsService } from './docs.service';

@Component({
    template: `
        <site-header></site-header>
        <main>
            <div class="container" [innerHtml]="content"></div>
        </main>
    `
})
export class DocsDisplayComponent implements OnInit {
    private content: string;

    constructor(
        private route: ActivatedRoute,
        private docs: DocsService
    ) {}

    public ngOnInit() {
        this.route.params
            .switchMap((params: Params) => this.docs.fetch(params.id.toLowerCase()))
            .subscribe((result: string) => {
                this.content = result;
            });
    }
}
