import { Component } from '@angular/core';

declare const module: any;

/**
 * The only difference between this component and LargeHeaderComponent is that
 * LargeHeaderComponent includes 1 more stylesheet that sets the height of the
 * header
 */
@Component({
    selector: 'small-header',
    templateUrl: './header.html',
    styleUrls: [ './header.css' ],
    moduleId: module.id
})
export default class SmallHeaderComponent {}
