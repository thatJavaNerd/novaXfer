
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
     * @param output Array of ocurses from `institutionName`
     */
    CourseEquivalency: function CourseEquivalency(input, output, institutionName) {
        this.keyCourse = input[0].stripCredits();
        this.input = input;
        this.output = output;
        this.institutionName = institutionName;
    }
};
