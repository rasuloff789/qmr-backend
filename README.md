# QMR Backend

A GraphQL API backend built with Node.js, Express, Prisma, and PostgreSQL.

## Features

- **GraphQL API** with comprehensive schema
- **Authentication** with JWT tokens
- **Role-based permissions** (Root and Admin users)
- **Database integration** with Prisma ORM
- **Input validation** with custom scalars
- **Security** with bcrypt password hashing
- **CORS support** for frontend integration

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd qmr-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/qmr_database"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="10d"

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"

# Security
BCRYPT_ROUNDS=10
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Database Management
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## API Endpoints

- **GraphQL**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

## GraphQL Schema

### Queries
- `me`: Get current user information
- `getAdmins`: Get all admin users (Admin/Root only)
- `getAdmin(id)`: Get specific admin by ID (Admin/Root only)

### Mutations
- `login(username, password, userType)`: User authentication
- `addAdmin(...)`: Create new admin user (Root only)

### Types
- `Root`: Root user type
- `Admin`: Admin user type
- `User`: Union of Root and Admin
- `LoginResponse`: Login response with token and user info

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- SQL injection prevention (Prisma ORM)

## Development

The project uses ES modules and includes:
- Comprehensive error handling
- Database connection pooling
- Graceful shutdown handling
- Development vs production configurations
- Detailed logging

## License

ISC
