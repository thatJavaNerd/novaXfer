import { Component, Input } from '@angular/core';

@Component({
    selector: 'navigation',
    templateUrl: 'navigation.pug',
    styleUrls: [ 'navigation.scss' ],
})
export class NavigationComponent {
    @Input() public routerLinks: NavigationLink[] = [];
    @Input() public hrefLinks: NavigationLink[] = [];
}

export interface NavigationLink {
    href: string;
    title: string;
}
