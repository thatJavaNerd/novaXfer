import { NavigationLink } from './navigation.component';
export const PLACEHOLDER_COURSE = 'ENG 111';

export const NAVIGATION_MAIN: Readonly<{ routerLinks: NavigationLink[], hrefLinks: NavigationLink[] }> = Object.freeze({
    routerLinks: [
        { href: '/home', title: 'Home' },
        { href: '/plan', title: 'Plan' },
        { href: '/docs/api', title: 'API' }
    ],
    hrefLinks: [
        { href: 'https://github.com/thatJavaNerd/novaXfer', title: 'Open Source '}
    ]
});
