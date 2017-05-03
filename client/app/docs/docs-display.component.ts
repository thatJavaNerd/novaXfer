import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
    template: `
        <small-header></small-header>
        <main>
            <p>{{ docName }}</p>
        </main>
    `
})
export class DocsDisplayComponent implements OnInit {
    private docName: string;

    constructor(
        private route: ActivatedRoute
    ) {}

    public ngOnInit() {
        this.route.params
            .subscribe((params: Params) => {
                this.docName = params.id.toLowerCase();
            });
    }
}
