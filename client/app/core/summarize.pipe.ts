import { Pipe, PipeTransform } from '@angular/core';
import {
    Course, CourseEquivalencyDocument, CreditRange,
    EquivType
} from '../common/api-models';

import * as _ from 'lodash';

abstract class EquivalencyFormatter {
    public abstract readonly type: string;
    public format(equiv: CourseEquivalencyDocument): string {
        const type = EquivType[equiv.type.toUpperCase()];
        switch (type) {
            case EquivType.NONE:
                return this.formatTypeNone(equiv);
            case EquivType.SPECIAL:
                return this.formatTypeSpecial(equiv);
            case EquivType.DIRECT:
                return this.formatTypeDirect(equiv);
            case EquivType.GENERIC:
                return this.formatTypeGeneric(equiv);
            default:
                throw new Error('Unknown EquivType: ' + equiv.type);
        }
    }

    protected formatTypeNone(equiv: CourseEquivalencyDocument): string {
        return 'Does not transfer';
    }
    protected abstract formatTypeSpecial(equiv: CourseEquivalencyDocument): string;
    protected abstract formatTypeDirect(equiv: CourseEquivalencyDocument): string;
    protected abstract formatTypeGeneric(equiv: CourseEquivalencyDocument): string;
}

class LongFormatter extends EquivalencyFormatter {
    public readonly type = 'long';

    protected formatTypeSpecial(equiv: CourseEquivalencyDocument): string {
        return `We're not sure, check with ${equiv.institution} about this one.`;
    }

    protected formatTypeDirect(equiv: CourseEquivalencyDocument): string {
        return this.formatTypeGeneric(equiv);
    }

    protected formatTypeGeneric(equiv: CourseEquivalencyDocument): string {
        const type = EquivType[equiv.type.toUpperCase()];
        const prefix = type === EquivType.DIRECT ? 'directly as' : 'as';

        // Format all output courses
        const output = _.map(equiv.output, (c) => LongFormatter.formatCourse(c, type, false));

        // For now just add the prefix and the output
        let result = prefix + ' ' + LongFormatter.humanConcat(output);

        // If there's more than 1 output course, add it to the result
        const leftoverInput = _.map(equiv.input.slice(1), (c) => LongFormatter.formatCourse(c, type, true));
        if (leftoverInput.length > 0) {
            result += ' when you also take ' + LongFormatter.humanConcat(leftoverInput);
        }

        return result;
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

class ShortFormatter extends EquivalencyFormatter {
    public readonly type = 'short';

    protected formatTypeSpecial(equiv: CourseEquivalencyDocument): string {
        return `Check with ${equiv.institution}`;
    }

    protected formatTypeDirect(equiv: CourseEquivalencyDocument): string {
        return this.formatTypeGeneric(equiv);
    }

    protected formatTypeGeneric(equiv: CourseEquivalencyDocument): string {
        return ShortFormatter.formatCourseArray(equiv.input) + ' → ' +
                ShortFormatter.formatCourseArray(equiv.output);
    }

    private static formatCourseArray(ca: Course[]) {
        return _.join(_.map(ca, ShortFormatter.formatCourse), ', ');
    }

    private static formatCourse(c: Course) {
        return `${c.subject} ${c.number} ${ShortFormatter.formatCredits(c.credits)}`;
    }

    private static formatCredits(creds: number | CreditRange) {
        let strVal: string;

        if (typeof creds === 'number') {
            strVal = creds < 0 ? 'unknown' : creds.toString(10);
        } else {
            strVal = creds.min + '-' + creds.max;
        }

        return '(' + strVal + ' credits)';
    }
}

@Pipe({
    name: 'summarize'
})
export default class SummarizePipe implements PipeTransform {
    private static formatters: EquivalencyFormatter[] = [
        new LongFormatter(),
        new ShortFormatter()
    ];

    public transform(equiv: CourseEquivalencyDocument, type = 'long'): string {
        for (const formatter of SummarizePipe.formatters) {
            if (formatter.type === type)
                return formatter.format(equiv);
        }

        throw new Error(`No formatter for type '${type}'`);
    }
}
