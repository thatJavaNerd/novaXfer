import { expect } from 'chai';

import CapitalizePipe from '../app/capitalize.pipe';

describe('CapitalizePipe', () => {
    let pipe: CapitalizePipe;

    beforeEach(() => {
        pipe = new CapitalizePipe();
    });

    it('should capitalize the first letter', () => {
        expect(pipe.transform('abc')).to.equal('Abc');
    });

    it('should return an empty string for null or undefined values', () => {
        expect(pipe.transform(null)).to.equal('');
        expect(pipe.transform(undefined)).to.equal('');
    });

    it('should throw an error when given a non-string', () => {
        const invalids = [true, {}, 42];
        for (const inv of invalids) {
            expect(() => pipe.transform(inv)).to.throw(Error);
        }
    });

    it('should capitalize strings with length of 1', () => {
        expect(pipe.transform('a')).to.equal('A');
    });

    it('should handle empty strings', () => {
        expect(pipe.transform('')).to.equal('');
    });
});
