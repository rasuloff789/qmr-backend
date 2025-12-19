# Error Codes (Frontend Reference)

This document lists **machine-readable error codes** returned by GraphQL mutation response payloads via the optional `code` field.

## How to use

- Always read `success` first.
- If `success === false`, read `code` and map it to UI/translation keys.
- `message` and `errors[]` are still returned for human/debug purposes, but should not be used for branching logic.

## Teacher (`updateTeacher`) codes

| Code | When it happens |
|------|------------------|
| `TEACHER_NOT_FOUND` | Teacher id does not exist |
| `TEACHER_USERNAME_INVALID` | Username fails validation |
| `TEACHER_USERNAME_TAKEN` | Username already exists |
| `TEACHER_BIRTHDATE_INVALID` | Birthdate format invalid |
| `TEACHER_PHONE_INVALID` | Phone format invalid |
| `TEACHER_TG_USERNAME_INVALID` | Telegram username invalid |
| `TEACHER_PASSWORD_WEAK` | Password does not meet policy |
| `TEACHER_PROFILE_PICTURE_UPLOAD_FAILED` | Upload processing fails |
| `TEACHER_DEGREES_CONFLICT_ACTIVE_COURSE` | Attempted to remove degree(s) required by active course(s) taught by this teacher |
| `NO_FIELDS_TO_UPDATE` | Update called with no fields |
| `TEACHER_UPDATE_FAILED` | Unexpected failure (catch-all) |

## Student (`updateStudent`) codes

| Code | When it happens |
|------|------------------|
| `STUDENT_NOT_FOUND` | Student id does not exist |
| `STUDENT_USERNAME_INVALID` | Username fails validation |
| `STUDENT_USERNAME_TAKEN` | Username already exists |
| `STUDENT_BIRTHDATE_INVALID` | Birthdate format invalid |
| `STUDENT_PHONE_INVALID` | Phone format invalid |
| `STUDENT_TG_USERNAME_INVALID` | Telegram username invalid |
| `STUDENT_PASSWORD_WEAK` | Password does not meet policy |
| `STUDENT_PROFILE_PICTURE_UPLOAD_FAILED` | Upload processing fails |
| `STUDENT_DEGREES_EMPTY` | `possibleDegrees` is empty or invalid |
| `STUDENT_DEGREE_IDS_INVALID` | One or more degree IDs are invalid |
| `STUDENT_DEGREES_CONFLICT_ACTIVE_ENROLLMENT` | Attempted to remove degree(s) needed by at least one active enrollment course requirement |
| `NO_FIELDS_TO_UPDATE` | Update called with no fields |
| `STUDENT_UPDATE_FAILED` | Unexpected failure (catch-all) |

## Notes

- `code` is optional and may be `null` for older resolvers that haven’t been fully migrated yet.
- We can continue rolling this out to all mutations (courses/admin/auth/degree/attendance) the same way.

---

## Course codes

| Code | When it happens |
|------|------------------|
| `COURSE_ID_REQUIRED` | Missing `courseId` |
| `COURSE_ID_INVALID` | `courseId` is not a valid number |
| `COURSE_NOT_FOUND` | Course not found |
| `COURSE_DELETE_BLOCKED_ENROLLMENTS` | Deleting course is blocked because it still has enrollments |
| `COURSE_DELETE_FAILED` | Unexpected failure deleting course |
| `COURSE_NAME_REQUIRED` | Missing course name (create) |
| `COURSE_NAME_EMPTY` | Empty course name (update) |
| `COURSE_NAME_TAKEN` | Course name already exists |
| `COURSE_DAYS_OF_WEEK_REQUIRED` | Missing daysOfWeek |
| `COURSE_REQUIRED_FIELDS` | Missing teacherId and/or degreeIds (create) |
| `COURSE_DEGREES_REQUIRED` | Missing degreeIds (update) |
| `COURSE_DEGREE_IDS_INVALID` | Invalid/empty degreeIds list |
| `COURSE_DEGREE_IDS_NOT_FOUND` | Some degree IDs do not exist |
| `TEACHER_ID_INVALID` | Invalid teacherId |
| `TEACHER_NOT_FOUND_OR_INACTIVE` | Teacher not found or inactive when updating course |
| `COURSE_TEACHER_GENDER_MISMATCH` | Teacher gender cannot teach course gender |
| `COURSE_TEACHER_DEGREE_MISMATCH` | Teacher has no matching degree for course degree requirements |
| `COURSE_UPDATE_FAILED` | Unexpected failure updating course |
| `COURSE_CREATE_FAILED` | Unexpected failure creating course |

## Enrollment / course-student codes

