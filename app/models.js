
module.exports = {
    Course: function Course(subject, number, credits) {
        this.subject = subject;
        this.number = number;
        this.credits = credits;
    },
    CourseEquivalency: function CourseEquivalency(nvcc, other, otherInstitution) {
        this.nvcc = nvcc;
        this.other = other;
        this.otherInstitution = otherInstitution;
    }
};
