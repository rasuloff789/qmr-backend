/**
 * Test File Upload Mutation Example
 * 
 * This file demonstrates how to test the file upload functionality
 * using the new testFileUpload mutation.
 */

// Example GraphQL mutation for testing file upload
const testFileUploadMutation = `
mutation TestFileUpload($file: Upload!) {
  testFileUpload(file: $file) {
    success
    message
    fileUrl
    filename
    size
    mimetype
    errors
    timestamp
  }
}
`;

// Example usage with fetch (for frontend)
const testFileUpload = async (file, token) => {
  const formData = new FormData();
  
  // Create the GraphQL query
  const query = {
    query: testFileUploadMutation,
    variables: {
      file: null // This will be replaced by the file
    }
  };
  
  // Add the query as a string
  formData.append('operations', JSON.stringify(query));
  
  // Map the file to the variable
  formData.append('map', JSON.stringify({
    '0': ['variables.file']
  }));
  
  // Add the actual file
  formData.append('0', file);
  
  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    const result = await response.json();
    console.log('File upload result:', result);
    return result;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Example usage with curl (for testing)
const curlExample = `
# Test file upload with curl
curl -X POST http://localhost:4000/graphql \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F 'operations={"query":"mutation TestFileUpload($file: Upload!) { testFileUpload(file: $file) { success message fileUrl filename size mimetype errors timestamp } }","variables":{"file":null}}' \\
  -F 'map={"0":["variables.file"]}' \\
  -F '0=@/path/to/your/test-image.jpg'
`;

console.log('Test File Upload Mutation created!');
console.log('Use the testFileUpload mutation to test file uploads without the complexity of addTeacher');
console.log('Any authenticated user (ROOT, ADMIN, TEACHER) can use this mutation');
console.log('\nCurl example:');
console.log(curlExample);
