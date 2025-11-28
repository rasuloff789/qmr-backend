# Set Attendance - Complete Guide

This guide shows you how to:
1. Get available courses
2. Get enrolled students for a course
3. Set attendance for students

## 1. Get All Available Courses

Query to fetch all courses with their enrolled students:

```graphql
query GetCoursesWithStudents {
  getCourses {
    id
    name
    description
    daysOfWeek
    gender
    startAt
    endAt
    startTime
    endTime
    teacher {
      id
      fullname
      username
    }
    students {
      id
      isActive
      student {
        id
        fullname
        username
        gender
        phone
        tgUsername
        isActive
      }
    }
    createdAt
  }
}
```

## 2. Get a Specific Course with Enrolled Students

Query to get a single course and its enrolled students:

```graphql
query GetCourseWithStudents($courseId: ID!) {
  getCourse(id: $courseId) {
    id
    name
    description
    daysOfWeek
    gender
    startAt
    endAt
    startTime
    endTime
    teacher {
      id
      fullname
      username
    }
    students {
      id
      isActive
      joinedAt
      monthlyPayment
      student {
        id
        fullname
        username
        gender
        phone
        tgUsername
        profilePicture
        isActive
      }
    }
    createdAt
  }
}
```

**Variables:**
```json
{
  "courseId": "1"
}
```

## 3. Get Only Active Enrolled Students

If you want to filter only active students on the frontend:

```graphql
query GetCourseActiveStudents($courseId: ID!) {
  getCourse(id: $courseId) {
    id
    name
    students {
      id
      isActive
      student {
        id
        fullname
        username
        gender
        isActive
      }
    }
  }
}
```

Then filter in your frontend:
```javascript
const activeStudents = course.students
  .filter(enrollment => enrollment.isActive && enrollment.student.isActive)
  .map(enrollment => enrollment.student);
```

## 4. Set Attendance for a Student

### Basic Example

```graphql
mutation SetAttendance($courseId: ID!, $studentId: ID!, $date: Date!, $isPresent: Boolean!) {
  setAttendance(
    courseId: $courseId
    studentId: $studentId
    date: $date
    isPresent: $isPresent
  ) {
    success
    message
    attendance {
      id
      date
      isPresent
      notes
      course {
        id
        name
      }
      student {
        id
        fullname
        username
      }
      createdAt
    }
    errors
    timestamp
  }
}
```

**Variables:**
```json
{
  "courseId": "1",
  "studentId": "5",
  "date": "2024-01-15",
  "isPresent": true
}
```

### With Notes

```graphql
mutation SetAttendanceWithNotes(
  $courseId: ID!
  $studentId: ID!
  $date: Date!
  $isPresent: Boolean!
  $notes: String
) {
  setAttendance(
    courseId: $courseId
    studentId: $studentId
    date: $date
    isPresent: $isPresent
    notes: $notes
  ) {
    success
    message
    attendance {
      id
      date
      isPresent
      notes
      course {
        id
        name
      }
      student {
        id
        fullname
      }
    }
    errors
  }
}
```

**Variables:**
```json
{
  "courseId": "1",
  "studentId": "5",
  "date": "2024-01-15",
  "isPresent": false,
  "notes": "Absent - sick"
}
```

## 5. Complete Workflow Example

### Step 1: Get Course and Students

```graphql
query GetCourseForAttendance($courseId: ID!) {
  getCourse(id: $courseId) {
    id
    name
    daysOfWeek
    students {
      id
      isActive
      student {
        id
        fullname
        username
        gender
        isActive
      }
    }
  }
}
```

### Step 2: Set Attendance for Multiple Students

```graphql
mutation SetMultipleAttendance(
  $attendance1: SetAttendanceInput!
  $attendance2: SetAttendanceInput!
  $attendance3: SetAttendanceInput!
) {
  attendance1: setAttendance(
    courseId: $attendance1.courseId
    studentId: $attendance1.studentId
    date: $attendance1.date
    isPresent: $attendance1.isPresent
    notes: $attendance1.notes
  ) {
    success
    message
    attendance {
      id
      student {
        fullname
      }
      isPresent
    }
  }
  
  attendance2: setAttendance(
    courseId: $attendance2.courseId
    studentId: $attendance2.studentId
    date: $attendance2.date
    isPresent: $attendance2.isPresent
    notes: $attendance2.notes
  ) {
    success
    message
    attendance {
      id
      student {
        fullname
      }
      isPresent
    }
  }
  
  attendance3: setAttendance(
    courseId: $attendance3.courseId
    studentId: $attendance3.studentId
    date: $attendance3.date
    isPresent: $attendance3.isPresent
    notes: $attendance3.notes
  ) {
    success
    message
    attendance {
      id
      student {
        fullname
      }
      isPresent
    }
  }
}
```

