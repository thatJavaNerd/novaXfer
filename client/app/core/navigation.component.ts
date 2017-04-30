import { Component } from '@angular/core';

declare const module: any;

@Component({
    selector: 'navigation',
    templateUrl: './navigation.html',
    styleUrls: [ './navigation.css' ],
    moduleId: module.id
})
export default class NavigationComponent {}
