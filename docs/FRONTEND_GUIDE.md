# Frontend Integration Guide

Complete guide for frontend developers integrating with the QMR Backend GraphQL API.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Flow](#authentication-flow)
3. [GraphQL Client Setup](#graphql-client-setup)
4. [Common Operations](#common-operations)
5. [File Uploads](#file-uploads)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Getting Started

### API Endpoints

- **GraphQL Endpoint**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`
- **Static Assets**: `http://localhost:4000/uploads/...`

### Environment Setup

```env
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_API_URL=http://localhost:4000
```

### CORS Configuration

The backend allows requests from:
- `http://localhost:3000`
- `http://localhost:5173`
- Configure additional origins in backend `.env` file

---

## Authentication Flow

### 1. Login

```graphql
mutation Login($username: String!, $password: String!, $userType: String!) {
  login(username: $username, password: $password, userType: $userType) {
    success
    message
    token
    user {
      id
      username
      fullname
      role
    }
  }
}
```

### 2. Store Token

```javascript
// After successful login
const token = response.data.login.token;
localStorage.setItem('authToken', token);
```

### 3. Include Token in Requests

```javascript
// Apollo Client
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
```

### 4. Handle Token Expiration

```javascript
// Check token expiration
function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Refresh or redirect to login
if (isTokenExpired(token)) {
  localStorage.removeItem('authToken');
  // Redirect to login
}
```

---

## GraphQL Client Setup

### Apollo Client (React)

```javascript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { createUploadLink } from 'apollo-upload-client';

const httpLink = createUploadLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

### Vue Apollo

```javascript
import { createApolloClient } from '@vue/apollo-option';
import { createUploadLink } from 'apollo-upload-client';
import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const httpLink = createUploadLink({
  uri: 'http://localhost:4000/graphql',
});

export const apolloClient = createApolloClient({
  httpLink: authLink.concat(httpLink),
});
```

### Fetch API

```javascript
async function graphqlRequest(query, variables = {}) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  return response.json();
}
```

---

## Common Operations

### Fetch Students

```graphql
query GetStudents {
  getStudents {
    id
    fullname
    username
    gender
    isActive
    profilePicture
  }
}
```

### Fetch Courses

```graphql
query GetCourses {
  getCourses {
    id
    name
    description
    daysOfWeek
    teacher {
      id
      fullname
    }
    students {
      id
      student {
        id
        fullname
      }
    }
  }
}
```

### Create Student

```graphql
mutation AddStudent(
  $username: String!
  $password: String!
  $fullname: String!
  $tgUsername: String!
  $birthDate: Date!
  $gender: Gender!
  $possibleDegrees: [ID!]!
) {
  addStudent(
    username: $username
    password: $password
    fullname: $fullname
    tgUsername: $tgUsername
    birthDate: $birthDate
    gender: $gender
    possibleDegrees: $possibleDegrees
  ) {
    success
    message
    student {
      id
      fullname
    }
    errors
  }
}
```

### Update Student

```graphql
mutation UpdateStudent($id: ID!, $fullname: String, $phone: Phone) {
  updateStudent(id: $id, fullname: $fullname, phone: $phone) {
    success
    message
    student {
      id
      fullname
    }
    errors
  }
}
```

---

## File Uploads

### Apollo Client Upload

```javascript
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const UPLOAD_PROFILE_PICTURE = gql`
  mutation UpdateStudent($id: ID!, $profilePicture: Upload) {
    updateStudent(id: $id, profilePicture: $profilePicture) {
      success
      message
      student {
        id
        profilePicture
      }
    }
  }
`;

function ProfilePictureUpload({ studentId }) {
  const [updateStudent] = useMutation(UPLOAD_PROFILE_PICTURE);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await updateStudent({
        variables: {
          id: studentId,
          profilePicture: file,
        },
      });

      if (result.data.updateStudent.success) {
        console.log('Upload successful');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return <input type="file" onChange={handleFileChange} />;
}
```

### Fetch API Upload

```javascript
async function uploadProfilePicture(studentId, file) {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  
  formData.append('operations', JSON.stringify({
    query: `
      mutation UpdateStudent($id: ID!, $profilePicture: Upload) {
        updateStudent(id: $id, profilePicture: $profilePicture) {
          success
          student {
            profilePicture
          }
        }
      }
    `,
    variables: {
      id: studentId,
      profilePicture: null,
    },
  }));

  formData.append('map', JSON.stringify({
    '0': ['variables.profilePicture'],
  }));

  formData.append('0', file);

  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}
```

---

## Error Handling

### GraphQL Errors

```javascript
function handleGraphQLErrors(error) {
  if (error.graphQLErrors) {
    error.graphQLErrors.forEach(({ message, extensions }) => {
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Handle authentication error
        localStorage.removeItem('authToken');
        // Redirect to login
      } else {
        // Handle other GraphQL errors
        console.error('GraphQL Error:', message);
      }
    });
  }

  if (error.networkError) {
    // Handle network errors
    console.error('Network Error:', error.networkError);
  }
}
```

### Mutation Errors

```javascript
function handleMutationResponse(response) {
  const { success, message, errors } = response.data.mutationName;

  if (!success) {
    // Handle mutation-level errors
    errors.forEach(error => {
      console.error('Error:', error);
      // Show error to user
    });
    return false;
  }

  // Success
  console.log('Success:', message);
  return true;
}
```

### Error Boundary (React)

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

---

## Best Practices

### 1. Query Optimization

- Request only needed fields
- Use fragments for reusable field sets
- Implement pagination when available

```graphql
fragment StudentBasic on Student {
  id
  fullname
  username
  isActive
}

query GetStudents {
  getStudents {
    ...StudentBasic
  }
}
```

### 2. Caching Strategy

```javascript
// Apollo Client cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Student: {
      fields: {
        courses: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
      },
    },
  },
});
```

### 3. Loading States

```javascript
function StudentList() {
  const { data, loading, error } = useQuery(GET_STUDENTS);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <StudentTable students={data.getStudents} />;
}
```

### 4. Optimistic Updates

```javascript
const [updateStudent] = useMutation(UPDATE_STUDENT, {
  optimisticResponse: {
    updateStudent: {
      __typename: 'UpdateStudentResponse',
      success: true,
      student: {
        ...currentStudent,
        fullname: newFullname,
      },
    },
  },
  update(cache, { data }) {
    // Update cache
  },
});
```

### 5. Date Handling

```javascript
// Format dates consistently
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Validate dates before sending
function validateDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date <= new Date();
}
```

### 6. Form Validation

```javascript
function validateStudentForm(data) {
  const errors = {};

  if (!data.username || data.username.length < 4) {
    errors.username = 'Username must be at least 4 characters';
  }

  if (!data.password || data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (!data.fullname) {
    errors.fullname = 'Full name is required';
  }

  return errors;
}
```

### 7. Token Management

```javascript
// Token refresh logic
async function refreshTokenIfNeeded() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  if (isTokenExpired(token)) {
    // Attempt to refresh or redirect to login
    localStorage.removeItem('authToken');
    return null;
  }

  return token;
}
```

---

## TypeScript Support

### Type Definitions

```typescript
interface Student {
  id: string;
  username: string;
  fullname: string;
  birthDate: string;
  phone?: string;
  tgUsername: string;
  gender: 'MALE' | 'FEMALE' | 'CHILD';
  profilePicture?: string;
  isActive: boolean;
  possibleDegrees: Degree[];
}

