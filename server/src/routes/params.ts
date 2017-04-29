import { Request } from 'express';
import Parameter = require('pinput');

import { validateCourseNumber, validateSubject } from './api/v1/validation';

export function subjectParam(req: Request) {
    return new Parameter({
        name: 'subject',
        rawInput: req.params.subject,
        validate: validateSubject,
        preprocess: (val) => val.trim(),
        // Make sure we give the query the uppercase value
        postprocess: (val) => val.toUpperCase()
    });
}

export function numberParam(req: Request) {
    return new Parameter({
        name: 'number',
        rawInput: req.params.number,
        validate: validateCourseNumber,
        preprocess: (val) => val.trim(),
        // Make sure we give the query the uppercase value
        postprocess: (val) => val.toUpperCase()
    });
}
