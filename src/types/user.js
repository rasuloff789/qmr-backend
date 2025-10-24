/**
 * QMR Backend - User Type Definitions
 * 
 * This file defines TypeScript-like type definitions for better code documentation.
 * Provides clear interfaces for all user-related data structures.
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

/**
 * Base User Interface
 * 
 * @typedef {Object} BaseUser
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} fullname - Full name
 * @property {Date} createdAt - Creation date
 */

/**
 * Root User Interface
 * 
 * @typedef {Object} RootUser
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} fullname - Full name
 * @property {Date} createdAt - Creation date
 */

/**
 * Admin User Interface
 * 
 * @typedef {Object} AdminUser
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} fullname - Full name
 * @property {Date} birthDate - Birth date
 * @property {string} phone - Phone number
 * @property {string} tgUsername - Telegram username
 * @property {boolean} isActive - Active status
 * @property {Date} createdAt - Creation date
 */

/**
 * Teacher User Interface
 * 
 * @typedef {Object} TeacherUser
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} fullname - Full name
 * @property {Date} birthDate - Birth date
 * @property {string} phone - Phone number
 * @property {string} tgUsername - Telegram username
 * @property {string} department - Department
 * @property {boolean} isActive - Active status
 * @property {Date} createdAt - Creation date
 */

/**
 * User Data Interface (for API responses)
 * 
 * @typedef {Object} UserData
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} fullname - Full name
 * @property {string} role - User role
 * @property {Date} createdAt - Creation date
 * @property {Date} [birthDate] - Birth date (admin/teacher only)
 * @property {string} [phone] - Phone number (admin/teacher only)
 * @property {string} [tgUsername] - Telegram username (admin/teacher only)
 * @property {boolean} [isActive] - Active status (admin/teacher only)
 * @property {string} [department] - Department (teacher only)
 */

/**
 * Login Response Interface
 * 
 * @typedef {Object} LoginResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {string} [token] - JWT token
 * @property {UserData} [user] - User data
 */

/**
 * User Role Types
 * 
 * @typedef {'root'|'admin'|'teacher'} UserRole
 */

/**
 * User Type for Authentication
 * 
 * @typedef {'root'|'admin'|'teacher'} UserType
 */