**Note:** GraphQL doesn't support arrays in mutations directly. You'll need to call `setAttendance` multiple times or use a batch mutation if you create one.

## 6. Frontend Implementation Example (React/Apollo)

```javascript
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

// Query to get course with students
const GET_COURSE = gql`
  query GetCourse($courseId: ID!) {
    getCourse(id: $courseId) {
      id
      name
      students {
        id
        isActive
        student {
          id
          fullname
          username
          isActive
        }
      }
    }
  }
`;

// Mutation to set attendance
const SET_ATTENDANCE = gql`
  mutation SetAttendance(
    $courseId: ID!
    $studentId: ID!
    $date: Date!
    $isPresent: Boolean!
    $notes: String
  ) {
    setAttendance(
      courseId: $courseId
      studentId: $studentId
      date: $date
      isPresent: $isPresent
      notes: $notes
    ) {
      success
      message
      attendance {
        id
        date
        isPresent
        notes
        student {
          id
          fullname
        }
      }
      errors
    }
  }
`;

function AttendanceComponent({ courseId }) {
  const { data, loading, error } = useQuery(GET_COURSE, {
    variables: { courseId },
  });

  const [setAttendance] = useMutation(SET_ATTENDANCE, {
    refetchQueries: [{ query: GET_COURSE, variables: { courseId } }],
  });

  const handleSetAttendance = async (studentId, date, isPresent, notes) => {
    try {
      const result = await setAttendance({
        variables: {
          courseId,
          studentId,
          date,
          isPresent,
          notes,
        },
      });

      if (result.data.setAttendance.success) {
        console.log('Success:', result.data.setAttendance.message);
        // The message will indicate if other students were auto-marked as absent
      }
    } catch (err) {
      console.error('Error setting attendance:', err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const activeStudents = data.getCourse.students
    .filter((enrollment) => enrollment.isActive && enrollment.student.isActive)
    .map((enrollment) => enrollment.student);

  return (
    <div>
      <h2>{data.getCourse.name}</h2>
      <h3>Enrolled Students ({activeStudents.length})</h3>
      <ul>
        {activeStudents.map((student) => (
          <li key={student.id}>
            {student.fullname} ({student.username})
            <button
              onClick={() =>
                handleSetAttendance(
                  student.id,
                  new Date().toISOString().split('T')[0],
                  true,
                  null
                )
              }
            >
              Mark Present
            </button>
            <button
              onClick={() =>
                handleSetAttendance(
                  student.id,
                  new Date().toISOString().split('T')[0],
                  false,
                  'Absent'
                )
              }
            >
              Mark Absent
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 7. Important Notes

### Auto-Creation Feature
When you set attendance for one student, the system **automatically creates attendance records** for all other enrolled students (marked as absent) if they don't have records for that date. This ensures complete attendance coverage.

**Response Example:**
```json
{
  "success": true,
  "message": "Attendance recorded successfully. Automatically created 4 missing attendance record(s) for other students (marked as absent).",
  "attendance": { ... },
  "errors": []
}
```

### Date Format
- Use ISO 8601 format: `"YYYY-MM-DD"` (e.g., `"2024-01-15"`)
- Or full ISO datetime: `"2024-01-15T00:00:00Z"`

### Date Validation
- Date must match one of the course's `daysOfWeek`
- Date must be within course `startAt` and `endAt` range
- Date cannot be before course start date

### Authorization
- **Root users**: Can set attendance for any course
- **Teacher users**: Can only set attendance for courses they are assigned to teach
- **Admin users**: Can set attendance for any course (if permissions allow)

## 8. Error Handling

### Common Errors

**Invalid Date:**
```json
{
  "success": false,
  "message": "Invalid attendance date",
  "errors": ["The attendance date (SUNDAY) does not match any of the course's scheduled days: MONDAY, WEDNESDAY, FRIDAY"]
}
```

**Student Not Enrolled:**
```json
{
  "success": false,
  "message": "Student not enrolled",
  "errors": ["Student is not enrolled in this course or enrollment is inactive"]
}
```

**Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": ["You can only set attendance for courses you are assigned to teach"]
}
```

## 9. Quick Reference

### Minimal Query to Get Students
```graphql
query GetStudents($courseId: ID!) {
  getCourse(id: $courseId) {
    students {
      student {
        id
        fullname
      }
    }
  }
}
```

### Minimal Mutation to Set Attendance
```graphql
mutation SetAttendance($courseId: ID!, $studentId: ID!, $date: Date!, $isPresent: Boolean!) {
  setAttendance(courseId: $courseId, studentId: $studentId, date: $date, isPresent: $isPresent) {
    success
    message
  }
}
```

## 10. Using with cURL

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation { setAttendance(courseId: \"1\", studentId: \"5\", date: \"2024-01-15\", isPresent: true) { success message attendance { id student { fullname } } } }"
  }'
```

