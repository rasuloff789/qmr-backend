# Invoice API Guide

Complete guide for implementing the invoices page in the frontend.

## Table of Contents

1. [Overview](#overview)
2. [GraphQL Queries](#graphql-queries)
3. [GraphQL Mutations](#graphql-mutations)
4. [Type Definitions](#type-definitions)
5. [Common Use Cases](#common-use-cases)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

## Overview

The invoice system provides billing management for course enrollments with support for:
- Standard enrollment billing (full month)
- Late enrollment billing (prorated first month)
- Price changes during active months (split billing)
- Automatic and manual invoice generation
- Invoice status tracking (PENDING, PAID, CANCELLED)

## GraphQL Queries

### Get Invoices

Fetch invoices with optional filters.

```graphql
query GetInvoices(
  $courseStudentId: ID
  $courseId: ID
  $status: InvoiceStatus
  $month: Int
  $year: Int
) {
  getInvoices(
    courseStudentId: $courseStudentId
    courseId: $courseId
    status: $status
    month: $month
    year: $year
  ) {
    id
    billingPeriodStart
    billingPeriodEnd
    invoiceDate
    totalAmount
    daysInPeriod
    dailyRate
    status
    breakdown {
      start
      end
      price
      days
      amount
    }
    courseStudent {
      id
      monthlyPayment
      joinedAt
      student {
        id
        fullname
        username
        phone
        tgUsername
      }
      course {
        id
        name
        description
        teacher {
          fullname
        }
      }
    }
    createdAt
    updatedAt
  }
}
```

**Variables:**
- `courseStudentId` (optional) - Filter by specific enrollment
- `courseId` (optional) - Filter by course (get all invoices for a course)
- `status` (optional) - Filter by status: `PENDING`, `PAID`, or `CANCELLED`
- `month` (optional) - Filter by billing month (1-12)
- `year` (optional) - Filter by billing year

### Get Single Invoice

Fetch a specific invoice by ID.

```graphql
query GetInvoice($id: ID!) {
  getInvoice(id: $id) {
    id
    billingPeriodStart
    billingPeriodEnd
    invoiceDate
    totalAmount
    daysInPeriod
    dailyRate
    status
    breakdown {
      start
      end
      price
      days
      amount
    }
    courseStudent {
      id
      monthlyPayment
      joinedAt
      student {
        id
        fullname
        username
        phone
        tgUsername
      }
      course {
        id
        name
        description
        teacher {
          fullname
        }
      }
    }
    createdAt
    updatedAt
  }
}
```

## GraphQL Mutations

### Generate Invoice

Manually generate an invoice for a specific enrollment and month.

```graphql
mutation GenerateInvoice(
  $courseStudentId: ID!
  $month: Int!
  $year: Int!
) {
  generateInvoice(
    courseStudentId: $courseStudentId
    month: $month
    year: $year
  ) {
    success
    code
    message
    invoice {
      id
      totalAmount
      status
      billingPeriodStart
      billingPeriodEnd
    }
    errors
    timestamp
  }
}
```

**Variables:**
- `courseStudentId` (required) - Enrollment ID
- `month` (required) - Billing month (1-12)
- `year` (required) - Billing year

**Response Codes:**
- `INVOICE_MISSING_FIELDS` - Missing required fields
- `INVOICE_INVALID_MONTH` - Invalid month value
- `ENROLLMENT_NOT_FOUND` - Enrollment doesn't exist
- `ENROLLMENT_INACTIVE` - Enrollment is inactive
- `INVOICE_NO_BILLABLE_PERIOD` - No billable days in period
- `INVOICE_ALREADY_EXISTS` - Invoice already exists for this period
- `INVOICE_GENERATION_FAILED` - Generation error

### Generate Invoices for Month

Bulk generate invoices for all active enrollments in a month.

```graphql
mutation GenerateInvoicesForMonth(
  $month: Int!
  $year: Int!
) {
  generateInvoicesForMonth(
    month: $month
    year: $year
  ) {
    success
    code
    message
    count
    invoices {
      id
      totalAmount
      status
    }
    errors
    timestamp
  }
}
```

**Variables:**
- `month` (required) - Billing month (1-12)
- `year` (required) - Billing year

### Update Course Price

Update the monthly price for all active enrollments in a course. This automatically creates price change history.

```graphql
mutation UpdateCoursePrice(
  $courseId: ID!
  $newPrice: Int!
) {
  updateCoursePrice(
    courseId: $courseId
    newPrice: $newPrice
  ) {
    success
    code
    message
    updatedCount
    errors
    timestamp
  }
}
```

**Variables:**
- `courseId` (required) - Course ID
- `newPrice` (required) - New monthly price (must be positive)

**Response Codes:**
- `PRICE_UPDATE_MISSING_FIELDS` - Missing required fields
- `PRICE_UPDATE_INVALID_PRICE` - Invalid price (must be positive)
- `AUTH_REQUIRED` - Authentication required
- `COURSE_NOT_FOUND` - Course doesn't exist
- `PRICE_UPDATE_FAILED` - Update error

### Mark Invoice as Paid

Update invoice status to PAID.

```graphql
mutation MarkInvoicePaid($invoiceId: ID!) {
  markInvoicePaid(invoiceId: $invoiceId) {
    success
    code
    message
    invoice {
      id
      status
      totalAmount
    }
    errors
    timestamp
  }
}
```

**Variables:**
- `invoiceId` (required) - Invoice ID

**Response Codes:**
- `INVOICE_MISSING_ID` - Missing invoice ID
- `INVOICE_NOT_FOUND` - Invoice doesn't exist
- `INVOICE_CANCELLED` - Cannot mark cancelled invoice as paid
- `INVOICE_UPDATE_FAILED` - Update error

### Recalculate Invoice

Recalculate an existing invoice (useful if prices changed after generation).

```graphql
mutation RecalculateInvoice($invoiceId: ID!) {
  recalculateInvoice(invoiceId: $invoiceId) {
    success
    code
    message
    invoice {
      id
      totalAmount
      daysInPeriod
      dailyRate
      breakdown {
        start
        end
        price
        days
        amount
      }
    }
    errors
    timestamp
  }
}
```

**Variables:**
- `invoiceId` (required) - Invoice ID

## Type Definitions

### Invoice

```typescript
type Invoice {
  id: ID!
  courseStudent: CourseStudent!
  billingPeriodStart: Date!
  billingPeriodEnd: Date!
  invoiceDate: Date!
  totalAmount: Int!
  daysInPeriod: Int!
  dailyRate: Float!
  breakdown: [InvoiceBreakdownItem!]!
  status: InvoiceStatus!
  createdAt: Date!
  updatedAt: Date!
}
```

### InvoiceBreakdownItem

```typescript
type InvoiceBreakdownItem {
  start: Date!
  end: Date!
  price: Int!
  days: Int!
  amount: Int!
}
```

### InvoiceStatus

```typescript
enum InvoiceStatus {
  PENDING
  PAID
  CANCELLED
}
```

## Common Use Cases

### 1. Display All Invoices for a Course

```graphql
query GetCourseInvoices($courseId: ID!) {
  getInvoices(courseId: $courseId) {
    id
    totalAmount
    status
    billingPeriodStart
    billingPeriodEnd
    courseStudent {
      student {
        fullname
      }
    }
  }
}
```

### 2. Display Pending Invoices

```graphql
query GetPendingInvoices {
  getInvoices(status: PENDING) {
    id
    totalAmount
    billingPeriodStart
    billingPeriodEnd
    courseStudent {
      student { fullname }
      course { name }
    }
  }
}
```

### 3. Display Invoices for a Specific Month

```graphql
query GetMonthlyInvoices($month: Int!, $year: Int!) {
  getInvoices(month: $month, year: $year) {
    id
    totalAmount
    status
    courseStudent {
      student { fullname }
      course { name }
    }
  }
}
```

### 4. Display Invoice Details with Breakdown

```graphql
query GetInvoiceDetails($id: ID!) {
  getInvoice(id: $id) {
    id
    totalAmount
    daysInPeriod
    dailyRate
    status
    billingPeriodStart
    billingPeriodEnd
    invoiceDate
    breakdown {
      start
      end
      price
      days
      amount
    }
    courseStudent {
      student {
        fullname
        phone
        tgUsername
      }
      course {
        name
        teacher {
          fullname
        }
      }
      monthlyPayment
    }
  }
}
```

### 5. Generate Invoice for Late Enrollment

```graphql
mutation GenerateLateEnrollmentInvoice(
  $courseStudentId: ID!
  $month: Int!
  $year: Int!
) {
  generateInvoice(
    courseStudentId: $courseStudentId
    month: $month
    year: $year
  ) {
    success
    message
    invoice {
      id
      totalAmount
      breakdown {
        days
        amount
      }
    }
  }
}
```

## Error Handling

### Handling Query Errors

```typescript
try {
  const { data, errors } = await client.query({
    query: GET_INVOICES,
    variables: { courseId: "1" }
  });
  
  if (errors) {
    console.error("GraphQL errors:", errors);
    // Handle errors
  }
  
  return data.getInvoices;
} catch (error) {
  console.error("Network error:", error);
  // Handle network errors
}
```

### Handling Mutation Errors

```typescript
try {
  const { data } = await client.mutate({
    mutation: GENERATE_INVOICE,
    variables: {
      courseStudentId: "1",
      month: 12,
      year: 2024
    }
  });
  
  if (!data.generateInvoice.success) {
    // Handle business logic errors
    switch (data.generateInvoice.code) {
      case "INVOICE_ALREADY_EXISTS":
        // Show message: Invoice already exists
        break;
      case "ENROLLMENT_NOT_FOUND":
        // Show message: Enrollment not found
        break;
      default:
        // Show generic error
    }
  }
  
  return data.generateInvoice.invoice;
} catch (error) {
  console.error("Mutation error:", error);
}
```

## Examples

### React Component Example

```typescript
import { useQuery, useMutation } from '@apollo/client';
import { GET_INVOICES, MARK_INVOICE_PAID } from './queries';

function InvoicesPage({ courseId }: { courseId: string }) {
  const { data, loading, error, refetch } = useQuery(GET_INVOICES, {
    variables: { courseId },
  });
  
  const [markPaid] = useMutation(MARK_INVOICE_PAID, {
    onCompleted: () => {
      refetch(); // Refresh the list
    },
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Invoices</h1>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Period</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.getInvoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.courseStudent.student.fullname}</td>
              <td>
                {new Date(invoice.billingPeriodStart).toLocaleDateString()} - 
                {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
              </td>
              <td>{invoice.totalAmount.toLocaleString()} UZS</td>
              <td>{invoice.status}</td>
              <td>
                {invoice.status === 'PENDING' && (
                  <button
                    onClick={() =>
                      markPaid({ variables: { invoiceId: invoice.id } })
                    }
                  >
                    Mark as Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Invoice Detail View with Breakdown

```typescript
function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const { data, loading } = useQuery(GET_INVOICE, {
    variables: { id: invoiceId },
  });
  
  if (loading) return <div>Loading...</div>;
  
  const invoice = data.getInvoice;
  
  return (
    <div>
      <h1>Invoice #{invoice.id}</h1>
      
      <div>
        <h2>Student Information</h2>
        <p>Name: {invoice.courseStudent.student.fullname}</p>
        <p>Course: {invoice.courseStudent.course.name}</p>
      </div>
      
      <div>
        <h2>Billing Period</h2>
        <p>
          {new Date(invoice.billingPeriodStart).toLocaleDateString()} - 
          {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
        </p>
        <p>Days: {invoice.daysInPeriod}</p>
        <p>Daily Rate: {invoice.dailyRate.toFixed(2)} UZS</p>
      </div>
      
      {invoice.breakdown.length > 1 && (
        <div>
          <h2>Price Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Price</th>
                <th>Days</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.breakdown.map((item, index) => (
                <tr key={index}>
                  <td>
                    {new Date(item.start).toLocaleDateString()} - 
                    {new Date(item.end).toLocaleDateString()}
                  </td>
                  <td>{item.price.toLocaleString()} UZS</td>
                  <td>{item.days}</td>
                  <td>{item.amount.toLocaleString()} UZS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div>
        <h2>Total Amount</h2>
        <p>{invoice.totalAmount.toLocaleString()} UZS</p>
        <p>Status: {invoice.status}</p>
      </div>
    </div>
  );
}
```

### Filter Invoices by Status and Date

```typescript
function InvoiceFilters({ onFilter }: { onFilter: (filters: any) => void }) {
  const [filters, setFilters] = useState({
    status: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  
  return (
    <div>
      <select
        value={filters.status}
        onChange={(e) =>
          setFilters({ ...filters, status: e.target.value })
        }
      >
        <option value="">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="PAID">Paid</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      
      <input
        type="number"
        placeholder="Month"
        min="1"
        max="12"
        value={filters.month}
        onChange={(e) =>
          setFilters({ ...filters, month: parseInt(e.target.value) })
        }
      />
      
      <input
        type="number"
        placeholder="Year"
        value={filters.year}
        onChange={(e) =>
          setFilters({ ...filters, year: parseInt(e.target.value) })
        }
      />
      
      <button onClick={() => onFilter(filters)}>Apply Filters</button>
    </div>
  );
}
```

## Billing Calculation Notes

### Standard Enrollment
- Student joins on or before course start date
- Billed for full month at monthly price

### Late Enrollment
- Student joins after course start date
- First month is prorated: `(Monthly Price / Days in Month) × Days Attended`
- Subsequent months are full price

### Price Changes
- If price changes during a month, billing is split:
  - Period before change: Old price × days
  - Period after change: New price × days
  - Total = Sum of both periods

### Invoice Generation
- Invoices are generated on the 1st of the month following the billing period
- Example: February invoices are generated on March 1st
- Automatic generation runs via cron job
- Manual generation available via mutation

## Best Practices

1. **Always check `success` field** in mutation responses before using data
2. **Handle `INVOICE_ALREADY_EXISTS`** gracefully - show existing invoice instead of error
3. **Display breakdown** when multiple periods exist (price changes)
4. **Format amounts** with locale-specific number formatting (UZS)
5. **Show loading states** during invoice generation
6. **Refresh data** after status changes (mark as paid)
7. **Validate month/year** inputs (month: 1-12, year: reasonable range)
8. **Handle empty states** when no invoices match filters

## API Endpoint

All queries and mutations are available at:
```
POST /graphql
```

Authentication is required for mutations (except viewing invoices may depend on your permissions setup).

