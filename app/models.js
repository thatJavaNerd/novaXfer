
module.exports = {
    Course: function Course(subject, number, credits) {
        this.subject = subject;
        this.number = number;
        this.credits = credits;
    },
    /**
     * Creates a new CourseEquivalency.
     *
     * @param keyCourse Course to perform lookups on. Created with only subject
     *                  and number, no credits
     * @param input Array of courses from NVCC
     * @param output Array of ocurses from `institution`
     * @param type Equivalency type. Must be a value specified by models.TYPE_*
     */
    CourseEquivalency: function CourseEquivalency(input, output, type) {
        this.keyCourse = new module.exports.Course(input[0].subject, input[0].number);
        this.input = input;
        this.output = output
        this.type = type;
    },
    EquivalencyContext: function EquivalencyContext(institution, equivalencies) {
        this.institution = institution;
        this.equivalencies = equivalencies;
    },
    Institution: function(acronym, fullName) {
        this.acronym = acronym;
        this.fullName = fullName;
    },
    // No information about credits given
    CREDITS_UNKNOWN: -1,
    // A student should check with the university for further clarificaiton
    CREDITS_UNCLEAR: -2
};
