## GraphQL API Reference

This guide documents the QMR backend GraphQL surface for integrators and QA. It focuses on available queries/mutations, expected payloads, authorization, and common error patterns.

---

### 1. Access & Headers
- **Endpoint (dev):** `http://localhost:4000/graphql`
- **Transport:** standard GraphQL over HTTP POST; websocket subscriptions are not implemented.
- **Auth:** Send `Authorization: Bearer <JWT>` for authenticated operations. Tokens come from the `login` mutation.
- **Uploads:** Use multipart requests (`Upload` scalar) for file fields such as `profilePicture`.
- **Date handling:** `Date` values use `YYYY-MM-DD`; `DateTime` uses ISO strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).

#### Sample request (curl)
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{ "query": "{ getStudents { id fullname } }" }'
```

---

### 2. Authentication Mutations

#### `login`
```graphql
mutation Login($username: String!, $password: String!, $userType: String!) {
  login(username: $username, password: $password, userType: $userType) {
    success
    message
    token
    user {
      id
      fullname
      role
      createdAt
    }
  }
}
```
- **userType:** `"root" | "admin" | "teacher"` (student login is not implemented).
- **Errors:** returns `success: false` with message for invalid credentials; mutation never throws GraphQL errors for auth failures.

#### Testing root user
- Seeded via `npm run seed:root`.
- Defaults: username `root`, password `Root123!` (override with `ROOT_USERNAME` / `ROOT_PASSWORD` env variables).

---

### 3. Query Reference

| Query | Description | Auth requirements |
| ----- | ----------- | ----------------- |
| `me` | Returns the authenticated user, based on JWT. | Any authenticated user. |
| `getAdmins` / `getAdmin(id)` | List admins or fetch by id. | Root & Admin (admin can only see self). |
| `getTeachers` / `getTeacher(id)` | List teachers or fetch by id. | Root, Admin; Teachers see own profile. |
| `getStudents` / `getStudent(id)` | List/fetch students. | Root, Admin, Teacher (student self-access pending). |
| `getDegrees` / `getDegree(id)` | Degree catalog. | Any authenticated user. |
| `getCourses` / `getCourse(id)` | Course catalog with teacher/degree relations. | Any authenticated user. |
| `getDashboardStats` | Aggregate counts, averages, gender distribution. | Any authenticated user. |

#### Query details
- **`me`**
  - *Args:* none.
  - *Returns:* `UserData` representing the caller (role-aware fields for admins/teachers).
- **`getAdmins`**
  - *Args:* none.
  - *Returns:* `[Admin!]` for all non-deleted admins.
- **`getAdmin(id: ID!)`**
  - *Args:* `id` (admin id).
  - *Returns:* `Admin` or `null` if not found/unauthorized.
- **`getTeachers`**
  - *Args:* none.
  - *Returns:* `[Teacher!]` including related degree summaries.
- **`getTeacher(id: ID!)`**
  - *Args:* `id` (teacher id).
  - *Returns:* `Teacher` or `null`; teachers can only access their own record.
- **`getStudents`**
  - *Args:* none.
  - *Returns:* `[Student!]`; soft-deleted students (`isDeleted=true`) are excluded.
- **`getStudent(id: ID!)`**
  - *Args:* `id` (student id).
  - *Returns:* `Student` or `null`; teachers/admin/root can access any student.
- **`getDegrees`**
  - *Args:* none.
  - *Returns:* `[Degree!]` with linked teachers/courses.
- **`getDegree(id: ID!)`**
  - *Args:* `id` (degree id).
  - *Returns:* `Degree` or `null`.
- **`getCourses`**
  - *Args:* none.
  - *Returns:* `[Course!]` with nested teacher, degrees, students, substitutes.
- **`getCourse(id: ID!)`**
  - *Args:* `id` (course id).
  - *Returns:* `Course` or `null`.
- **`getDashboardStats`**
  - *Args:* none.
  - *Returns:* `DashboardStats` aggregate with counts, averages, and gender distribution.

#### Example: `getDashboardStats`
```graphql
query Dashboard {
  getDashboardStats {
    totalStudents
    activeStudents
    averageStudentAge
    studentGenderDistribution {
      male
      female
      child
    }
    totalTeachers
    activeTeachers
    averageTeacherAge
  }
}
```

---

### 4. Mutation Reference

#### Authentication & profile
- **`login`** — documented in Section 2.
- **`updateProfile(tgUsername?, phone?)`**
  - Allows the current user to change Telegram username and phone.
  - Returns `UpdateProfileResponse` (`success`, `message`, updated `user`).
- **`changePassword(currentPassword!, newPassword!)`**
  - Validates current password and updates to `newPassword`.
  - Returns `ChangePasswordResponse`; `errors` includes validation messages.

#### Admin management
- **`addAdmin`**
  - *Args:* `username`, `password`, `fullname`, `tgUsername`, `birthDate`, `phone`.
  - *Returns:* `AddAdminResponse` with created `Admin`.
  - *Notes:* Phone uses the custom `Phone` scalar (Uzbekistan-style by default).
- **`changeAdmin`**
  - *Args:* `id` plus optional profile fields (`username`, `fullname`, `birthDate`, `phone`, `tgUsername`, `password`, `isActive`).
  - *Returns:* `UpdateAdminResponse`.
  - *Notes:* Admins can only update their own profile; root can update any.
- **`changeAdminActive(adminId, isActive)`**
  - Toggles active status; root-only.
  - *Returns:* `UpdateAdminResponse`.
- **`deleteAdmin(adminId)`**
  - Soft deletion (marks admin as deleted).
  - *Returns:* `DeleteAdminResponse`.

#### Teacher management
- **`addTeacher`**
  - *Args:* `username`, `password`, `fullname`, `tgUsername`, `birthDate`, `phone`, `gender`, optional `profilePicture`, `degreeIds`.
  - *Returns:* `AddTeacherResponse`.
  - *Notes:* Accepts file upload for profile picture; connects degrees by id.
- **`changeTeacher`**
  - *Args:* `id` plus optional profile fields (mirrors `addTeacher`) including `degreeIds`, `isActive`.
  - *Returns:* `UpdateTeacherResponse`.
  - *Notes:* Teachers can only change their own record; root/admin unrestricted.
- **`changeTeacherActive(id, isActive)`**
  - Toggles teacher active status (root/admin).
  - *Returns:* `ChangeTeacherActiveResponse`.
- **`deleteTeacher(id)`**
  - Soft deletion (sets `isDeleted = true`).
  - *Returns:* `DeleteTeacherResponse`.

#### Student management
```graphql
mutation AddStudent($input: AddStudentInput!) {
  addStudent(
    username: $input.username
    password: $input.password
    fullname: $input.fullname
    tgUsername: $input.tgUsername
    birthDate: $input.birthDate
    phone: $input.phone
    gender: $input.gender
    profilePicture: $input.profilePicture
  ) {
    success
    message
    student {
      id
      fullname
      phone
      profilePicture
    }
    errors
  }
}
```
- `phone` accepts any international format; backend normalizes via `checkInternationalPhone`.
- `deleteStudent` performs a soft delete (sets `isDeleted = true`).
- `changeStudent` mirrors `addStudent`, with all fields optional after `id`.
- `changeStudentActive(id, isActive)` toggles active status for a student.

#### Course management
- **`addCourse`**
  - *Args:* `name`, optional `description`, `daysOfWeek`, `gender`, `startAt`, optional `endAt`, `startTime`, `endTime`, `teacherId`, `degreeIds`.
  - *Returns:* `AddCourseResponse` with created `Course`.
  - *Validations:*
    - Unique course name.
    - Teacher exists, active, not deleted.
    - Teacher gender matches course gender.
    - Teacher shares at least one degree in `degreeIds` (ids coerced to integers).
  - *Notes:* See `docs/COURSE_MUTATIONS.md` for request/response samples.

#### Dashboard
- No mutations; all stats are read-only.

---

### 5. Type Reference

#### Core object types
- **`UserData`** — generic user payload returned by `login`/`me`; includes role, `createdAt`, and role-specific fields (`birthDate`, `phone`, `tgUsername`, `isActive`, `department`).
- **`Root`** — minimal representation for root accounts (id, username, fullname, createdAt).
- **`Admin`** — admin profile (`id`, `username`, `fullname`, `birthDate`, `phone`, `tgUsername`, `isActive`, `createdAt`).
- **`Teacher`** — teacher profile including `gender`, optional `profilePicture`, linked `degrees`, active flag, `createdAt`.
- **`Student`** — student profile with optional `phone`, `profilePicture`, `gender`, activity status, `isDeleted`, and timestamps.
- **`Degree`** — academic track with `id`, `name`, linked `teachers` and `courses`, `createdAt`.
- **`Course`** — course metadata (schedule, gender restriction, linked `CourseStudent` enrollments, `teacher`, substitute teachers, `degrees`, `createdAt`).
- **`CourseStudent`** — enrollment join (`course`, `student`, `joinedAt`, `monthlyPayment`, `isActive`, `createdAt`).
- **`SubstituteTeacher`** — substitute assignment with `course`, `teacher`, date range, optional `reason`.
- **`DashboardStats`** — aggregated counts, averages, and gender distributions.
- **`GenderDistribution`** — numeric breakdown (`male`, `female`, `child`).

#### Response wrappers
- `AddAdminResponse`, `UpdateAdminResponse`, `DeleteAdminResponse`
- `AddTeacherResponse`, `UpdateTeacherResponse`, `ChangeTeacherActiveResponse`, `DeleteTeacherResponse`
- `AddStudentResponse`, `UpdateStudentResponse`, `ChangeStudentActiveResponse`, `DeleteStudentResponse`
- `AddCourseResponse`
- `LoginResponse`, `UpdateProfileResponse`, `ChangePasswordResponse`

All response types share the `success`, `message`, optional `errors`, and `timestamp` fields, plus the relevant entity payload.

#### Custom scalars
- **`Date`** — ISO date (`YYYY-MM-DD`).
- **`Phone`** — validated phone numbers (international for students, +998-style for legacy admin/teacher flows).
- **`Upload`** — file uploads (handled via `graphql-upload` middleware).

#### Enums
- **`Gender`** — `MALE`, `FEMALE`, `CHILD`.
- **`DaysOfWeek`** — `MONDAY` … `SUNDAY`.

---

### 6. Permissions & Error Handling
- Authorization uses GraphQL Shield rules (`src/permissions/index.js`). Unauthorized access returns `Not Authorised!` GraphQL errors.
- Mutations return structured payloads with `success`, `message`, optional `errors`, and `timestamp`. Handle both GraphQL errors and payload errors in clients.
- Soft delete pattern: `isDeleted` flags on `Student` and `Teacher`. Queries typically exclude deleted records; verify before surfacing data to end users.

---

### 7. Testing & Tooling
- **GraphiQL:** available at `http://localhost:4000/graphql` in development (`NODE_ENV=development`).
- **Seed scripts:**
  - `npm run seed:root` – ensure test root user.
  - `node scripts/seed-students.js` – generate 100 demo students with profile pictures.
  - `node scripts/seed-degrees-and-teachers.js` – populate degrees and teachers.
- **Database inspection:** `npx prisma studio`.

---

### 8. Troubleshooting
- **401 / Not Authorised:** confirm token presence and role permissions.
- **400 Bad Request:** inspect `errors` array from mutation response; often validation.
- **Schema drift:** run `npx prisma db push` if Prisma schema changes without migration.
- **Uploads failing:** ensure client uses multipart requests and backend `graphql-upload` middleware is active (already configured in `src/app.js`).

---

For additional operations or custom flows, check:
- GraphQL schema files under `src/graphql/schema/`
- Resolver logic under `src/graphql/resolvers/`
- Permission rules under `src/permissions/index.js`

