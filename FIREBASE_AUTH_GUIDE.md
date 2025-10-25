# Firebase Authentication Integration Guide

## Overview

This guide explains how to integrate Firebase Authentication with the QMR Backend GraphQL API. The system supports both traditional JWT authentication and Firebase ID token authentication.

## Architecture

### Authentication Flow

1. **Frontend**: User verifies phone number with Firebase
2. **Frontend**: Get Firebase ID token using `auth.currentUser.getIdToken()`
3. **Frontend**: Send requests with Firebase ID token in Authorization header
4. **Backend**: Verify Firebase ID token using Firebase Admin SDK
5. **Backend**: Link Firebase user to system user (if not already linked)
6. **Backend**: Provide access to GraphQL API with user context

## Frontend Implementation

### 1. Firebase Setup

```javascript
// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

### 2. Phone Number Verification

```javascript
// Send verification code
const sendVerificationCode = async (phoneNumber) => {
  const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
    size: 'invisible',
  }, auth);

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

// Verify code and get ID token
const verifyCodeAndGetToken = async (confirmationResult, code) => {
  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;
    
    // Get Firebase ID token
    const idToken = await user.getIdToken();
    
    return {
      user,
      idToken,
    };
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};
```

### 3. GraphQL Requests with Firebase Token

```javascript
// Make GraphQL requests with Firebase ID token
const makeGraphQLRequest = async (query, variables, idToken) => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  return await response.json();
};

// Example: Link Firebase user to system user
const linkFirebaseUser = async (idToken, username, userType) => {
  const mutation = `
    mutation LinkFirebaseUser($username: String!, $userType: String!) {
      linkFirebaseUser(username: $username, userType: $userType) {
        success
        message
        user {
          id
          username
          fullname
          role
        }
        errors
        timestamp
      }
    }
  `;

  return await makeGraphQLRequest(mutation, { username, userType }, idToken);
};
```

## Backend Implementation

### 1. Firebase Admin SDK Setup

```javascript
// src/utils/firebase/auth.js
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const firebaseApp = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // Or use service account file:
  // credential: admin.credential.cert(require('./path/to/serviceAccountKey.json')),
});

// Verify Firebase ID token
export const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        phone: decodedToken.phone_number,
        email: decodedToken.email,
        phoneVerified: decodedToken.phone_number_verified,
        emailVerified: decodedToken.email_verified,
        customClaims: decodedToken.custom_claims || {},
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
```

### 2. Authentication Middleware

```javascript
// src/middleware/firebaseAuth.js
export const firebaseAuthMiddleware = async (req, res, next) => {
  try {
    const firebaseToken = extractFirebaseToken(req);
    
    if (!firebaseToken) {
      req.user = null;
      req.firebaseUser = null;
      return next();
    }
    
    const verificationResult = await verifyFirebaseToken(firebaseToken);
    
    if (verificationResult.success) {
      req.firebaseUser = verificationResult.user;
      
      // Extract system user info from custom claims
      const { username, userType } = verificationResult.user.customClaims || {};
      
      if (username && userType) {
        req.user = {
          id: verificationResult.user.uid,
          username,
          role: userType,
          firebaseUid: verificationResult.user.uid,
          phone: verificationResult.user.phone,
          phoneVerified: verificationResult.user.phoneVerified,
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    req.user = null;
    req.firebaseUser = null;
    next();
  }
};
```

### 3. GraphQL Context

```javascript
// GraphQL context includes both Firebase and system user
const graphqlConfig = {
  schema: schema,
  context: { 
    user: req.user, // System user (if linked)
    firebaseUser: req.firebaseUser, // Firebase user
  },
};
```

## API Endpoints

### Link Firebase User

```graphql
mutation LinkFirebaseUser($username: String!, $userType: String!) {
  linkFirebaseUser(username: $username, userType: $userType) {
    success
    message
    user {
      id
      username
      fullname
      role
    }
    errors
    timestamp
  }
}
```

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

### Get Current User

```graphql
query Me {
  me {
    id
    username
    fullname
    role
    createdAt
  }
}
```

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

## Security Features

### 1. Token Verification
- Firebase ID tokens are verified using Firebase Admin SDK
- Tokens are validated for expiration and signature
- Phone number verification status is checked

### 2. User Linking
- Firebase users must be linked to system users
- Phone number matching is enforced
- Custom claims store system user information

### 3. Access Control
- GraphQL Shield permissions work with Firebase users
- Role-based access control is maintained
- Unlinked Firebase users have limited access

## Environment Setup

### 1. Firebase Project Setup
1. Create Firebase project
2. Enable Authentication with Phone provider
3. Download service account key
4. Set up reCAPTCHA for phone verification

### 2. Environment Variables
```bash
# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

# Or set in your application
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
```

### 3. Database Schema
The system uses the existing user tables (Root, Admin, Teacher) and links them to Firebase users via custom claims.

## Testing

### 1. Development Testing
- Use Firebase emulator for local testing
- Mock Firebase tokens for unit tests
- Test phone verification flow

### 2. Production Testing
- Test with real Firebase project
- Verify phone number verification
- Test token expiration handling

## Error Handling

### Common Errors

1. **Invalid Firebase Token**
   ```json
   {
     "success": false,
     "message": "Firebase authentication required",
     "errors": ["Invalid or expired Firebase ID token"]
   }
   ```

2. **User Not Linked**
   ```json
   {
     "success": false,
     "message": "User not linked to system",
     "errors": ["Firebase user must be linked to a system account"]
   }
   ```

3. **Phone Number Mismatch**
   ```json
   {
     "success": false,
     "message": "Phone number mismatch",
     "errors": ["Firebase phone number does not match system phone number"]
   }
   ```

## Migration from JWT to Firebase

### 1. Gradual Migration
- Both JWT and Firebase authentication are supported
- Existing JWT tokens continue to work
- New users can use Firebase authentication

### 2. User Linking Process
1. User verifies phone with Firebase
2. User provides system username and type
3. System verifies phone number matches
4. Firebase user is linked to system user
5. Future requests use Firebase authentication

## Best Practices

### 1. Security
- Always verify Firebase tokens on the backend
- Use HTTPS for all requests
- Implement rate limiting for authentication endpoints
- Log authentication events for security monitoring

### 2. Performance
- Cache Firebase token verification results
- Use Firebase Admin SDK efficiently
- Implement proper error handling

### 3. User Experience
- Provide clear error messages
- Handle token expiration gracefully
- Implement automatic token refresh
- Support offline authentication state

## Troubleshooting

### 1. Common Issues
- Firebase project not configured correctly
- Service account key not found
- Phone verification not working
- Token verification failing

### 2. Debug Steps
1. Check Firebase project configuration
2. Verify service account permissions
3. Test phone verification flow
4. Check token format and expiration
5. Review server logs for errors

## Support

For issues with Firebase authentication integration:
1. Check Firebase documentation
2. Review server logs
3. Test with Firebase emulator
4. Contact development team
