# QMR Backend

A production-ready GraphQL API backend for a Quran Memorization and Recitation (QMR) management system. Built with Node.js, Express, Prisma ORM, and PostgreSQL.

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.x
- **API**: GraphQL (graphql-http)
- **ORM**: Prisma 6.x
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, graphql-shield
- **File Uploads**: graphql-upload
- **Testing**: Jest
- **Telegram Integration**: node-telegram-bot-api

### Project Structure
```
src/
├── config/              # Environment configuration
├── database/            # Prisma client and connection management
├── graphql/             # GraphQL schema and resolvers
│   ├── schema/         # GraphQL schema definitions (.gql files)
│   └── resolvers/      # Query and mutation resolvers
│       ├── queries/    # Read operations
│       ├── mutations/  # Write operations
│       └── types/      # Custom type resolvers
├── middleware/          # Express middleware (auth, error handling)
├── permissions/         # GraphQL Shield permission rules
├── utils/              # Utility functions (auth, audit, file upload)
└── index.js            # Application entry point
```

See [STRUCTURE.md](./STRUCTURE.md) for detailed architecture documentation.

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- PostgreSQL 12+ (running locally or remote)
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd qmr-backend
npm install
```

2. **Configure environment variables**
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/qmr_database"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="10d"

# CORS Configuration
# Comma-separated list of allowed origins (defaults to production origins if not set)
CORS_ORIGINS="https://admin.elli.uz,https://root.elli.uz,https://teacher.elli.uz,https://qomar.elli.uz,https://studio.apollographql.com,http://localhost:5173,http://localhost:5174"

# Security
BCRYPT_ROUNDS=10

# Root User (optional, for seeding)
ROOT_USERNAME=root
ROOT_PASSWORD=Root123!
```

3. **Set up the database**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed root user
npm run seed:root
```

4. **Start development server**
```bash
npm run dev
```

The GraphQL endpoint will be available at `http://localhost:4000/graphql`

## 📚 Development Guide

### Available Scripts

#### Development
```bash
npm run dev          # Start development server with hot reload
npm start            # Start production server
```

#### Database Management
```bash
npm run db:generate  # Generate Prisma client after schema changes
npm run db:push      # Push schema changes to database (dev only)
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio (database GUI)
```

#### Seeding
```bash
npm run seed:root              # Create root user
npm run seed:admin             # Create mock admin user
npm run seed:users             # Seed users
npm run seed:teachers          # Seed degrees and teachers
npm run seed:students-degrees  # Add degrees to students
npm run seed:attendances       # Seed attendance records
```

#### Testing
```bash
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report
npm run test:mutations      # Test mutation resolvers only
npm run test:queries        # Test query resolvers only
npm run test:all            # Run integration tests
```

### Development Workflow

#### Adding a New Query
1. Create resolver in `src/graphql/resolvers/queries/yourQuery.js`
2. Export from `src/graphql/resolvers/queries/index.js`
3. Add query definition in `src/graphql/schema/queries/`
4. Import in `src/graphql/resolvers/index.js`
5. Add permission rule in `src/permissions/index.js`

#### Adding a New Mutation
1. Create resolver in `src/graphql/resolvers/mutations/yourMutation.js`
2. Export from `src/graphql/resolvers/mutations/index.js`
3. Add mutation definition in `src/graphql/schema/mutations/`
4. Import in `src/graphql/resolvers/index.js`
5. Add permission rule in `src/permissions/index.js`

#### Database Schema Changes
1. Edit `prisma/schema.prisma`
2. Create migration: `npm run db:migrate`
3. Generate client: `npm run db:generate`
4. Update GraphQL schema if needed

### Code Organization

#### GraphQL Schema
- Schema files are split by domain (admin, auth, course, student, teacher, etc.)
- Located in `src/graphql/schema/`
- Uses `.gql` files for type definitions

#### Resolvers
- **Queries**: Read-only operations in `src/graphql/resolvers/queries/`
- **Mutations**: Write operations in `src/graphql/resolvers/mutations/`
- Each resolver is a separate file for maintainability
- Type resolvers in `src/graphql/resolvers/types/` for complex field resolution

#### Permissions
- Centralized in `src/permissions/index.js`
- Uses GraphQL Shield for rule-based access control
- Supports role-based permissions (Root, Admin, Teacher)

#### Authentication
- JWT tokens issued on login
- Middleware in `src/middleware/auth.js` validates tokens
- Utilities in `src/utils/auth/` for password hashing and JWT operations

## 🔐 Security Features

