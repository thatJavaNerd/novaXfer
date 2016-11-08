
module.exports = {
    Course: function Course(number, credits) {
        this.number = number;
        this.credits = credits;
    },
    CourseEquivalency: function CourseEquivalency(vccs, other, otherCollegeName) {
        this.vccs = vccs;
        this.other = other;
        this.otherCollegeName = otherCollegeName;
    }
}
