import { Component } from '@angular/core';
import { NAVIGATION_MAIN } from './constants';

/**
 * The only difference between this component and LargeHeaderComponent is that
 * LargeHeaderComponent includes 1 more stylesheet that sets the height of the
 * header
 */
@Component({
    selector: 'small-header',
    templateUrl: 'header.pug',
    styleUrls: [ 'header.scss' ],
})
export class SmallHeaderComponent {
    public hrefLinks = NAVIGATION_MAIN.hrefLinks;
    public routerLinks = NAVIGATION_MAIN.routerLinks;
}
