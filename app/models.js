
module.exports = {
    Course: function Course(subject, number, credits) {
        this.subject = subject;
        this.number = number;
        this.credits = credits;
    },
    CourseEquivalency: function CourseEquivalency(vccs, other, otherInstitution) {
        this.vccs = vccs;
        this.other = other;
        this.otherInstitution = otherInstitution;
    }
};
