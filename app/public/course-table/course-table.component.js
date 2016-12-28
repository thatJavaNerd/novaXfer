angular.module('courseTable')
    .component('courseTable', {
        templateUrl: '/partial/course-table',
        controller: ['$scope', '$http', '$q', function CourseTableController($scope, $http, $q) {
            let self = this;

            // Create as empty arrays so that one input will be created for the
            // user to start off with
            this.institutions = [''];
            this.input = [''];

            // Input that has had already been sent to the API
            this.displayedInput = [];

            // Used to validate course inputs. Lenient about spaces and case
            this.courseRegex = /^ *[A-Z]{3} +[0-9]{3} *$/i;

            // 2D array representing table data
            this.data = [];

            // List of all API-provided institutions
            this.availableInstitutions = [];

            this.fillTable = function() {
                let $ctrl = this;

                let createPromise = function(course) {
                    return new Promise(function(fulfill, reject) {
                        let url = '/api/course/' + encodeURIComponent(course) + '/' + $ctrl.joinValidInstitutions();
                        $http.get(url).then(fulfill).catch(reject);
                    });
                };


                let validInputList = _.filter($ctrl.input, input => input);
                $q.all(_.map(validInputList, course => createPromise(course))).then(function(results) {
                    results = results.map(result => result.data);

                    // Reset the data
                    $ctrl.data = [];
                    for (let inputClass of validInputList) {
                        // Since validInputList is a filtered list, we need two
                        // indexes, one for the results (which is derived from
                        // the filtered list) and one for the grid data
                        let resultsIndex = _.findIndex(results, function(o) {
                            return o.subject + ' ' + o.number === inputClass.toUpperCase();
                        });

                        let rowIndex = _.findIndex($ctrl.input, function(o) {
                            return o.toUpperCase() === inputClass.toUpperCase();
                        });

                        let result = results[resultsIndex];
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
                });
            };

            this.populateRow = function(rowIndex) {
                let url = '/api/course/' +
                        encodeURIComponent(self.displayedInput[rowIndex]) +
                        '/' + self.joinValidInstitutions();

                $http.get(url).then(function(data) {
                    data = data.data;

                    // Reset
                    self.data[rowIndex] = [];
                    let groupedEquivs = _.groupBy(data.equivalencies, 'institution');

                    for (let i = 0; i < self.institutions.length; i++) {
                        let institution = self.institutions[i];
                        if (institution.trim() === '')
                            continue;

                        // No real reason for this variable other than semantics
                        let columnIndex = i;

                        if (!(institution in groupedEquivs)) {
                            // No equivalencies found
                            self.data[rowIndex][columnIndex] = [{danger: true}]
                        } else {
                            let equivs = groupedEquivs[institution];

                            // Assign the data to its specific location
                            self.data[rowIndex][columnIndex] = [];
                            for (let equiv of equivs) {
                                self.data[rowIndex][columnIndex].push(self.prepareEquivalency(equiv));
                            }
                        }
                    }
                }).catch(function(err) {
                    // TODO
                    console.error(err);
                });
            }

            this.addInstitution = function() {
                this.institutions.push('');
            };

            this.addInputCourse = function() {
                this.input.push(null);
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

            this.inputName = function(index) { return 'input' + index; };

            let createStylesObject = function(form, index, dangerClass, warningClass) {
                let styles = {};
                let control = form[self.inputName(index)];

                if (control.$touched) {
                    if (control.$error.required) {
                        // Only warning empty
                        styles[warningClass] = true;
                    } else {
                        // Whine otherwise
                        styles[dangerClass] = control.$invalid;
                    }
                }
                return styles;
            }

            /**
             * Create an object that can be passed to ngClass
             *
             * @param form The table form from course-table.template.pug
             * @param index The index of the <input> within the form
             */
            this.createInputStyleObject = function(form, index) {
                return createStylesObject(form, index, 'has-error', 'has-warning')
            }

            this.createRowStyleObject = function(form, index) {
                return createStylesObject(form, index, 'danger', 'warning')
            }

            // Dynamically get a list of all institutions
            $http.get('/api/institutions').then(function(data) {
                self.availableInstitutions = data.data;
                self.institutions = [self.availableInstitutions[0].acronym, ''];
            });

            $scope.$watchCollection('$ctrl.input', function(newVal, oldVal) {
                // Form scope hasn't been registered yet
                if (!$scope.tableForm)
                    return;

                for (let i = 0; i < self.input.length; i++) {
                    let inputCourse = self.input[i];
                    let inputElement = $scope.tableForm[self.inputName(i)];

                    // Form scope hasn't been registered yet
                    if (!inputElement)
                        break;

                    // $modelValue is only set when it's valid
                    if (!inputElement.$modelValue)
                        continue;
                    console.log(inputElement);
                    let value = inputElement.$modelValue.toUpperCase();

                    if (inputElement.$valid && value !== self.displayedInput[i]) {
                        self.displayedInput[i] = value;
                        self.populateRow(i);
                    }
                }
            })
        }],
    });