- **JWT Authentication**: Token-based auth with configurable expiration
- **Password Hashing**: bcrypt with configurable rounds
- **Role-Based Access Control**: GraphQL Shield permissions
- **Input Validation**: Custom GraphQL scalars and validation
- **CORS Protection**: Configurable origin whitelist
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **Audit Logging**: Track user actions (see `src/utils/audit.js`)

## 🗄️ Database

### Models
- **Root**: System administrator
- **Admin**: Administrative users
- **Teacher**: Course instructors
- **Student**: Course participants
- **Course**: Class sessions with schedules
- **Degree**: Academic levels
- **Attendance**: Student attendance records
- **CourseStudent**: Many-to-many relationship between courses and students

### Migrations
- Migrations are versioned in `prisma/migrations/`
- Always create migrations for schema changes: `npm run db:migrate`
- Never edit existing migrations manually

### Prisma Studio
Access the database GUI:
```bash
npm run db:studio
```

## 📖 API Documentation

### GraphQL Endpoint
- **Development**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

### Documentation
See [docs/README.md](./docs/README.md) for complete documentation index.

**Essential Guides:**
- [GraphQL API Reference](./docs/GRAPHQL_API.md) - Complete API documentation
- [Frontend Integration Guide](./docs/FRONTEND_GUIDE.md) - Frontend developer guide
- [Permissions Reference](./docs/PERMISSIONS_REFERENCE.md) - Access control details
- [File Upload Guide](./docs/AXIOS_FILE_UPLOAD_GUIDE.md) - File upload implementation
- [Monthly Payment Guide](./docs/MONTHLY_PAYMENT_CHANGE_GUIDE.md) - Billing best practices

### Authentication
Send JWT token in Authorization header:
```bash
Authorization: Bearer <token>
```

### Example Query
```graphql
query {
  me {
    id
    fullname
    role
  }
}
```

### Example Mutation
```graphql
mutation Login($username: String!, $password: String!, $userType: String!) {
  login(username: $username, password: $password, userType: $userType) {
    success
    token
    user {
      id
      fullname
      role
    }
  }
}
```

## 🧪 Testing

### Test Structure
- Unit tests for resolvers in `src/graphql/resolvers/*/__tests__/`
- Test helpers in `tests/helpers/`
- Integration tests in `scripts/`

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test suites
npm run test:queries
npm run test:mutations
```

### Writing Tests
- Use Jest for testing
- Mock Prisma client for unit tests
- Use test helpers from `tests/helpers/testHelpers.js`
- Follow existing test patterns in `__tests__/` directories

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret for JWT signing | Required |
| `JWT_EXPIRES_IN` | Token expiration | `10d` |
| `CORS_ORIGIN` | Allowed CORS origin | Required |
| `BCRYPT_ROUNDS` | Password hashing rounds | `10` |

### Database Connection
Prisma handles connection pooling automatically. Configuration in `src/database/config.js`.

## 🐛 Debugging

### Logs
- Application logs to console
- Error middleware catches and formats GraphQL errors
- Audit logs track user actions

### Common Issues

**Database connection errors**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check network/firewall settings

**Prisma client not found**
- Run `npm run db:generate` after schema changes

**Permission denied errors**
- Check user role in JWT token
- Verify permission rules in `src/permissions/index.js`

**GraphQL schema errors**
- Ensure all resolvers are exported correctly
- Check schema file syntax

## 📦 Dependencies

### Core Dependencies
- `express` - Web framework
- `graphql` - GraphQL implementation
- `graphql-http` - GraphQL over HTTP
- `@prisma/client` - Prisma ORM client
- `graphql-shield` - Permission middleware
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing

### Development Dependencies
- `prisma` - Prisma CLI
- `jest` - Testing framework
- `nodemon` - Development hot reload

See `package.json` for complete list.

## 🚢 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure secure `CORS_ORIGIN`
- [ ] Set up database connection pooling
- [ ] Enable error logging
- [ ] Run database migrations
- [ ] Generate Prisma client
- [ ] Set up process manager (PM2, systemd, etc.)

### Environment Setup
```bash
# Production .env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://..."
JWT_SECRET="<strong-random-secret>"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="https://yourdomain.com"
BCRYPT_ROUNDS=12
```

## 🤝 Contributing

### Code Style
- Use ES modules (`import`/`export`)
- Follow existing file structure
- Add tests for new features
- Update documentation

### Pull Request Process
1. Create feature branch
2. Make changes with tests
3. Update documentation if needed
4. Ensure all tests pass
5. Submit PR with description

## 📝 License

ISC

## 🔗 Resources

- [GraphQL Documentation](https://graphql.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Documentation](https://expressjs.com/)
- [GraphQL Shield Documentation](https://the-guild.dev/graphql/shield)

---

For questions or issues, please open an issue on [GitHub](https://github.com/rasuloff789/qmr-backend/issues).
