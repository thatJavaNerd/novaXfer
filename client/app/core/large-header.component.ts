import { Component } from '@angular/core';

declare const module: any;

@Component({
    selector: 'large-header',
    templateUrl: './large-header.html',
    styleUrls: [ './large-header.css' ],
    moduleId: module.id
})
export default class LargeHeaderComponent {}
