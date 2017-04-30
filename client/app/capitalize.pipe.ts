import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'capitalize'
})
export default class CapitalizePipe implements PipeTransform {
    public transform(val: string) {
        return val.charAt(0).toUpperCase() + val.slice(1);
    }
}
