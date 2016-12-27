angular.module('courseTable')
    .component('courseTable', {
        templateUrl: '/partial/course-table',
        controller: ['$http', '$q', function CourseTableController($http, $q) {
            this.institutions = ['GMU', 'VT', 'CNU', 'UVA'];
            this.input = ['FOR 202', 'ACC 212'];
            this.data = [];

            this.fillTable = function() {
                let $ctrl = this;

                let createPromise = function(course) {
                    return new Promise(function(fulfill, reject) {
                        let url = '/api/course/' + encodeURIComponent(course) + '/' + $ctrl.institutions.join(',');
                        $http.get(url).then(fulfill).catch(reject);
                    });
                };

                $q.all($ctrl.input.map(course => createPromise(course))).then(function(results) {
                    results = results.map(result => result.data);
                    console.log(results);

                    // Reset
                    $ctrl.data = [];
                    for (let inputClass of $ctrl.input) {
                        // Find index of the equivalency list for inputClass
                        let rowIndex = _.findIndex(results, function(o) { return o.subject + ' ' + o.number === inputClass; });
                        let result = results[rowIndex];
                        $ctrl.data[rowIndex] = [[{normal: inputClass}]];

                        let groupedEquivs = _.groupBy(result.equivalencies, 'institution');
                        console.log(groupedEquivs);

                        for (let i = 0; i < $ctrl.institutions.length; i++) {
                            let institution = $ctrl.institutions[i];
                            // The first index is the input class which is
                            // already assigned
                            let columnIndex = i + 1;

                            if (!(institution in groupedEquivs)) {
                                $ctrl.data[rowIndex][columnIndex] = [{danger: true}]
                            } else {
                                let equivs = groupedEquivs[institution];

                                $ctrl.data[rowIndex][columnIndex] = [];
                                for (let equiv of equivs) {
                                    $ctrl.data[rowIndex][columnIndex].push($ctrl.prepareEquivalency(equiv));
                                }

                            }

                            console.log($ctrl.data);

                        }

                        // for (let i = 0; i < $ctrl.institutions.length; i++) {
                        //     let institution = $ctrl.institutions[i];
                        //     // Find all equivalencies from given institution
                        //     let equivs = _.groupBy(result.equivalencies, 'institution')
                        //     // The first index is the input class which is
                        //     // already assigned
                        //     let columnIndex = i + 1;
                        //
                        //     // $ctrl.data[rowIndex][columnIndex] = _.map(equivs, $ctrl.prepareEquivalency);
                        //     $ctrl.data[rowIndex][columnIndex] = [];
                        //     console.log(equivs);
                        //     for (let j = 0; j < equivs.length; j++) {
                        //         // $ctrl.data[rowIndex][columnIndex] is an array
                        //         // of equivalencies, each element being an object
                        //         // with a `normal` and `muted` property.
                        //         $ctrl.data[rowIndex][columnIndex][j] = $ctrl.prepareEquivalency(equivs[j]);
                        //     }
                        // }
                    }
                }).catch(function(err) {
                    // TODO
                    console.error(err);
                })
            };

            this.prepareEquivalency = function(equiv) {
                console.log(equiv);
                console.log('prepare');
                return {
                    muted: this.formatCourseArray(_.drop(equiv.input)),
                    normal: this.formatCourseArray(equiv.output)
                };
            }

            this.formatCourseArray = function(courses) {
                return _.join(_.map(courses, c => c.subject + ' ' + c.number), ', ');
            }
        }],
    });
