import { Pipe, PipeTransform } from '@angular/core';
import {
    Course, CourseEquivalencyDocument,
    EquivType
} from '../common/api-models';

import * as _ from 'lodash';

@Pipe({
    name: 'summarize'
})
export default class SummarizePipe implements PipeTransform {
    public transform(equiv: CourseEquivalencyDocument): string {
        const type = EquivType[equiv.type.toUpperCase()];
        switch (type) {
            // NONE and SPECIAL are pretty straightforward
            case EquivType.NONE:
                return 'Does not transfer';
            case EquivType.SPECIAL:
                return `We're not sure, check with ${equiv.institution} about this one.`;
            // DIRECT and GENERIC require more finesse
            case EquivType.DIRECT:
            case EquivType.GENERIC:
                const prefix = type === EquivType.DIRECT ? 'directly as' : 'as';

                // Format all output courses
                const output = _.map(equiv.output, (c) => SummarizePipe.formatCourse(c, type, false));

                // For now just add the prefix and the output
                let result = prefix + ' ' + SummarizePipe.humanConcat(output);

                // If there's more than 1 output course, add it to the result
                const leftoverInput = _.map(equiv.input.slice(1), (c) => SummarizePipe.formatCourse(c, type, true));
                if (leftoverInput.length > 0) {
                    result += ' when you also take ' + SummarizePipe.humanConcat(leftoverInput);
                }

                return result;
            default:
                throw new Error('Unknown EquivType: ' + equiv.type);
        }
    }

    private static formatCourse(c: Course, type: EquivType, isInputCourse): string {
        if (type === EquivType.NONE || type === EquivType.SPECIAL)
            throw new Error('NONE and SPECIAL aren\'t supported');

        let result: string;

        if (type === EquivType.DIRECT || isInputCourse) {
            result = c.subject + ' ' + c.number;
        } else if (type === EquivType.GENERIC) {
            result = `a generic ${c.subject} course`;
        } else {
            throw new Error('Unknown EquivType: ' + type);
        }

        return result;
    }

    /**
     * Concatenates things the way an English-speaking human would. For example,
     * "first, second, and third" rather than "first, second, third" or "first
     * and second" rather than "first, second".
     */
    private static humanConcat(data: string[]): string {
        if (data.length === 0) return '';

        let result = data[0];

        for (let i = 1; i < data.length; i++) {
            result += i === data.length - 1 ? ' and ' : ', ';
            result += data[i];
        }

        return result;
    }
}
