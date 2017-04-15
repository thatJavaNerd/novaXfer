import {Course, CreditRange, EquivType } from "./models";

const nbsp = String.fromCharCode(160);

/**
 * Replaces all sequences of new line, nbsp, and space characters with a
 * single space and trims.
 */
export function normalizeWhitespace(text: string): string {
    return text.replace(new RegExp(`(?:\r\n|\r|\n|${nbsp}| )+`, 'g'), ' ').trim();
}

/**
 * Attempts to parse one or more lists of credits.
 *
 * "3,3" => [3, 3]
 * "3-4" => [{min: 3, max:4}]
 * "3,1-5,4" => [3, {min: 1, max: 5}, 4]
 * "" => []
 */
export function interpretCreditInput(str: string): Array<number | CreditRange> {
    // Unknown amount of credits
    if (str === '')
        return [];

    const parts = str.replace(' ', '').split(',');
    const credits: Array<number | CreditRange> = [];

    for (let i = 0; i < parts.length; i++) {
        // A hyphen indicates that the credit is a range (ex: "3-4")
        const segment = parts[i];
        if (segment.indexOf('-') != -1) {
            const creditSegments = segment.split('-');
            const a = parseInt(creditSegments[0]);
            const b = parseInt(creditSegments[1]);

            // For some odd reason?
            if (a == b) {
                credits.push(a);
            } else {
                credits.push({
                    min: Math.min(a, b),
                    max: Math.max(a, b)
                });
            }

        } else {
            credits.push(parseInt(segment, 10));
        }
    }

    return credits;
}

/** Returns true if at least one of the courses ends with numberEnding */
export function determineEquivType(courses: Course[], numberEnding = 'XX'): EquivType {
    if (!courses)
        throw new Error('No courses passed');

    let containsGeneric = false;
    for (let course of courses) {
        if (course.number.endsWith(numberEnding)) {
            containsGeneric = true;
            break;
        }
    }

    return containsGeneric ? EquivType.GENERIC: EquivType.DIRECT;
}

