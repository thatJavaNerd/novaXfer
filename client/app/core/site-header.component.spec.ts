import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { expect } from 'chai';

import { NavigationComponent } from './navigation.component';
import { SiteHeaderComponent } from './site-header.component';

describe('SiteHeaderComponent', () => {
    let comp: SiteHeaderComponent;
    let fixture: ComponentFixture<SiteHeaderComponent>;
    let el: DebugElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ RouterTestingModule ],
            declarations: [ SiteHeaderComponent, NavigationComponent ]
        }).compileComponents();

        fixture = TestBed.createComponent(SiteHeaderComponent);
        comp = fixture.componentInstance;
        el = fixture.debugElement.query(By.css('header'));
    });

    it('should apply a class when [large] is true', () => {
        fixture.detectChanges();
        expect(el.classes['header-large']).to.be.false;

        comp.large = true;
        fixture.detectChanges();
        expect(el.classes['header-large']).to.be.true;
    });
});
