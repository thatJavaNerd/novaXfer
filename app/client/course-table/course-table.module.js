var coreModule = require('../core/core.module.js');
var courseTableComponent = require('./course-table.component.js');

module.exports = angular.module('courseTable', [coreModule.name])
    .component('courseTable', courseTableComponent);
