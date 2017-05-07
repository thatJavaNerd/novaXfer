import { expect } from 'chai';
import {
    Course, CourseEquivalencyDocument, EquivType,
    KeyCourse
} from '../common/api-models';
import { SummarizePipe } from './summarize.pipe';

interface SummarizePipeSpec {
    it: string;
    input: Course[];
    output: Course[];
    expectations: {
        direct: string;
        generic: string;
        special: string;
        none: string;
    };
}

const generateCourses = (subject: string, count: number, credits = 3): Course[] => {
    const courses: Course[] = [];
    for (let i = 0; i < count; i++) {
        courses.push({
            subject,
            number: (101 + i).toString(),
            credits
        });
    }

    return courses;
};

const institution = '{acronym}';

const config: { [formatterType: string]: SummarizePipeSpec[]} = {
    succinct: [
        {
            it: 'should format a one-to-many equivalency properly',
            input: generateCourses('ABC', 1),
            output: generateCourses('XYZ', 3),
            expectations: {
                // Direct and generic function the same way
                direct: 'ABC 101 (3 credits) → XYZ 101 (3 credits), XYZ 102 (3 credits), XYZ 103 (3 credits)',
                generic: 'ABC 101 (3 credits) → XYZ 101 (3 credits), XYZ 102 (3 credits), XYZ 103 (3 credits)',
                special: 'Check with ' + institution,
                none: 'Does not transfer'
            }
        },
        {
            it: 'should format a many-to-many equivalency properly',
            input: generateCourses('ABC', 3),
            output: generateCourses('XYZ', 3),
            expectations: {
                // Direct and generic function the same way
                direct: 'ABC 101 (3 credits), ABC 102 (3 credits), ABC 103 (3 credits) → ' +
                        'XYZ 101 (3 credits), XYZ 102 (3 credits), XYZ 103 (3 credits)',
                generic: 'ABC 101 (3 credits), ABC 102 (3 credits), ABC 103 (3 credits) → ' +
                        'XYZ 101 (3 credits), XYZ 102 (3 credits), XYZ 103 (3 credits)',
                special: 'Check with ' + institution,
                none: 'Does not transfer'
            }
        },
        {
            it: 'should handle unknown credits',
            input: generateCourses('ABC', 1, -1),
            output: generateCourses('XYZ', 1, -1),
            expectations: {
                // Direct and generic function the same way
                direct: 'ABC 101 (unknown credits) → XYZ 101 (unknown credits)',
                generic: 'ABC 101 (unknown credits) → XYZ 101 (unknown credits)',
                special: 'Check with ' + institution,
                none: 'Does not transfer'
            }
        }
    ],
    informal: [
        {
            it: 'should format a one-to-many equivalency properly',
            input: generateCourses('ABC', 1),
            output: generateCourses('XYZ', 3),
            expectations: {
                direct: 'directly as XYZ 101, XYZ 102 and XYZ 103',
                generic: 'as a generic XYZ course, a generic XYZ course and a generic XYZ course',
                special: `We're not sure, check with ${institution} about this one.`,
                none: 'Does not transfer'
            }
        },
        {
            it: 'should format a many-to-many equivalency properly',
            input: generateCourses('ABC', 3),
            output: generateCourses('XYZ', 3),
            expectations: {
                direct: 'directly as XYZ 101, XYZ 102 and XYZ 103 when you also take ABC 102 and ABC 103',
                generic: 'as a generic XYZ course, a generic XYZ course and a generic XYZ ' +
                        'course when you also take ABC 102 and ABC 103',
                special: `We're not sure, check with ${institution} about this one.`,
                none: 'Does not transfer'
            }
        }
    ]
};

describe('SummarizePipe', () => {
    const formatterTypes = Object.keys(config);
    for (const formatterType of formatterTypes) {
        let pipe: SummarizePipe;
        beforeEach(`setup for type "${formatterType}"`, () => {
            pipe = new SummarizePipe();
        });

        describe(`"${formatterType}" type`, () => {
            for (const spec of config[formatterType]) {
                it(spec.it, () => {
                    const expectations = Object.keys(spec.expectations);
                    for (const expectationName of expectations) {
                        const equiv: CourseEquivalencyDocument = {
                            institution,
                            type: EquivType[EquivType[expectationName.toUpperCase()]],
                            input: spec.input,
                            output: spec.output
                        };

                        expect(pipe.transform(equiv, formatterType)).to.equal(spec.expectations[expectationName]);
                    }
                });
            }
        });
    }

    it('should throw an Error when given a non-existent formatter name', () => {
        expect(() => { new SummarizePipe().transform(null, 'foo'); }).to.throw(Error, 'No formatter for type \'foo\'');
    });
});

