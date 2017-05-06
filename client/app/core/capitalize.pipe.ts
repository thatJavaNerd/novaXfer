import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {
    public transform(data: any) {
        if (data === null || data === undefined || data === '') return '';
        if (typeof data !== 'string') throw new Error('Need a string, got ' + data);
        if (data.length === 1) return data.charAt(0).toUpperCase();

        return data.charAt(0).toUpperCase() + data.slice(1);
    }
}
