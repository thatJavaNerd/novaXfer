var equivalency = require('./equivalency/equivalency.filter.js');

module.exports = angular.module('core', [])
    .filter('equivalency', equivalency);
