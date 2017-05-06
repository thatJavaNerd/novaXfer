import { Component } from '@angular/core';
import { NAVIGATION_MAIN } from './constants';

@Component({
    selector: 'large-header',
    templateUrl: 'header.pug',
    styleUrls: [ 'header.scss', 'large-header.scss' ],
})
export class LargeHeaderComponent {
    public hrefLinks = NAVIGATION_MAIN.hrefLinks;
    public routerLinks = NAVIGATION_MAIN.routerLinks;
}
