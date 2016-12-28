angular.module('courseTable')
    .component('courseTable', {
        templateUrl: '/partial/course-table',
        controller: ['$scope', '$http', '$q', function CourseTableController($scope, $http, $q) {
            let self = this;

            // Set when an unexpted error occurs
            this.criticalError = null;

            // Create as empty arrays so that one input will be created for the
            // user to start off with
            this.institutions = [''];
            this.input = [''];

            // Input that has had already been sent to the API
            this.displayedInput = [];
            this.displayedInstitutions = [];

            // Used to validate course inputs. Lenient about spaces and case
            this.courseRegex = /^ *[A-Z]{3} +[0-9]{3} *$/i;

            // 2D array representing table data. Initialize it with two empty
            // cells on the first row
            this.data = [[{}, {}]];

            // List of all API-provided institutions
            this.availableInstitutions = [];

            /** Copied from app/util.js */
            this.nbsp = String.fromCharCode(160);

            /**
             * Copied from app/util.js
             *
             * Replaces all sequences of new line, nbsp, and space characters with a
             * single space and trims.
             */
            this.normalizeWhitespace = function(text) {
                return text.replace(new RegExp(`(?:\r\n|\r|\n|${self.nbsp}| )+`, 'g'), ' ').trim();
            };

            /**
             * Displays the data from /api/course/:courses/:institution where
             * :courses is course located at input[rowIndex] and :institutions
             * is a comma-separated list of selected institutions.
             */
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
                            self.data[rowIndex][columnIndex] = [self.prepareUnknownEquivalency()]
                        } else {
                            let equivs = groupedEquivs[institution];

                            // Assign the data to its specific location
                            self.data[rowIndex][columnIndex] = [];
                            for (let equiv of equivs) {
                                self.data[rowIndex][columnIndex].push(self.prepareEquivalency(equiv));
                            }
                        }

                        self.fillEmptyCellsInRow(rowIndex);
                    }
                }).catch(function(err) {
                    $ctrl.criticalError = 'Unable to complete the request'
                    console.error(err);
                });
            };

            /**
             * Populates a column with data from
             * /api/institution/:institution/:courses where :institution is the
             * value at displayedInstitutions[columnIndex] and :courses is a
             * comma-separated list of courses from displayedInput
             */
            this.populateColumn = function(columnIndex) {
                let joinedCourses = self.joinValidCourses();
                if (!joinedCourses)
                    return;

                let url = '/api/institution/' +
                        encodeURIComponent(self.displayedInstitutions[columnIndex]) +
                        '/' + joinedCourses;

                $http.get(url).then(function(data) {
                    data = data.data;

                    for (let i = 0; i < self.displayedInput.length; i++) {
                        let course = self.displayedInput[i];
                        // Hasn't been filled out yet
                        if (!course)
                            continue;

                        let rowIndex = _.findIndex(self.input, o => o && o.toUpperCase() === course.toUpperCase());

                        // Find the appropriate equivalency list for the course
                        // from the data
                        let equivalencyList = _.find(data.courses,
                            c => c.subject + ' ' + c.number === self.normalizeWhitespace(course));

                        if (!equivalencyList) {
                            // No equivalencies for this couse
                            self.data[rowIndex][columnIndex] = [self.prepareUnknownEquivalency()];
                        } else {
                            equivalencyList = equivalencyList.equivalencies;

                            // Assign the data to its specific location
                            self.data[rowIndex][columnIndex] = [];
                            for (let equiv of equivalencyList) {
                                self.data[rowIndex][columnIndex].push(self.prepareEquivalency(equiv));
                            }
                        }
                    }
                }).catch(function(err) {
                    $ctrl.criticalError = 'Unable to complete the request'
                    console.error(err);
                });
            };

            /** Adds another <select> to choose an institution */
            this.addInstitution = function() {
                this.institutions.push('');
                this.fillEmptyCellsInColumn(this.institutions.length - 1);
            };

            /** Adds another <input> for course entry */
            this.addInputCourse = function() {
                this.input.push(null);
                this.fillEmptyCellsInRow(this.input.length - 1);
            };

            /**
             * Populates undefined cells in data[rowIndex] with an empty array
             * so that Angular renders an empty cell
             */
            this.fillEmptyCellsInRow = function(rowIndex) {
                if (!self.data[rowIndex])
                    self.data[rowIndex] = [];
                // Fill in with blank data
                for (let j = 0; j < self.institutions.length; j++)
                    if (!self.data[rowIndex][j])
                        self.data[rowIndex][j] = []
            };

            /** Column version of fillEmptyCellsInRow() */
            this.fillEmptyCellsInColumn = function(columnIndex) {
                for (let j = 0; j < self.input.length; j++)
                    if (!self.data[j][columnIndex])
                        self.data[j][columnIndex] = [];
            }

            /**
             * Join non-empty institutions by a comma to avoid bad API calls
             * when empty cells are present
             */
            this.joinValidInstitutions = function() {
                return _.join(_.filter(this.institutions, o => o.trim() !== ''));
            };

            /** Input version of joinValidInstitutions() */
            this.joinValidCourses = function() {
                return _.join(_.filter(this.displayedInput, o => o && o.trim() !== ''));
            }

            /**
             * Transforms an equivalency to a format that is expected by the
             * template. Resulting object contains two entries.
             *
             * 1. 'muted': The equivalencies input array but with the first
             *     course dropped. Displayed with a 'text-muted' CSS class,
             *     hence the name.
             * 2. 'normal': All output courses
             */
            this.prepareEquivalency = function(equiv) {
                return {
                    muted: this.formatCourseArray(_.drop(equiv.input)),
                    normal: this.formatCourseArray(equiv.output)
                };
            };

            /**
             * Returns {danger: true}. Used by the template to detect when a
             * course has no equivalencies.
             */
            this.prepareUnknownEquivalency = function() {
                return {danger: true};
            }

            this.formatCourseArray = function(courses) {
                return _.join(_.map(courses, c => `${c.subject} ${c.number} (${self.formatCredits(c.credits)} credits)`), ', ');
            };

            this.formatCredits = function(credits) {
                if (credits === -1 || credits === -2) return '?';
                return credits;
            }

            this.inputName = function(index) { return 'input' + index; };
            this.selectName = function(index) { return 'institution' + index; };

            /**
             * Create an object that can be passed to ngClass
             *
             * @param form The table form from course-table.template.pug
             * @param index The index of the <input> within the form
             * @param dangerClass The name of the class to applied for an error
             * @param warningClass The name of the class to applied for a warning
             */
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
             * Creates a styles object using createStylesObject() for <input>
             * elements.
             */
            this.createInputStyleObject = function(form, index) {
                return createStylesObject(form, index, 'has-error', 'has-warning')
            }

            /**
             * createInputStyleObject() but for <tr> elements
             */
            this.createRowStyleObject = function(form, index) {
                return createStylesObject(form, index, 'danger', 'warning')
            }

            // Dynamically get a list of all institutions
            $http.get('/api/institutions').then(function(data) {
                self.availableInstitutions = data.data;
                self.institutions = [self.availableInstitutions[0].acronym, ''];
            });

            // Deep-watch input courses to populate a row when a course
            // becomes valid
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

                    if (inputElement.$invalid) {
                        self.data[i] = [];
                        for (let j = 0; j < self.institutions.length; j++)
                            self.data[i].push([]);
                        self.displayedInput[i] = null;
                        continue;
                    }

                    // $modelValue is only set when it's valid
                    if (!inputElement.$modelValue)
                        continue;

                    let value = inputElement.$modelValue.toUpperCase();

                    if (inputElement.$valid && value !== self.displayedInput[i]) {
                        self.displayedInput[i] = value;
                        self.input[i] = value;
                        self.populateRow(i);
                    }
                }
            });

            // Do the same as the previous $watchCollection, but for
            // institutions and columns
            $scope.$watchCollection('$ctrl.institutions', function(newVal, oldVal) {
                // No scope registered yet
                if (!$scope.tableForm)
                    return;

                for (let i = 0; i < self.institutions.length; i++) {
                    let institution = self.institutions[i];
                    let selectElement = $scope.tableForm[self.selectName(i)];

                    if (!selectElement)
                        break;

                    // if (!selectElement.$modelValue)
                    //     continue;

                    let value = selectElement.$modelValue;

                    if (selectElement.$valid && value !== self.displayedInstitutions[i]) {
                        self.displayedInstitutions[i] = value;
                        self.populateColumn(i);
                    }
                }
            });

            // Automatically add new input rows when the last <input> has text
            $scope.$watch(function() {
                // Find the last <input> available in the form
                if (self.input.length === 0) return 'NO INPUTS';
                let input = $scope.tableForm[self.inputName(self.input.length - 1)];
                if (!input) return undefined;

                // Use $$lastCommittedViewValue rather than $viewValue because
                // $viewValue has to pass through validation before it gets set,
                // we care about the raw input.
                return input['$$lastCommittedViewValue'];
            }, function(newVal, oldVal) {
                if (!newVal)
                    return;

                // oldVal will either be null or an empty string when the
                // new course needs to be created
                if ((oldVal === '' || oldVal === null) && newVal !== '') {
                    self.addInputCourse();
                }
            })
        }],
    });
