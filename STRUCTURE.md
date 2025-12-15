# QMR Backend - Project Structure

## Overview

QMR Backend is a GraphQL API built with Node.js, Express, Prisma, and PostgreSQL. This document provides a comprehensive guide to the project's directory structure, organization principles, and how components interact.

## Directory Structure

```
qmr-backend/
├── docs/                          # Documentation files
├── prisma/                        # Prisma schema and migrations
├── scripts/                       # Utility scripts
├── src/                           # Source code
│   ├── config/                    # Configuration
│   │   └── env.js                 # Environment variables
│   ├── constants/                 # Application constants
│   │   ├── index.js               # Constants aggregator
│   │   ├── messages.js            # Error/success messages
│   │   └── roles.js               # User role definitions
│   ├── database/                  # Database layer
│   │   ├── config.js              # Database configuration
│   │   ├── connection.js          # Database connection setup
│   │   └── index.js               # Database exports
│   ├── examples/                  # Code examples
│   ├── generated/                 # Generated files (Prisma client)
│   │   └── prisma/                # Prisma generated client
│   ├── graphql/                   # GraphQL layer
│   │   ├── index.js               # GraphQL module entry point
│   │   ├── resolvers/             # GraphQL resolvers
│   │   │   ├── helpers/           # Resolver helper functions
│   │   │   │   └── studentSelect.js
│   │   │   ├── mutations/         # Mutation resolvers
│   │   │   │   ├── __tests__/     # Mutation tests
│   │   │   │   ├── addAdmin.js
│   │   │   │   ├── addCourse.js
│   │   │   │   ├── addDegree.js
│   │   │   │   ├── addStudent.js
│   │   │   │   ├── addStudentToCourse.js
│   │   │   │   ├── addTeacher.js
│   │   │   │   ├── changeStudentActiveInCourse.js
│   │   │   │   ├── deleteAdmin.js
│   │   │   │   ├── deleteCourse.js
│   │   │   │   ├── deleteStudent.js
│   │   │   │   ├── deleteTeacher.js
│   │   │   │   ├── index.js       # Mutations aggregator
│   │   │   │   ├── login.js
│   │   │   │   ├── removeStudentFromCourse.js
│   │   │   │   ├── setAttendance.js
│   │   │   │   ├── updateAdmin.js
│   │   │   │   ├── updateAdminActive.js
│   │   │   │   ├── updateCourse.js
│   │   │   │   ├── updatePassword.js
│   │   │   │   ├── updateProfile.js
│   │   │   │   ├── updateStudent.js
│   │   │   │   ├── updateStudentActive.js
│   │   │   │   ├── updateTeacher.js
│   │   │   │   └── updateTeacherActive.js
│   │   │   ├── queries/           # Query resolvers
│   │   │   │   ├── __tests__/     # Query tests
│   │   │   │   ├── getAdmin.js
│   │   │   │   ├── getAdmins.js
│   │   │   │   ├── getAttendances.js
│   │   │   │   ├── getCourses.js
│   │   │   │   ├── getDashboardStats.js
│   │   │   │   ├── getDegrees.js
│   │   │   │   ├── getStudent.js
│   │   │   │   ├── getStudents.js
│   │   │   │   ├── getTeacher.js
│   │   │   │   ├── getTeachers.js
│   │   │   │   ├── index.js       # Queries aggregator
│   │   │   │   └── me.js
│   │   │   ├── types/             # Custom type resolvers
│   │   │   │   ├── course.js
│   │   │   │   └── index.js
│   │   │   └── index.js           # Resolvers aggregator
│   │   └── schema/                # GraphQL schema definitions
│   │       ├── index.js           # Schema aggregator
│   │       ├── mutations/         # Mutation schema definitions
│   │       ├── queries/           # Query schema definitions
│   │       └── types/             # Type schema definitions
│   ├── middleware/                # Express middleware
│   │   ├── auth.js                # Authentication middleware
│   │   ├── error.js               # Error handling middleware
│   │   └── index.js               # Middleware aggregator
│   ├── permissions/               # Authorization layer
│   │   └── index.js               # GraphQL Shield permissions
│   ├── utils/                     # Utility functions
│   │   ├── auth/                  # Authentication utilities
│   │   │   ├── index.js
│   │   │   ├── jwt.js             # JWT token handling
│   │   │   └── password.js        # Password hashing/validation
│   │   ├── telegram/              # Telegram bot integration
│   │   │   └── bot.js
│   │   ├── audit.js               # Audit logging
│   │   ├── checkUser.js           # User validation utilities
│   │   ├── errors.js              # Error handling utilities
│   │   ├── fileUpload.js          # File upload handling
│   │   ├── permissions.js         # Permission checking utilities
│   │   └── regex.js               # Regex patterns
│   ├── app.js                     # Express application setup
│   └── index.js                   # Application entry point
├── tests/                         # Integration and E2E tests
├── uploads/                       # Uploaded files directory
└── STRUCTURE.md                   # This file
```

## Core Components

### Entry Point (`src/index.js`)

The application entry point that:
- Initializes the Express server
- Sets up graceful shutdown handlers
- Handles uncaught exceptions and unhandled rejections
- Initializes the Telegram bot (if configured)

### Application Setup (`src/app.js`)

Configures the Express application:
- GraphQL endpoint setup
- CORS configuration
- Error handling middleware
- Health check endpoint
- Request parsing

### GraphQL Layer (`src/graphql/`)

#### Schema (`src/graphql/schema/`)
- Defines all GraphQL types, queries, and mutations
- Uses GraphQL schema language
- Organized by feature: types, queries, mutations

