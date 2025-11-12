## QMR Backend – Frontend Integration Guide

This document gives frontend developers everything needed to consume the QMR GraphQL API: environment setup, authentication flow, key operations, and permission boundaries.

---

### 1. Environment & Access
- **GraphQL endpoint (dev):** `http://localhost:4000/graphql`
- **Health check:** `GET http://localhost:4000/health`
- **Static assets:** `http://localhost:4000/uploads/...`
- **CORS (dev):** allows `http://localhost:3000` and `http://localhost:5173` by default.
- **Auth header:** `Authorization: Bearer <JWT>`
- **Date scalar:** always send/receive ISO-8601 strings (`YYYY-MM-DD` for `Date`, ISO date-time for `DateTime`).
- **File uploads:** multipart requests using the GraphQL `Upload` scalar (e.g. Apollo’s `createUploadLink`).

#### Running the backend locally
```bash
cp .env.example .env          # fill DATABASE_URL, JWT_SECRET, etc.
npm install
npm run dev                   # starts on PORT (default 4000)
```
Useful scripts:
- `npx prisma db push` – sync Prisma schema to the database
- `node scripts/seed-students.js` – seed 100 demo students with profile pictures
- `npx prisma studio` – inspect database data

---

### 2. Authentication & Session Handling
1. Call the `login` mutation with `username`, `password`, and `userType` (`root`, `admin`, or `teacher`).
2. On success you receive `token` (JWT) and basic `user` info.
3. Store the token client-side and send it in the `Authorization` header for subsequent requests.
4. The backend validates tokens for every request and injects the decoded payload into the GraphQL context.

Example:
```graphql
mutation Login($inputUsername: String!, $inputPassword: String!, $type: String!) {
  login(username: $inputUsername, password: $inputPassword, userType: $type) {
    success
    message
    token
    user {
      id
      fullname
      role
    }
  }
}
```

#### Token payload
```json
{
  "id": "<numeric id>",
  "role": "root|admin|teacher",
  "username": "<username>",
  "iat": ...,
  "exp": ...
}
```

---

### 3. Roles & Permissions
Role enforcement uses GraphQL Shield. The matrix below shows which roles can reach each resolver without custom logic on the frontend.

| Operation group | Root | Admin | Teacher | Notes |
| --------------- | ---- | ----- | ------- | ----- |
| `getAdmins`, `getAdmin` | ✅ | ✅ (only own profile for `getAdmin`) | ❌ | |
| `getTeachers`, `getTeacher` | ✅ | ✅ | ✅ (`getTeacher` only self) | |
| `getStudents`, `getStudent` | ✅ | ✅ | ✅ | Student self-access is pending (no student login yet). |
| `getDegrees`, `getDegree` | ✅ | ✅ | ✅ | Any authenticated user. |
| `getCourses`, `getCourse` | ✅ | ✅ | ✅ | Any authenticated user. |
| `getDashboardStats` | ✅ | ✅ | ✅ | Any authenticated user. |
| `addAdmin`, `changeAdmin`, `changeAdminActive`, `deleteAdmin` | ✅ | limited | ❌ | Admins can only mutate their own profile; status changes are Root-only. |
| `addTeacher`, `changeTeacher`, `changeTeacherActive`, `deleteTeacher` | ✅ | ✅ | limited | Teachers can update only their own profile. |
| `addStudent`, `changeStudent`, `changeStudentActive`, `deleteStudent` | ✅ | ✅ | ❌ | Teachers can toggle status but cannot create/update profiles directly. |
| `addCourse` | ✅ | ✅ | ❌ | Only Root/Admin can create courses. |

If a frontend action should be disabled for a role, hide the UI and avoid calling the mutation; the API will still enforce permissions.

---

### 4. Core GraphQL Types

#### Student
```graphql
type Student {
  id: ID!
  username: String!
  fullname: String!
  birthDate: Date!
  phone: String
  tgUsername: String!
  gender: Gender!
  profilePicture: String
  isActive: Boolean!
  isDeleted: Boolean
  createdAt: Date!
}
```

#### Teacher
Includes `degrees`, `gender`, and `profilePicture`.

#### Course
Courses reference a primary `teacher`, have `daysOfWeek`, optional `endAt`, and nested `CourseStudent` records. See `src/graphql/schema/types/course.gql` for full details.

#### DashboardStats
Aggregates totals, active counts, average ages, and gender distribution across students/teachers/admins.

Common enums: `Gender` (`MALE`, `FEMALE`, `CHILD`) and `DaysOfWeek`.

---

### 5. Key Queries & Mutations

#### Fetch students
```graphql
query Students {
  getStudents {
    id
    fullname
    phone
    gender
    isActive
    isDeleted
    profilePicture
  }
}
```
Currently returns every non-deleted student. Implement client-side filtering/pagination as needed.

#### Fetch a student by id
```graphql
query Student($id: ID!) {
  getStudent(id: $id) {
    id
    fullname
    birthDate
    phone
    tgUsername
    gender
    profilePicture
    isActive
    isDeleted
  }
}
```

#### Create a student
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
      profilePicture
    }
    errors
  }
}
```
- `phone` accepts any international format validated server-side.
- `profilePicture` expects a file upload (`Upload` scalar). Provide a file object in your client; the API returns the hosted path (`/uploads/profile-pictures/...`).

#### Update a student
Use `changeStudent` (all fields optional except `id`). To toggle active state quickly, call `changeStudentActive(id, isActive)`. Use `deleteStudent` for soft-delete (`isDeleted: true`).

#### Course operations
- `getCourses` returns basic course info plus nested `teacher`, `degrees`, and enrolled students.
- `getCourse(id)` fetches a single course with the same structure.
- `addCourse` requires:
  - `name`, `daysOfWeek` (`[DaysOfWeek!]!`)
  - `gender` (course gender restriction)
  - `startAt`, `startTime`, `endTime`, optional `endAt`
  - `teacherId`
  - `degreeIds` (will be coerced to integers server-side)
  - The resolver verifies that the teacher is active, not deleted, shares at least one degree, and matches the course gender.

See `docs/COURSE_MUTATIONS.md` for field-by-field guidance and error scenarios.

#### Dashboard stats
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
    teacherGenderDistribution {
      male
      female
      child
    }
    totalAdmins
    activeAdmins
    averageAdminAge
    totalUsers
    activeUsers
  }
}
```

---

### 6. Error Responses & Patterns
- Mutations generally return a structured payload: `{ success, message, <resource>, errors?, timestamp? }`.
- Validation failures populate `errors` with descriptive strings.
- 400-level issues (e.g. Prisma validation) propagate as GraphQL errors. Handle them via the standard `errors` array in the response.
- Auth failures return `null` data and a GraphQL error such as `Not Authorised`.

---

### 7. Data & Assets
- Profile pictures are stored under `/uploads/profile-pictures`. The backend exposes them publicly with long-lived caching.
- Seeded students include realistic international phone numbers and a mix of genders (`MALE`, `FEMALE`, `CHILD`).
- Teachers and students support `isDeleted` for soft deletion; hide these entries on the frontend unless you need an archive view.

---

### 8. Development Tips
- Use GraphiQL (`http://localhost:4000/graphql` in dev) to explore the schema interactively.
- Wrap GraphQL calls with retry or token refresh logic if you add session expiration UX (tokens default to 7 days).
- When integrating uploads, ensure your client includes `apollo-upload-client` or fetch-based multipart handling.
- Keep role-based UI consistent with the permission matrix to avoid triggering authorization errors.

---

Need anything else (e.g., additional sample queries or flow diagrams)? Reach out to the backend team or extend this guide in `docs/`.

