angular.module('core').filter('equivalency', function() {
    let formatCredits = function(credits) {
        if (credits === -1) return '?';
        if (typeof credits === 'object') return `${credits.min}-${credits.max}`;
        return credits;
    };

    let formatCourses = function(courses, type, institution, isInput) {
        let primaryClause = function(course) {
            if (type === 'generic')
                return 'Generic ' + course.subject;
            return course.subject + ' ' + course.number;
        };

        let secondaryCluase = function(credits) {
            if (type === 'special' && !isInput)
                return 'check with ' + institution;
            if (type === 'none' || credits === 0)
                return 'no credit';

            return formatCredits(credits) + ' credits';
        };

        return _.map(courses, c => { return {
            primary: primaryClause(c),
            secondary: secondaryCluase(c.credits)
        }; });
    };

    let transformEquivalency = function(equiv) {
        if (equiv === undefined || equiv.type === 'none')
            return {"willTransfer": false};

        return {
            "willTransfer": true,
            "input": formatCourses(equiv.input, equiv.type, equiv.institution, true),
            "output": formatCourses(equiv.output, equiv.type, equiv.institution)
        };
    };

    // Use _.memoize to make sure we don't create an infinite digest() loop
    return _.memoize(function(equivList) {
        if (!Array.isArray(equivList))
            return [];

        let newArr = [];

        for (let equiv of equivList)
            newArr.push(transformEquivalency(equiv));

        return newArr;
    });
});
