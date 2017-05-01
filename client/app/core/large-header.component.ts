import { Component } from '@angular/core';

declare const module: any;

@Component({
    selector: 'large-header',
    templateUrl: './header.html',
    styleUrls: [ './header.css', './large-header.css' ],
    moduleId: module.id
})
export default class LargeHeaderComponent {}
