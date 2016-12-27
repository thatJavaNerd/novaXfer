angular.module('courseTable')
    .component('courseTable', {
        templateUrl: '/partial/course-table',
        controller: ['$http', '$q', function CourseTableController($http, $q) {
            // Create as empty arrays so that one input will be created for the
            // user to start off with
            this.institutions = [''];
            this.input = [''];

            // 2D array representing table data
            this.data = [];

            this.fillTable = function() {
                let $ctrl = this;

                let createPromise = function(course) {
                    return new Promise(function(fulfill, reject) {
                        let url = '/api/course/' + encodeURIComponent(course) + '/' + $ctrl.joinValidInstitutions();
                        $http.get(url).then(fulfill).catch(reject);
                    });
                };

                $q.all($ctrl.input.map(course => createPromise(course))).then(function(results) {
                    results = results.map(result => result.data);

                    // Reset the data
                    $ctrl.data = [];
                    for (let inputClass of $ctrl.input) {
                        // Find index of the equivalency list for inputClass
                        let rowIndex = _.findIndex(results, function(o) {
                            return o.subject + ' ' + o.number === inputClass;
                        });

                        let result = results[rowIndex];
                        $ctrl.data[rowIndex] = [];

                        let groupedEquivs = _.groupBy(result.equivalencies, 'institution');

                        for (let i = 0; i < $ctrl.institutions.length; i++) {
                            let institution = $ctrl.institutions[i];
                            if (institution.trim() === '')
                                continue;

                            // No real reason for this variable other than semantics
                            let columnIndex = i;

                            if (!(institution in groupedEquivs)) {
                                // No equivalencies found
                                $ctrl.data[rowIndex][columnIndex] = [{danger: true}]
                            } else {
                                let equivs = groupedEquivs[institution];

                                // Assign the data to its specific location
                                $ctrl.data[rowIndex][columnIndex] = [];
                                for (let equiv of equivs) {
                                    $ctrl.data[rowIndex][columnIndex].push($ctrl.prepareEquivalency(equiv));
                                }
                            }
                        }
                    }
                }).catch(function(err) {
                    // TODO
                    console.error(err);
                })
            };

            this.addInstitution = function() {
                this.institutions.push('');
            };

            this.addInputCourse = function() {
                this.input.push('');
            }

            this.joinValidInstitutions = function() {
                // Avoid bad API calls when empty cells are present
                return _.join(_.filter(this.institutions, o => o.trim() !== ''))
            }

            this.prepareEquivalency = function(equiv) {
                return {
                    muted: this.formatCourseArray(_.drop(equiv.input)),
                    normal: this.formatCourseArray(equiv.output)
                };
            };

            this.formatCourseArray = function(courses) {
                return _.join(_.map(courses, c => c.subject + ' ' + c.number), ', ');
            };
        }],
    });
