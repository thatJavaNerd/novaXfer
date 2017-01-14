var angular = require('angular');
var scl = require('./single-course-lookup/scl.module.js');
var courseTable = require('./course-table/course-table.module.js');

angular.module('novaxfer', [
    scl.name,
    courseTable.name
]);
