# QMR Backend - Change Summary

This document summarizes recent changes implemented in the backend.

## Permissions
- Root-only restored for `getAdmins`, `getAdmin`.
- Admin and root can `addTeacher`.
- Admin and root can `changeTeacher` for any teacher; teachers can update only themselves.

## GraphQL Resolvers
- addTeacher: fully rewritten
  - Strong validation for username, password, phone (UZ/TR), tgUsername, birthDate
  - Optional `profilePicture: Upload` saved to `/uploads/profile-pictures/...`
  - Normalized inputs; returns structured response
- changeTeacher: updated
  - Returns `UpdateTeacherResponse` (no throws) to avoid 500s
  - Awaits Upload before processing profile picture
  - Validation errors returned in `errors` array
- Degree mutations
  - deleteDegree: disconnects all related teachers before delete (always succeeds)

## Queries
- getTeacher, getTeachers: ensure `degrees` returns `[]` when none

## Schema
- Removed test file upload mutation and its types from `teacher.gql`

## Express / Static
- `/uploads` served with public CORS and long-term caching headers

## Seeding
- Added `scripts/seed-degrees-and-teachers.js`
  - Seeds common degrees if missing
  - Creates ~20 teachers with realistic data and downloaded placeholder photos

## Auth
- JWT verification keeps `iss: qmr-backend`, `aud: qmr-frontend`; ensure valid Bearer token

## Telegram Bot (earlier context)
- Bot initialization, phone-based reset flow, message cleanup behaviors

## Notes
- File uploads must follow GraphQL multipart spec (`operations` + `map` + file parts)
- For profile pictures on update, use multipart request; for no image, omit or set null