| Code | When it happens |
|------|------------------|
| `ENROLLMENT_REQUIRED_FIELDS` | Missing courseId/studentId |
| `ENROLLMENT_IDS_INVALID` | Invalid courseId or studentId |
| `ENROLLMENT_MONTHLY_PAYMENT_INVALID` | monthlyPayment <= 0 |
| `ENROLLMENT_GENDER_MISMATCH` | Student gender does not match course gender |
| `ENROLLMENT_DEGREE_MISMATCH` | Student has no matching degree for course |
| `ENROLLMENT_ALREADY_EXISTS` | Student already enrolled |
| `ENROLLMENT_NOT_FOUND` | Enrollment not found |
| `ENROLLMENT_ALREADY_REMOVED` | Enrollment already soft-deleted |
| `ENROLLMENT_CREATE_FAILED` | Unexpected failure enrolling student |
| `ENROLLMENT_REMOVE_FAILED` | Unexpected failure removing student |

## Attendance codes

| Code | When it happens |
|------|------------------|
| `ATTENDANCE_REQUIRED_FIELDS` | Missing courseId/studentId/date |
| `ATTENDANCE_IS_PRESENT_INVALID` | isPresent is not boolean |
| `AUTH_REQUIRED` | Not authenticated |
| `ATTENDANCE_UNAUTHORIZED_NOT_COURSE_TEACHER` | Teacher tries to set attendance for another teacher’s course |
| `ATTENDANCE_UNAUTHORIZED_ROLE` | Role is not allowed to set attendance |
| `ATTENDANCE_DATE_NOT_ON_SCHEDULE` | Date is not on course daysOfWeek |
| `ATTENDANCE_DATE_BEFORE_COURSE_START` | Date is before course startAt |
| `ATTENDANCE_DATE_AFTER_COURSE_END` | Date is after course endAt |
| `STUDENT_NOT_FOUND_OR_INACTIVE` | Student not found/inactive (setAttendance) |
| `STUDENT_NOT_ENROLLED_OR_INACTIVE` | Student not enrolled or enrollment inactive (setAttendance) |
| `ATTENDANCE_SET_FAILED` | Unexpected failure setting attendance |

## Admin codes

| Code | When it happens |
|------|------------------|
| `ADMIN_ID_INVALID` | Invalid adminId |
| `ADMIN_NOT_FOUND` | Admin not found |
| `ADMIN_USERNAME_INVALID` | Username fails validation |
| `ADMIN_USERNAME_TAKEN` | Username already exists |
| `ADMIN_PASSWORD_WEAK` | Password policy fails |
| `ADMIN_PHONE_INVALID` | Phone invalid |
| `ADMIN_TG_USERNAME_INVALID` | Telegram username invalid |
| `ADMIN_BIRTHDATE_INVALID` | Birthdate invalid |
| `ADMIN_CREATE_FAILED` | Unexpected failure creating admin |
| `ADMIN_DELETE_FAILED` | Unexpected failure deleting admin |
| `ADMIN_IS_ACTIVE_INVALID` | isActive is not boolean |
| `ADMIN_ACTIVE_UPDATE_FAILED` | Unexpected failure toggling admin active |
| `ADMIN_UPDATE_FAILED` | Unexpected failure updating admin |

## Auth/self-service codes

| Code | When it happens |
|------|------------------|
| `LOGIN_MISSING_FIELDS` | Missing username/password/userType |
| `LOGIN_USER_TYPE_INVALID` | Invalid userType |
| `LOGIN_ACCOUNT_DEACTIVATED` | Account is inactive |
| `LOGIN_USER_NOT_FOUND` | User not found |
| `LOGIN_INVALID_CREDENTIALS` | Wrong username/password |
| `LOGIN_SERVER_ERROR` | Unexpected login failure |
| `PASSWORD_WEAK` | New password policy fails |
| `PASSWORD_SAME_AS_CURRENT` | New password equals current password |
| `CURRENT_PASSWORD_INCORRECT` | Current password is incorrect |
| `PASSWORD_UPDATE_FAILED` | Unexpected failure changing password |
| `PROFILE_UPDATE_FAILED` | Unexpected failure updating profile |
| `PHONE_INVALID` | Phone invalid (updateProfile) |
| `TG_USERNAME_INVALID` | Telegram username invalid (updateProfile) |
| `ROOT_PROFILE_UPDATE_FORBIDDEN` | Root user cannot update profile fields |

## Degree codes

| Code | When it happens |
|------|------------------|
| `DEGREE_NAME_REQUIRED` | Missing degree name |
| `DEGREE_NAME_EMPTY` | Empty degree name on update |
| `DEGREE_NAME_TAKEN` | Degree name already exists |
| `DEGREE_NOT_FOUND` | Degree not found |
| `DEGREE_CREATE_FAILED` | Unexpected failure creating degree |
| `DEGREE_UPDATE_FAILED` | Unexpected failure updating degree |
| `DEGREE_DELETE_FAILED` | Unexpected failure deleting degree |


