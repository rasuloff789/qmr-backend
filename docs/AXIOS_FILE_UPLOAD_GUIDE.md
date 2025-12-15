# Axios File Upload Guide for GraphQL

Complete guide for using `axios` with `graphql-upload` for file uploads in the QMR Backend.

## Table of Contents

- [Overview](#overview)
- [Implementation Roadmap](#implementation-roadmap)
- [Quick Start Checklist](#quick-start-checklist)
- [The Problem](#the-problem)
- [Step-by-Step Implementation](#step-by-step-implementation)
- [Complete Examples](#complete-examples)
- [Key Points](#key-points)
- [Common Errors and Solutions](#common-errors-and-solutions)
- [Helper Function](#helper-function)
- [Testing](#testing)
- [Next Steps](#next-steps)

## Overview

When using `axios` directly for GraphQL file uploads, you must format the request according to the `graphql-upload` specification. This guide shows you how to properly format multipart requests.

## Implementation Roadmap

Follow these steps to implement file uploads with axios:

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Understand the graphql-upload format                │
│ • Learn the required multipart/form-data structure          │
│ • Understand operations, map, and file fields                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Set up FormData structure                           │
│ • Create new FormData instance                              │
│ • Prepare for operations, map, and file fields              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Create GraphQL operation                            │
│ • Write your mutation/query with Upload scalar             │
│ • Set file variables to null in variables object            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Map files to variables                              │
│ • Create map object linking file indices to variable paths  │
│ • Append files to FormData with numbered indices            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Send request with axios                              │
│ • Append operations and map as JSON strings                 │
│ • Send FormData (DO NOT set Content-Type manually)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Handle response and errors                          │
│ • Process successful responses                              │
│ • Handle GraphQL errors and network errors                  │
└─────────────────────────────────────────────────────────────┘
```

### Roadmap Steps Summary

1. **Understand the format**: Learn how `graphql-upload` expects multipart requests
2. **Set up FormData**: Create the FormData container
3. **Create GraphQL operation**: Write your mutation with Upload scalar
4. **Map files to variables**: Link file indices to GraphQL variables
5. **Send with axios**: Make the POST request with FormData
6. **Handle responses**: Process success and error cases

## Quick Start Checklist

Use this checklist to quickly implement file uploads:

### Prerequisites
- [ ] `axios` installed in your project
- [ ] Authentication token available (JWT)
- [ ] GraphQL endpoint URL configured
- [ ] File input element in your form

### Implementation Steps
- [ ] Create FormData instance
- [ ] Write GraphQL mutation with `Upload` scalar type
- [ ] Set file variables to `null` in operations variables
- [ ] Create map object linking files to variables
- [ ] Append operations (as JSON string) to FormData
- [ ] Append map (as JSON string) to FormData
- [ ] Append files with numbered indices (0, 1, 2, etc.)
- [ ] Send request with axios (without setting Content-Type)
- [ ] Handle response and errors

### Verification
- [ ] Test with single file upload
- [ ] Test with multiple file uploads
- [ ] Verify error handling works
- [ ] Check file size limits (max 10MB)
- [ ] Verify file type restrictions (images: JPEG, PNG, GIF, WebP)

## The Problem

The `graphql-upload` library expects a specific multipart/form-data format:
1. An `operations` field containing the GraphQL query/mutation as JSON
2. A `map` field that maps file variables to form fields
3. Numbered file fields (`0`, `1`, `2`, etc.) containing the actual files

## Step-by-Step Implementation

Follow these detailed steps to implement file uploads:

### Step 1: Understand the graphql-upload Format

The `graphql-upload` specification requires a specific multipart/form-data structure:

- **`operations`**: A JSON string containing your GraphQL operation (query/mutation) with variables
- **`map`**: A JSON string that maps numbered file fields to GraphQL variable paths
- **Numbered fields** (`0`, `1`, `2`, etc.): The actual file objects

Example structure:
```
FormData {
  operations: '{"query":"mutation($file:Upload!){...}","variables":{"file":null}}',
  map: '{"0":["variables.file"]}',
  0: <File object>
}
```

### Step 2: Set up FormData Structure

Create a new FormData instance to hold your request:

```javascript
const formData = new FormData();
```

### Step 3: Create GraphQL Operation

Write your GraphQL mutation or query with `Upload` scalar type. **Important**: Set file variables to `null` in the variables object:

```javascript
const operations = {
  query: `
    mutation AddStudent($profilePicture: Upload) {
      addStudent(profilePicture: $profilePicture) {
        success
        student { id }
      }
    }
  `,
  variables: {
    profilePicture: null, // Must be null - will be replaced by file
  },
};
```

### Step 4: Map Files to Variables

Create a map object that links file indices to variable paths, then append files:

```javascript
// Create the map
const map = {
  '0': ['variables.profilePicture'],
};

// Append the file with index 0
formData.append('0', profilePictureFile);
```

For multiple files:
```javascript
const map = {
  '0': ['variables.profilePicture'],
  '1': ['variables.document'],
};

formData.append('0', files.profilePicture);
formData.append('1', files.document);
```

### Step 5: Send Request with Axios

Append operations and map as JSON strings, then send with axios:

```javascript
// Append operations and map as JSON strings
formData.append('operations', JSON.stringify(operations));
formData.append('map', JSON.stringify(map));

// Send request - DO NOT set Content-Type manually!
const response = await axios.post(
  'http://localhost:4000/graphql',
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      // Let axios set Content-Type with boundary automatically
    },
  }
);
```

### Step 6: Handle Response and Errors

Process the response and handle errors appropriately:

```javascript
try {
  const response = await axios.post(/* ... */);
  
  if (response.data.errors) {
    // Handle GraphQL errors
    console.error('GraphQL errors:', response.data.errors);
  } else {
    // Handle success
    console.log('Success:', response.data.data);
  }
} catch (error) {
  // Handle network/axios errors
  if (error.response) {
    console.error('Server error:', error.response.status);
  } else {
    console.error('Network error:', error.message);
  }
}
```

## Complete Examples

### Example 1: Basic Upload - Add Student with Profile Picture

```javascript
import axios from 'axios';

async function addStudentWithPicture(studentData, profilePictureFile) {
  const token = localStorage.getItem('authToken');
  
  // 1. Create FormData
  const formData = new FormData();
  
  // 2. Create the GraphQL operation
  const operations = {
    query: `
      mutation AddStudent(
        $username: String!
        $password: String!
        $fullname: String!
        $tgUsername: String!
        $birthDate: Date!
        $gender: Gender!
        $possibleDegrees: [ID!]!
        $phone: Phone
        $profilePicture: Upload
      ) {
        addStudent(
          username: $username
          password: $password
          fullname: $fullname
          tgUsername: $tgUsername
          birthDate: $birthDate
          gender: $gender
          possibleDegrees: $possibleDegrees
          phone: $phone
          profilePicture: $profilePicture
        ) {
          success
          message
          student {
            id
            username
            fullname
            profilePicture
          }
          errors
        }
      }
    `,
    variables: {
      username: studentData.username,
      password: studentData.password,
      fullname: studentData.fullname,
      tgUsername: studentData.tgUsername,
      birthDate: studentData.birthDate,
      gender: studentData.gender,
      possibleDegrees: studentData.possibleDegrees,
      phone: studentData.phone || null,
      profilePicture: null, // Set to null, will be replaced by file
    },
  };
  
  // 3. Create the map that links the file to the variable
  const map = {
    '0': ['variables.profilePicture'],
  };
  
  // 4. Add operations and map to FormData as JSON strings
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify(map));
  
  // 5. Add the file with the corresponding index (0, 1, 2, etc.)
  formData.append('0', profilePictureFile);
  
  // 6. Send the request
  try {
    const response = await axios.post(
      'http://localhost:4000/graphql',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          // DO NOT set Content-Type - let axios set it with boundary
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

### Example 2: React Hook with React Query

```javascript
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

function useAddStudent() {
  return useMutation({
    mutationFn: async ({ studentData, profilePictureFile }) => {
      const token = localStorage.getItem('authToken');
      
      const formData = new FormData();
      
      // GraphQL operation
      const operations = {
        query: `
          mutation AddStudent(
            $username: String!
            $password: String!
            $fullname: String!
            $tgUsername: String!
            $birthDate: Date!
            $gender: Gender!
            $possibleDegrees: [ID!]!
            $phone: Phone
            $profilePicture: Upload
          ) {
            addStudent(
              username: $username
              password: $password
              fullname: $fullname
              tgUsername: $tgUsername
              birthDate: $birthDate
              gender: $gender
              possibleDegrees: $possibleDegrees
              phone: $phone
              profilePicture: $profilePicture
            ) {
              success
              message
              student {
                id
                username
                fullname
                profilePicture
              }
              errors
            }
          }
        `,
        variables: {
          ...studentData,
          profilePicture: null,
        },
      };
      
      const map = {
        '0': ['variables.profilePicture'],
      };
      
      formData.append('operations', JSON.stringify(operations));
      formData.append('map', JSON.stringify(map));
      formData.append('0', profilePictureFile);
      
      const response = await axios.post(
        'http://localhost:4000/graphql',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      
      return response.data.data.addStudent;
    },
  });
}

// Usage in component
function AddStudentForm() {
  const addStudent = useAddStudent();
  const [file, setFile] = useState(null);
  
  const handleSubmit = async (formData) => {
    try {
      const result = await addStudent.mutateAsync({
        studentData: formData,
        profilePictureFile: file,
      });
      
      if (result.success) {
        console.log('Student added:', result.student);
      } else {
        console.error('Errors:', result.errors);
      }
    } catch (error) {
      console.error('Mutation failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      {/* other form fields */}
    </form>
  );
}
```

### Example 3: Multiple Files Upload

If you need to upload multiple files:

```javascript
async function addStudentWithMultipleFiles(studentData, files) {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  
  const operations = {
    query: `
      mutation AddStudent(
        $username: String!
        $profilePicture: Upload
        $document: Upload
      ) {
        addStudent(
          username: $username
          profilePicture: $profilePicture
          document: $document
        ) {
          success
          student { id }
        }
      }
    `,
    variables: {
      username: studentData.username,
      profilePicture: null,
      document: null,
    },
  };
  
  // Map files to variables
  const map = {
    '0': ['variables.profilePicture'],
    '1': ['variables.document'],
  };
  
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify(map));
  formData.append('0', files.profilePicture);
  formData.append('1', files.document);
  
  const response = await axios.post(
    'http://localhost:4000/graphql',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  return response.data;
}
```

## Key Points

### 1. FormData Structure

The FormData must contain:
- `operations`: JSON string of the GraphQL operation
- `map`: JSON string mapping file indices to variable paths
- Numbered fields (`0`, `1`, `2`, etc.): The actual files

### 2. Content-Type Header

**DO NOT** manually set `Content-Type` header. Let axios set it automatically with the boundary:

```javascript
// ❌ WRONG
headers: {
  'Content-Type': 'multipart/form-data',
}

// ✅ CORRECT
headers: {
  'Authorization': `Bearer ${token}`,
  // Let axios set Content-Type automatically
}
```

### 3. Variable Mapping

The `map` field tells the server which file corresponds to which variable:

```javascript
// Single file
const map = {
  '0': ['variables.profilePicture'],
};

// Multiple files
const map = {
  '0': ['variables.profilePicture'],
  '1': ['variables.document'],
};
```

### 4. Variables in Operations

Set file variables to `null` in the operations JSON. The server will replace them with the actual files based on the map.

## Common Errors and Solutions

### Error: 415 Unsupported Media Type

**Cause**: Request not formatted correctly for `graphql-upload`

**Solution**: 
- Ensure you're using FormData
- Don't set Content-Type header manually
- Verify operations and map are JSON strings
- Check file indices match the map

### Error: "File upload failed"

**Cause**: File processing error on server

**Solution**:
- Check file size (max 10MB)
- Verify file type (images only: JPEG, PNG, GIF, WebP)
- Ensure file is actually a file object, not a string

### Error: "Variable $profilePicture is required"

**Cause**: Variable not properly mapped

**Solution**:
- Ensure variable is set to `null` in operations
- Verify map correctly references the variable path
- Check file index matches map key

## Helper Function

Create a reusable helper function:

```javascript
/**
 * Create a FormData request for GraphQL file upload
 * @param {Object} options - Request options
 * @param {string} options.query - GraphQL query/mutation string
 * @param {Object} options.variables - GraphQL variables (file vars should be null)
 * @param {Object} options.files - Object mapping variable names to File objects
 * @returns {FormData} Formatted FormData ready for axios
 */
function createGraphQLUploadFormData({ query, variables, files }) {
  const formData = new FormData();
  
  // Create map from files
  const map = {};
  const fileEntries = Object.entries(files);
  
  fileEntries.forEach(([variableName, file], index) => {
    const fileIndex = String(index);
    map[fileIndex] = [`variables.${variableName}`];
    formData.append(fileIndex, file);
  });
  
  // Create operations
  const operations = {
    query,
    variables: {
      ...variables,
      // Ensure file variables are null
      ...Object.keys(files).reduce((acc, key) => {
        acc[key] = null;
        return acc;
      }, {}),
    },
  };
  
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify(map));
  
  return formData;
}

// Usage
const formData = createGraphQLUploadFormData({
  query: `
    mutation AddStudent($username: String!, $profilePicture: Upload) {
      addStudent(username: $username, profilePicture: $profilePicture) {
        success
        student { id }
      }
    }
  `,
  variables: {
    username: 'student001',
  },
  files: {
    profilePicture: fileObject,
  },
});

const response = await axios.post(
  'http://localhost:4000/graphql',
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);
```

## Testing

Test your upload with a simple example:

```javascript
// Test upload
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

const formData = new FormData();
formData.append('operations', JSON.stringify({
  query: 'mutation($file: Upload!) { addStudent(profilePicture: $file) { success } }',
  variables: { file: null },
}));
formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
formData.append('0', testFile);

const response = await axios.post('http://localhost:4000/graphql', formData, {
  headers: { 'Authorization': `Bearer ${token}` },
});

console.log(response.data);
```

## Alternative: Use graphql-request with Upload Support

If you want to use `graphql-request` for uploads, you'll need to use a compatible version or wrapper:

```javascript
import { GraphQLClient } from 'graphql-request';
import { createUploadLink } from 'apollo-upload-client'; // Not compatible with graphql-request

// graphql-request doesn't natively support file uploads
// You'll need to use axios for uploads or find a compatible library
```

For now, stick with axios for file uploads and use `graphql-request` for regular queries.

## Summary

1. ✅ Use FormData for multipart requests
2. ✅ Format operations and map as JSON strings
3. ✅ Don't set Content-Type header manually
4. ✅ Map files to variables using numbered indices
5. ✅ Set file variables to `null` in operations
6. ✅ Use axios for file uploads, graphql-request for regular queries

This approach ensures compatibility with the `graphql-upload` middleware on the backend.

## Next Steps

Now that you understand how to implement file uploads with axios:

1. **Implement in your project**: Use the examples above as templates for your specific use case
2. **Create reusable utilities**: Consider using the helper function provided in this guide
3. **Add error handling**: Implement comprehensive error handling for production use
4. **Test thoroughly**: Test with various file types, sizes, and error scenarios
5. **Optimize for production**: Add loading states, progress indicators, and file validation

### Additional Resources

- [graphql-upload documentation](https://github.com/jaydenseric/graphql-upload)
- [Axios documentation](https://axios-http.com/docs/intro)
- [FormData API documentation](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

### Related Documentation

- See `FRONTEND_GUIDE.md` for general frontend integration patterns
- See `ADD_STUDENT_GUIDE.md` for specific student creation examples

