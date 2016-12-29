angular.module('singleCourseLookup')
    .component('singleCourseLookup', {
        templateUrl: '/partial/scl',
        controller: ['$http', function SclController($http) {
            let self = this;

            this.course = 'ACC 211';
            this.institution = 'GMU';
            this.result = null;

            this.availableInstitutions = [];

            // Dynamically get a list of all institutions
            $http.get('/api/institutions').then(function(data) {
                self.availableInstitutions = data.data;
                self.institutions = [self.availableInstitutions[0].acronym, ''];
            });

            this.requestEquiv = function() {
                var self = this;

                var url = `/api/course/${encodeURIComponent(this.course)}/${encodeURIComponent(this.institution)}`;
                $http.get(url).then(function(data) {
                    self.result = data.data;
                    self.error = null;
                }).catch(function(err) {
                    self.error = err.data.reason;
                    self.result = null;
                });
            };

            // Dynamically get a list of all institutions
            $http.get('/api/institutions').then(function(data) {
                self.availableInstitutions = data.data;
            });
        }]
    });