interface AddStudentResponse {
  success: boolean;
  message: string;
  student?: Student;
  errors?: string[];
}
```

### GraphQL Code Generation

```bash
# Install GraphQL Code Generator
npm install -D @graphql-codegen/cli @graphql-codegen/typescript

# Generate types
npx graphql-codegen --config codegen.yml
```

---

## Testing

### Mock Apollo Client

```javascript
import { MockedProvider } from '@apollo/client/testing';

const mocks = [
  {
    request: {
      query: GET_STUDENTS,
    },
    result: {
      data: {
        getStudents: [
          { id: '1', fullname: 'John Doe' },
        ],
      },
    },
  },
];

function TestComponent() {
  return (
    <MockedProvider mocks={mocks}>
      <StudentList />
    </MockedProvider>
  );
}
```

---

## Related Documentation

- **API Reference**: See `docs/GRAPHQL_API.md`
- **Examples**: See `docs/EXAMPLES.md`
- **Permissions**: See `docs/PERMISSIONS_REFERENCE.md`

---

## Summary

Frontend integration with QMR Backend involves:

1. ✅ Setting up GraphQL client with authentication
2. ✅ Implementing login flow
3. ✅ Handling file uploads
4. ✅ Managing errors gracefully
5. ✅ Optimizing queries and caching
6. ✅ Following best practices

Use the provided examples and patterns to build a robust frontend application.
