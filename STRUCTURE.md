# QMR Backend - Project Structure

## 📁 Current Project Structure

```
src/
├── config/
│   └── env.js                 # Environment configuration
├── database/
│   └── index.js              # Database connection and utilities
├── graphql/
│   ├── index.js              # Centralized GraphQL module
│   ├── schema/
│   │   └── index.js          # GraphQL schema definition
│   └── resolvers/
│       ├── index.js          # Resolver aggregator
│       ├── queries/          # Query resolvers
│       │   ├── index.js
│       │   ├── getAdmins.js
│       │   ├── getAdmin.js
│       │   ├── getTeachers.js
│       │   ├── getTeacher.js
│       │   └── me.js
│       └── mutations/        # Mutation resolvers
│           ├── index.js
│           ├── addAdmin.js
│           ├── addTeacher.js
│           ├── changeAdmin.js
│           ├── changeAdminActive.js
│           ├── changeTeacher.js
│           ├── deleteAdmin.js
│           └── login.js
├── permissions/
│   └── index.js              # GraphQL Shield permissions
├── utils/
│   ├── auth/                 # Authentication utilities
│   ├── permissions.js       # Permission checking utilities
│   └── audit.js             # Audit logging utilities
├── middleware/
│   └── error.js             # Error handling middleware
├── app.js                   # Express application setup
└── index.js                 # Application entry point
```

## 🎯 Benefits of This Structure

### 1. **Clean Separation of Concerns**
- **GraphQL**: All GraphQL-related code in one place
- **Database**: Database connection and utilities
- **Authentication**: Auth logic and utilities
- **Permissions**: Access control logic
- **Middleware**: Express middleware

### 2. **Organized Resolvers**
- **Queries**: All read operations in `graphql/resolvers/queries/`
- **Mutations**: All write operations in `graphql/resolvers/mutations/`
- **Centralized**: Single import point for all resolvers

### 3. **Maintainable Code**
- **Single Responsibility**: Each file has one clear purpose
- **Easy Navigation**: Logical file organization
- **Scalable**: Easy to add new resolvers or features

## 🔧 Import Structure

### Main Application
```javascript
// app.js
import { schema } from "./graphql/index.js";
```

### GraphQL Module
```javascript
// graphql/index.js
import { schema } from "./schema/index.js";
import { resolvers } from "./resolvers/index.js";
import { permissions } from "../permissions/index.js";
```

### Resolvers
```javascript
// graphql/resolvers/index.js
import { getAdmins, getAdmin, ... } from "./queries/index.js";
import { login, addAdmin, ... } from "./mutations/index.js";
```

## 📈 Migration Benefits

### Before (Old Structure)
```
src/
├── modules/
│   ├── queries/
│   ├── mutations/
│   └── index.js
├── graphql/
│   └── schema/
└── permissions/
```

### After (New Structure)
```
src/
├── graphql/
│   ├── schema/
│   └── resolvers/
│       ├── queries/
│       └── mutations/
└── permissions/
```

### Key Improvements
1. **✅ Centralized GraphQL**: All GraphQL code in one directory
2. **✅ Better Organization**: Resolvers grouped by type (queries/mutations)
3. **✅ Cleaner Imports**: Single import point for GraphQL
4. **✅ Easier Maintenance**: Logical file structure
5. **✅ Scalable**: Easy to add new resolvers

## 🚀 Usage

### Adding New Query Resolver
1. Create file in `src/graphql/resolvers/queries/`
2. Export from `src/graphql/resolvers/queries/index.js`
3. Import in `src/graphql/resolvers/index.js`

### Adding New Mutation Resolver
1. Create file in `src/graphql/resolvers/mutations/`
2. Export from `src/graphql/resolvers/mutations/index.js`
3. Import in `src/graphql/resolvers/index.js`

### Accessing GraphQL
```javascript
// Single import for complete GraphQL setup
import { schema } from "./graphql/index.js";
```

This structure provides a clean, maintainable, and scalable foundation for the QMR Backend application.
