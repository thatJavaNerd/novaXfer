angular.module('singleCourseLookup')
    .component('singleCourseLookup', {
        templateUrl: '/partial/scl',
        controller: ['$http', function SclController($http) {
            this.course = 'ACC 211';
            this.institution = 'GMU';
            this.result = null;

            this.requestEquiv = function() {
                var self = this;

                var url = `/api/course/${encodeURIComponent(this.course)}/${encodeURIComponent(this.institution)}`
                $http.get(url).then(function(data) {
                    self.result = data.data;
                    self.error = null;
                }).catch(function(err) {
                    self.error = err.data.reason;
                    self.result = null;
                });
            }
        }]
    });
