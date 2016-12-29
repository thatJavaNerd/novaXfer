angular.module('singleCourseLookup')
    .component('singleCourseLookup', {
        templateUrl: '/partial/scl',
        controller: ['$scope', '$http', function SclController($scope, $http) {
            let self = this;

            this.course = '';
            this.institution = null;
            this.result = null;

            // Used to validate course inputs. Lenient about spaces and case
            this.courseRegex = /^ *[A-Z]{3} +[0-9]{3} *$/i;

            this.availableInstitutions = [];

            this.requestEquiv = function() {
                var url = `/api/course/${encodeURIComponent(this.course.toUpperCase())}/${encodeURIComponent(this.institution)}`;
                $http.get(url).then(function(data) {
                    self.result = data.data;
                }).catch(function(err) {
                    self.error = err.data.reason;
                });
            };

            this.createCourseStyleObject = function() {
                let styles = {};
                let control = $scope.sclForm.course;

                if (control.$touched) {
                    if (control.$error.required) {
                        // Only warning empty
                        styles['has-warning'] = true;
                    } else {
                        // Whine otherwise
                        styles['has-error'] = control.$invalid;
                    }
                }
                return styles;
            }

            // Dynamically get a list of all institutions
            $http.get('/api/institutions').then(function(data) {
                self.availableInstitutions = data.data;
            });

            $scope.$watch('$ctrl.course', function() {
                if ($scope.sclForm.course.$valid)
                    self.course = self.course.toUpperCase();
            });

            $scope.$watchCollection(function() {
                return [self.course, self.institution];
            }, function(newVal, oldVal) {
                let form = $scope.sclForm;
                // Forms are 'valid' if they're pristine so make sure the form
                // isn't pristine and valid
                if (!form.$pristine && form.$valid) {
                    self.requestEquiv();
                } else {
                    self.result = null;
                }
            });
        }]
    });
