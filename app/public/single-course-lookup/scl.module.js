var coreModule = require('../core/core.module.js');
var sclComponent = require('./scl.component.js');

module.exports = angular.module('singleCourseLookup', [coreModule.name])
    .component('singleCourseLookup', sclComponent);
