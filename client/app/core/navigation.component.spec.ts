import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { expect } from 'chai';

import { NavigationComponent } from './navigation.component';

describe('NavigationComponent', () => {
    let comp: NavigationComponent;
    let fixture: ComponentFixture<NavigationComponent>;
    let el: DebugElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ RouterTestingModule ],
            declarations: [ NavigationComponent ]
        }).compileComponents();

        fixture = TestBed.createComponent(NavigationComponent);
        comp = fixture.componentInstance;
        el = fixture.debugElement.query(By.css('nav'));
    });

    it('should have no children when no links are given', () => {
        fixture.detectChanges();
        expect(el.children.length).to.equal(0);
    });

    it('should allow binding via routerLinks and normal links', () => {
        comp.routerLinks = [
            { title: 'Foo', href: '/foo' },
            { title: 'Bar', href: '/bar' },
        ];
        comp.hrefLinks = [
            { title: 'Baz', href: '/baz' }
        ];
        fixture.detectChanges();

        const links = el.nativeElement.querySelectorAll('a');
        expect(links.length).to.equal(comp.routerLinks.length + comp.hrefLinks.length);

        for (let i = 0; i < comp.routerLinks.length; i++) {
            expect(links[i].getAttribute('ng-reflect-router-link')).to.equal(comp.routerLinks[i].href);
            expect(links[i].innerHTML).to.equal(comp.routerLinks[i].title);
        }

        for (let i = 0; i < comp.hrefLinks.length; i++) {
            // hrefLinks are added after routerLinks
            const index = comp.routerLinks.length + i;
            expect(links[index].getAttribute('href')).to.equal(comp.hrefLinks[i].href);
            expect(links[index].innerHTML).to.equal(comp.hrefLinks[i].title);
        }
    });
});
