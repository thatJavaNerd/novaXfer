
function regexValidator(s: string, r: RegExp): boolean {
    return r.test(s);
}

// Match 2 to 5 alphabetic characters
export const courseSubjectRegex = /^[A-Z]{2,5}$/;

export function validateSubject(subj: string, strict = false): boolean {
    return regexValidator(strict ? subj : subj.toUpperCase(), courseSubjectRegex);
}

// http://regexr.com/3euqa
export const courseNumberRegex = /^[-\dA-Z#]{2,5}$/;

export function validateCourseNumber(num: string, strict = false): boolean {
    return regexValidator(strict ? num : num.toUpperCase(), courseNumberRegex);
}

// Match only uppercase letters and ampersands throughout the entire string
export const acronymRegex = /^[A-Z&]{2,3}$/;

export function validateInstitutionAcronym(acr: string, strict = false): boolean {
    return regexValidator(strict ? acr : acr.toUpperCase(), acronymRegex);
}
