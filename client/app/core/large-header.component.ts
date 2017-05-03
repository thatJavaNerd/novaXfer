import { Component } from '@angular/core';
import { NAVIGATION_MAIN } from './constants';

declare const module: any;

@Component({
    selector: 'large-header',
    templateUrl: './header.html',
    styleUrls: [ './header.css', './large-header.css' ],
    moduleId: module.id
})
export default class LargeHeaderComponent {
    public hrefLinks = NAVIGATION_MAIN.hrefLinks;
    public routerLinks = NAVIGATION_MAIN.routerLinks;
}
