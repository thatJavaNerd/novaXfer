
module.exports = {
    Course: function Course(number, credits) {
        this.number = number;
        this.credits = credits;
    },
    CourseEquivalency: function CourseEquivalency(vccs, other, otherInstitution) {
        this.vccs = vccs;
        this.other = other;
        this.otherInstitution = otherInstitution;
    }
};
