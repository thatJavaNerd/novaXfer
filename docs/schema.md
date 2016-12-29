# Schema

This document outlines common database structs.

## Courses collection

### Course struct

Courses are found everywhere in the `courses` collection.

Here's a basic course representing the course 'XYZ 123' that is worth 3 credit hours:

```json
{
    "subject": "XYZ",
    "number": "123",
    "credits": 3
}
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

### Course equivalency struct

This struct defines courses from NVCC and output courses from the other institution. As an example:

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

Note that `input` and `output` can contain more than one course.

```json
{
    "institution": "VT",
    "type": "direct",
    "input": [
        {
            "subject": "FOR",
            "number": "202",
            "credits": 4
        },
        {
            "subject": "HLT",
            "number": "106",
            "credits": -1
        },
        {
            "subject": "FOR",
            "number": "290",
            "credits": -1
        },
        {
            "subject": "FOR",
            "number": "297",
            "credits": -1
        }
    ],
    "output":[
        {
            "subject": "FREC",
            "number": "3224",
            "credits": 1
        },
        {
            "subject": "FREC",
            "number": "3434",
            "credits": -1
        },
        {
            "subject": "NR",
            "number": "1114",
            "credits": -1
        }
    ]
}
```

The `type` field has four values:

 1. `direct` -- Every course has a specific output course
 2. `generic` -- At least one output course is generic (e.g. 'HIS 1XX')
 3. `special` -- The institution has made a note that this course transfers under certain conditions
 4. `none` -- The course(s) don't transfer

### Course entry struct

The `courses` collection is directly made up of thousands of these structs. Here's an example: this struct shows that ECO 202 will transfer to VT and UVA.

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

Note that the root object doesn't include a `credits` field. The root fields `subject` and `number` are used for identifying the document. The root `subject` and `number` fields are equal to the first course in each equivalency's input array.

## Institutions collections

Institutions are simple.

```json
{
    "acronym": "CNU",
    "fullName": "Christopher Newport University"
}
```
