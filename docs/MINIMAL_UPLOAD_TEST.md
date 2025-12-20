# Minimal Upload Test - Fix 415 Error

Use this minimal example to test and fix your file upload. This is the **absolute minimum** code needed.

## Minimal Working Example

Copy this entire code block into your frontend:

```typescript
import axios from 'axios';

async function testTeacherUpload(teacherData: any, pngFile: File) {
  const token = localStorage.getItem('authToken'); // or however you get your token
  
  // Step 1: Create FormData
  const formData = new FormData();
  
  // Step 2: Create operations object
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
        ) {
          success
          message
          teacher { id username fullname profilePicture }
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
      profilePicture: null, // ⚠️ MUST be null
    },
  };
  
  // Step 3: Create map
  const map = {
    '0': ['variables.profilePicture'],
  };
  
  // Step 4: Append to FormData as JSON strings
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify(map));
  formData.append('0', pngFile); // Your PNG file
  
  // Step 5: Send with axios
  try {
    const response = await axios.post(
      'http://localhost:4000/graphql', // Change to your endpoint
      formData, // ⚠️ Send FormData, not JSON
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          // ⚠️ DO NOT set Content-Type - axios will set it automatically
        },
      }
    );
    
    console.log('Success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}
```

## How to Use

```typescript
// In your component
const handleSubmit = async () => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = fileInput?.files?.[0];
  
  if (!file) {
    alert('Please select a PNG file');
    return;
  }
  
  const teacherData = {
    username: 'teacher001',
    password: 'Password123!',
    fullname: 'John Doe',
    tgUsername: '@johndoe',
    birthDate: '1990-01-01',
    phone: '+998901234567',
    gender: 'MALE',
  };
  
  try {
    await testTeacherUpload(teacherData, file);
    alert('Teacher added successfully!');
  } catch (error) {
    alert('Failed to add teacher');
  }
};
```

## Diagnostic: Check What You're Sending

Add this before your axios call to see what's being sent:

```typescript
// Add this BEFORE axios.post to debug
console.log('FormData contents:');
for (const [key, value] of formData.entries()) {
  if (value instanceof File) {
    console.log(`${key}:`, {
      name: value.name,
      type: value.type,
      size: value.size,
    });
  } else {
    console.log(`${key}:`, value);
  }
}

// Check Content-Type header
console.log('Request will be sent as:', formData instanceof FormData ? 'FormData (multipart)' : 'JSON');
```

## Common Issues Checklist

- [ ] Are you using `FormData`? (Not a plain object)
- [ ] Is `profilePicture: null` in variables? (Not the file object)
- [ ] Are you appending `operations` and `map` as JSON strings?
- [ ] Are you appending the file with index `'0'`?
- [ ] Are you NOT setting `Content-Type` header manually?
- [ ] Is your endpoint URL correct?
- [ ] Is your auth token valid?

## If Still Getting 415

1. **Check browser Network tab**:
   - Open DevTools → Network
   - Find the failed request
   - Check the `Content-Type` header
   - It should be `multipart/form-data; boundary=...`
   - If it's `application/json`, you're sending JSON instead of FormData

2. **Check Request Payload**:
   - In Network tab, click the request
   - Go to "Payload" or "Request" tab
   - You should see FormData with `operations`, `map`, and `0` fields
   - If you see JSON, you're using the wrong format

3. **Verify your code**:
   ```typescript
   // ❌ WRONG - This sends JSON
   axios.post('/graphql', {
     query: '...',
     variables: { profilePicture: file }
   })
   
   // ✅ CORRECT - This sends FormData
   const formData = new FormData();
   formData.append('operations', JSON.stringify({ query: '...', variables: { profilePicture: null } }));
   formData.append('map', JSON.stringify({ '0': ['variables.profilePicture'] }));
   formData.append('0', file);
   axios.post('/graphql', formData)
   ```

## Quick Test in Browser Console

Test directly in browser console:

```javascript
// Paste this in browser console (on your frontend page)
const formData = new FormData();
formData.append('operations', JSON.stringify({
  query: 'mutation($file: Upload!) { addTeacher(profilePicture: $file, username: "test", password: "Test123!", fullname: "Test", tgUsername: "@test", birthDate: "1990-01-01", phone: "+998901234567", gender: MALE) { success } }',
  variables: { file: null }
}));
formData.append('map', JSON.stringify({ '0': ['variables.file'] }));

// Create a test file
const blob = new Blob(['test'], { type: 'image/png' });
const file = new File([blob], 'test.png', { type: 'image/png' });
formData.append('0', file);

// Check what we created
for (const [key, value] of formData.entries()) {
  console.log(key, value instanceof File ? `File: ${value.name}` : value);
}
```

If this works, copy the pattern to your actual code.



