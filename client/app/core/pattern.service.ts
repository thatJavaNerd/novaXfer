import { Injectable } from '@angular/core';
import { KeyCourse } from '../common/api-models';
import { ValidatorFn, Validators } from '@angular/forms';

/**
 * The PatternService helps with validating and parsing input strings with the
 * help of regular expressions.
 */
@Injectable()
export class PatternService {
    private static readonly CONF: Array<PatternConfiguration<any>> = [
        {
            pattern: /^ *([A-Z]{3}) +([0-9]{3}) *$/i,
            name: 'course',
            normalizeWhitespace: true,
            transform: (parsed: string[]): KeyCourse => ({
                subject: parsed[0].toUpperCase(),
                number: parsed[1].toUpperCase()
            })
        }
    ];

    private readonly helpers: Array<PatternHelper<any>> = [];

    private static readonly whitespacePattern = new RegExp(`(?:\r\n|\r|\n|\t| )+`, 'g');

    public constructor() {
        // Create a PatternHelper for each configuration specified
        for (const conf of PatternService.CONF) {
            this.helpers.push(new PatternHelper(Object.freeze(conf)));
        }
    }

    public get(name: string): PatternHelper<any> {
        for (const helper of this.helpers) {
            if (helper.config.name === name)
                return helper;
        }

        throw new Error(`No PatternHelper for name '${name}'`);
    }

    /**
     * Replaces all groups of carriage returns, line feeds, and spaces with a
     * single space and trims the result
     */
    public static normalizeWhitespace(text) {
        return text.replace(PatternService.whitespacePattern, ' ').trim();
    }
}

interface PatternConfiguration<T> {
    pattern: RegExp;
    name: string;

    /** Whether or not whitespace should be normalized before attempting to parse */
    normalizeWhitespace: boolean;
    transform: (parsed: string[]) => T;
}

/** Pretty straightforward class that assists in validating and parsing string input */
export class PatternHelper<T> {
    public constructor(public readonly config: PatternConfiguration<T>) {}

    /**
     * Tests if the regular expression from this helper's configuration matches
     * the given input string
     */
    public matches(input: string) {
        return this.config.pattern.test(input);
    }

    /**
     * Returns output from all capture groups from this helper's regular
     * expression
     *
     * @param input
     * @returns T
     */
    public parse(input: string): T {
        const adjustedInput = this.config.normalizeWhitespace ?
            PatternService.normalizeWhitespace(input) :
            input;

        return this.config.transform(adjustedInput.match(this.config.pattern).slice(1));
    }

    public validator(): ValidatorFn {
        return Validators.pattern(this.config.pattern);
    }
}