#### Resolvers (`src/graphql/resolvers/`)
- **Queries**: Read operations (e.g., `getStudents`, `getCourses`)
- **Mutations**: Write operations (e.g., `addStudent`, `updateCourse`)
- **Types**: Custom type resolvers for complex field resolution
- **Helpers**: Shared resolver utilities

Each resolver follows a consistent pattern:
- Input validation
- Permission checks
- Business logic execution
- Database operations
- Error handling
- Audit logging (where applicable)

### Database Layer (`src/database/`)

- **Connection**: Manages Prisma client connection
- **Configuration**: Database connection settings
- Uses Prisma ORM for type-safe database access

### Authentication & Authorization

#### Authentication (`src/utils/auth/`)
- JWT token generation and validation
- Password hashing with bcrypt
- Password strength validation

#### Authorization (`src/permissions/`)
- GraphQL Shield rules
- Role-based access control (Root, Admin, Teacher)
- Field-level and operation-level permissions

#### Middleware (`src/middleware/auth.js`)
- Token extraction from requests
- User context injection
- Request authentication validation

### Constants (`src/constants/`)

- **messages.js**: Centralized error and success messages
- **roles.js**: User role definitions and enums
- **index.js**: Exports all constants

### Utilities (`src/utils/`)

Reusable utility functions:
- **audit.js**: Audit trail logging
- **checkUser.js**: User existence and validation checks
- **errors.js**: Custom error classes and handling
- **fileUpload.js**: File upload processing
- **permissions.js**: Permission checking helpers
- **regex.js**: Shared regex patterns
- **telegram/bot.js**: Telegram bot integration

### Configuration (`src/config/`)

- **env.js**: Environment variable management
- Validates required environment variables
- Provides typed configuration access

## Key Features

### 1. Separation of Concerns

Each layer has a distinct responsibility:
- **GraphQL**: API contract and request/response handling
- **Resolvers**: Business logic and orchestration
- **Database**: Data persistence and queries
- **Utils**: Reusable cross-cutting concerns
- **Middleware**: Request processing pipeline

### 2. Test Organization

Tests are co-located with their corresponding resolvers:
- `__tests__/` folders within `queries/` and `mutations/`
- Integration tests in the `tests/` directory

### 3. Type Safety

- Prisma provides type-safe database access
- GraphQL schema enforces API contract
- JavaScript with JSDoc for documentation

### 4. Error Handling

- Centralized error middleware
- Custom error classes
- Consistent error response format
- Audit logging for errors

### 5. Security

- JWT-based authentication
- Role-based authorization
- Password hashing
- Input validation
- SQL injection prevention (via Prisma)

## Adding New Features

### Adding a New Query

1. Create resolver in `src/graphql/resolvers/queries/`
2. Export from `src/graphql/resolvers/queries/index.js`
3. Add schema definition in `src/graphql/schema/queries/`
4. Import resolver in `src/graphql/resolvers/index.js`
5. Add permissions in `src/permissions/index.js`
6. Write tests in `__tests__/` directory

### Adding a New Mutation

1. Create resolver in `src/graphql/resolvers/mutations/`
2. Export from `src/graphql/resolvers/mutations/index.js`
3. Add schema definition in `src/graphql/schema/mutations/`
4. Import resolver in `src/graphql/resolvers/index.js`
5. Add permissions in `src/permissions/index.js`
6. Add audit logging (if needed)
7. Write tests in `__tests__/` directory

### Adding a New Type

1. Create type resolver in `src/graphql/resolvers/types/`
2. Export from `src/graphql/resolvers/types/index.js`
3. Add schema definition in `src/graphql/schema/types/`
4. Import type resolver in `src/graphql/resolvers/index.js`

## Import Patterns

### GraphQL Module
```javascript
import { schema } from "./graphql/index.js";
```

### Resolvers
```javascript
// From queries
import { getStudents, getCourses } from "./graphql/resolvers/queries/index.js";

// From mutations
import { addStudent, updateCourse } from "./graphql/resolvers/mutations/index.js";
```

### Database
```javascript
import { prisma } from "./database/index.js";
```

### Utilities
```javascript
import { hashPassword, verifyPassword } from "./utils/auth/password.js";
import { generateToken, verifyToken } from "./utils/auth/jwt.js";
import { checkPermission } from "./utils/permissions.js";
```

### Constants
```javascript
import { ROLES, MESSAGES } from "./constants/index.js";
```

## Development Workflow

1. **Schema First**: Define GraphQL schema before implementing resolvers
2. **Test Driven**: Write tests alongside resolver implementation
3. **Permission First**: Define permissions before marking as complete
4. **Audit Logging**: Add audit logs for all mutation operations
5. **Error Handling**: Use custom error classes for consistent responses

## Best Practices

1. **Single Responsibility**: Each file should have one clear purpose
2. **DRY Principle**: Extract shared logic into utilities
3. **Error Handling**: Always handle errors explicitly
4. **Validation**: Validate inputs at the resolver level
5. **Logging**: Log important operations and errors
6. **Type Safety**: Leverage Prisma's type safety
7. **Permissions**: Check permissions early in resolver execution
8. **Documentation**: Keep this structure document updated

## Notes

- The `generated/` directory contains Prisma client code and should not be manually edited
- The `uploads/` directory is used for file uploads and should be excluded from version control
- Tests use both Jest and custom test runners (check individual test files)
- Telegram bot integration is optional and can be disabled

This structure provides a scalable, maintainable foundation for the QMR Backend application.
