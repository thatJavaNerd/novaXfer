# JSON API

novaXfer uses a JSON API to communicate between the website and the server. The responses look something like this:

```json
{
  "status": 200,
  "data": <anything>
}
```

Similarly, if the request happens to be unsuccessful, the response will look something like this:

```json
{
  "status": <code>,
  "error": <something>
}
```

Since this is the first version of the API, all endpoints can be accessed from `/api/v1/*`.

## Institution

An Institution consists of a few basic properties like name and location, as well as some others. Here's what an Institution for William and Mary could look like:

```json
{
    "_id": "58f6f0b05b4772287303e219",
    "acronym": "W&M",
    "fullName": "William & Mary",
    "location": "Virginia",
    "parseSuccessThreshold": 0.9965
}
```

`parseSuccessThreshold` is the minimum percentage of courses that have to parsed in order to pass the unit test. In this exmaple, we were able to decipher 99.65% of the equivalencies.

### `GET /api/v1/institution`

Pretty simple endpoint. Gets all the Institutions we know about.

### `GET /api/v1/institution/:acronym`

Pretty much the same thing as `GET /api/v1/institution`, but this one only returns the data for one Institution. So if we substitute "W&M" for `:acronym`, we'd get this response:

## Course Entry

Courses are used everywhere in the API, here's one that represents ENG 111:

```json
{
    "subject": "ENG",
    "number": "111",
    "credits": 3
```

A course can also have a variable amount of credits. This example shows the course 'XYZ 123' having anywhere from 1 to 5 credits (which does happen).

```json
{
    "subject": "XYZ",
    "number": "123",
    "credits": {
        "min": 1,
        "max": 5
    }
}
```

A CourseEquivalency defines courses taken at NVCC (input) and what they transfer as (output).

```json
{
    "institution": "VT",
    "type": "direct",
    "input": [
        {
            "subject": "ECO",
            "number": "202",
            "credits": 3
        },
    ],
    "output": [
        {
            "subject": "ECON",
            "number": "2005",
            "credits": 3
        }
    ]
}
```

A CourseEquivalency is one of four types:

1. `"direct"` &mdash; Every course has a specific output course
2. `"generic"` &mdash; At least one output course is not specific (like "HIS 1XX", for example)
3. `"special"` &mdash; The input courses only transfer under certain conditions
4. `"none"` &mdash; The course doesn't transfer at all

This finally brings us to the CourseEntry:

```json
{
    "subject": "ECO",
    "number": "202",
    "equivalencies": [
        {
            "institution": "VT",
            "type": "direct",
            "input": [
                {
                    "subject": "ECO",
                    "number": "202",
                    "credits": 3
                },
            ],
            "output": [
                {
                    "subject": "ECON",
                    "number": "2005",
                    "credits": 3
                }
            ]
        },
        {
            "institution": "UVA",
            "type": "direct",
            "input": [
                {
                    "subject": "ECO",
                    "number": "202",
                    "credits": 3
                }
            ],
            "output": [
                {
                    "subject": "ECON",
                    "number": "2010",
                    "credits": 3,
                }
            ]
        }
    ]
}
```

## `GET /api/v1/course`

<todo>