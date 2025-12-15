# Teacher Upload Quick Reference

Quick fix for 415 errors when adding/updating teachers with profile pictures.

## The Problem

If you're getting `415 Unsupported Media Type` when adding/updating a teacher with a profile picture, your frontend is sending the request as JSON instead of multipart/form-data.

## Quick Fix: Add Teacher with Profile Picture

**In your `graphql.ts` or `teachers.tsx` file**, use this format:

```typescript
import axios from 'axios';

async function addTeacherWithPicture(teacherData: any, profilePictureFile: File) {
  const token = localStorage.getItem('authToken');
  
  // Create FormData (REQUIRED for file uploads)
  const formData = new FormData();
  
  // Create GraphQL operation
  const operations = {
    query: `
      mutation AddTeacher(
        $username: String!
        $password: String!
        $fullname: String!
        $tgUsername: String!
        $birthDate: Date!
        $phone: Phone!
        $gender: Gender!
        $profilePicture: Upload
        $degreeIds: [ID!]
      ) {
        addTeacher(
          username: $username
          password: $password
          fullname: $fullname
          tgUsername: $tgUsername
          birthDate: $birthDate
          phone: $phone
          gender: $gender
          profilePicture: $profilePicture
          degreeIds: $degreeIds
        ) {
          success
          message
          teacher {
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
      username: teacherData.username,
      password: teacherData.password,
      fullname: teacherData.fullname,
      tgUsername: teacherData.tgUsername,
      birthDate: teacherData.birthDate,
      phone: teacherData.phone,
      gender: teacherData.gender,
      degreeIds: teacherData.degreeIds || [],
      profilePicture: null, // MUST be null - file will be mapped separately
    },
  };
  
  // Create map linking file to variable
  const map = {
    '0': ['variables.profilePicture'],
  };
  
  // Append to FormData as JSON strings
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify(map));
  formData.append('0', profilePictureFile); // File with index 0
  
  // Send with axios - DO NOT set Content-Type manually!
  try {
    const response = await axios.post(
      'http://localhost:4000/graphql', // or your GraphQL endpoint
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Let axios set Content-Type automatically with boundary
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

## Quick Fix: Update Teacher with Profile Picture

```typescript
async function updateTeacherWithPicture(
  teacherId: string,
  updateData: any,
  profilePictureFile?: File
) {
  const token = localStorage.getItem('authToken');
  
  const formData = new FormData();
  
  const operations = {
    query: `
      mutation UpdateTeacher(
        $id: ID!
        $username: String
        $fullname: String
        $birthDate: Date
        $phone: Phone
        $tgUsername: String
        $password: String
        $profilePicture: Upload
        $degreeIds: [ID!]
        $isActive: Boolean
      ) {
        updateTeacher(
          id: $id
          username: $username
          fullname: $fullname
          birthDate: $birthDate
          phone: $phone
          tgUsername: $tgUsername
          password: $password
          profilePicture: $profilePicture
          degreeIds: $degreeIds
          isActive: $isActive
        ) {
          success
          message
          teacher {
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
      id: teacherId,
      ...updateData,
      profilePicture: null, // MUST be null if file provided
    },
  };
  
  const map: Record<string, string[]> = {};
  let fileIndex = 0;
  
  if (profilePictureFile) {
    map['0'] = ['variables.profilePicture'];
    formData.append('0', profilePictureFile);
    fileIndex = 1;
  }
  
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify(map));
  
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

## Common Mistakes

### ❌ WRONG: Sending as JSON
```typescript
// This will cause 415 error
const response = await axios.post('/graphql', {
  query: `mutation { addTeacher(...) { ... } }`,
  variables: {
    profilePicture: file, // ❌ Can't send file in JSON
  },
}, {
  headers: { 'Content-Type': 'application/json' }
});
```

### ✅ CORRECT: Using FormData
```typescript
// This works correctly
const formData = new FormData();
formData.append('operations', JSON.stringify({ query, variables: { profilePicture: null } }));
formData.append('map', JSON.stringify({ '0': ['variables.profilePicture'] }));
formData.append('0', file);

const response = await axios.post('/graphql', formData, {
  headers: { 'Authorization': `Bearer ${token}` }
  // ✅ Don't set Content-Type - axios sets it automatically
});
```

## Key Points

1. **Always use FormData** when uploading files
2. **Set file variables to `null`** in the operations variables
3. **Create a map** linking file indices to variable paths
4. **Don't set Content-Type header** - let axios set it automatically
5. **Use numbered indices** (0, 1, 2, etc.) for files

## Without File Upload

If you're NOT uploading a file, you can use regular JSON:

```typescript
// This is fine when profilePicture is not included
const response = await axios.post('/graphql', {
  query: `mutation { addTeacher(...) { ... } }`,
  variables: {
    // ... other fields, but NO profilePicture
  },
}, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
});
```

## Full Documentation

See [AXIOS_FILE_UPLOAD_GUIDE.md](./AXIOS_FILE_UPLOAD_GUIDE.md) for complete documentation with examples and troubleshooting.

