#  API

This document outlines all public API endpoints. All endpoints return `application/json`.

## Subject

### `GET /api/subject/:subject`

Returns an array course entries of all courses which have the subject `:subject`. `:subject` is case insensitive. See the [schema](https://github.com/thatJavaNerd/novaXfer/blob/master/docs/schema.md#course-entry-struct) an example of each element of the array.

#### Examples

`GET /api/subject/MTH`

`GET /api/subject/psy`

## Course

### `GET /api/:course/:institutions`

Returns the course entry for the given course, with `equivalencies` filtered to
only contain the given institutions.

#### Examples

`GET /api/course/ECO 202/VT,GMU,UVA,CNU`

`GET /api/course/MTH 163/GMU,UVA,VT`

## Institution

### `GET /api/institutions`

Returns an array of all available institutions

### `GET /api/institution/:institution/:courses`

Returns a custom struct containing two root fields. `institution` is the from the path parameter. `courses` is an array of course entries.

#### Examples

`GET /api/institution/GMU/ACC 211,MTH 163,CSC 202`

`GET /api/institution/CNU/HIS 101,MTH 174`
