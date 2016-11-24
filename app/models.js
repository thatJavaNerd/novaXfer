
module.exports = {
    Course: function Course(subject, number, credits) {
        this.subject = subject;
        this.number = number;
        if (credits !== undefined)
            this.credits = credits;

        this.stripCredits = function() {
            return new Course(subject, number);
        }
    },
    /**
     * Creates a new CourseEquivalency.
     *
     * @param keyCourse Course to perform lookups on. Created with only subject
     *                  and number, no credits
     * @param input Array of courses from NVCC
     * @param output Array of ocurses from `institution`
     */
    CourseEquivalency: function CourseEquivalency(input, output, institution) {
        this.keyCourse = input[0].stripCredits();
        this.input = input;
        this.output = output;
        this.institution = institution;
    },
    Institution: function(acronym, fullName) {
        this.acronym = acronym;
        this.fullName = fullName;
    }
};
