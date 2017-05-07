import { Component, Input } from '@angular/core';
import { NAVIGATION_MAIN } from './constants';

/**
 * The only difference between this component and LargeHeaderComponent is that
 * LargeHeaderComponent includes 1 more stylesheet that sets the height of the
 * header
 */
@Component({
    selector: 'site-header',
    templateUrl: 'site-header.pug',
    styleUrls: [ 'site-header.scss' ],
})
export class SiteHeaderComponent {
    public hrefLinks = NAVIGATION_MAIN.hrefLinks;
    public routerLinks = NAVIGATION_MAIN.routerLinks;
    @Input() public large = false;
}
