import { Component, Input } from '@angular/core';

declare const module: any;

@Component({
    selector: 'navigation',
    templateUrl: './navigation.html',
    styleUrls: [ './navigation.css' ],
    moduleId: module.id
})
export class NavigationComponent {
    @Input() public routerLinks: NavigationLink[] = [];
    @Input() public hrefLinks: NavigationLink[] = [];
}

export interface NavigationLink {
    href: string;
    title: string;
}
