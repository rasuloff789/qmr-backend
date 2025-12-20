# Frontend Changes Summary

## Overview
This document summarizes all API changes that affect the frontend implementation.

## New GraphQL Queries

### 1. Get Invoices
```graphql
query GetInvoices(
  $courseStudentId: ID
  $courseId: ID        # NEW - Filter by course
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
    totalAmount
    paidAmount          # NEW
    remainingAmount     # NEW
    status
    billingPeriodStart
    billingPeriodEnd
    # ... other fields
  }
}
```

### 2. Get Single Invoice
```graphql
query GetInvoice($id: ID!) {
  getInvoice(id: $id) {
    id
    totalAmount
    paidAmount          # NEW
    remainingAmount     # NEW
    status
    # ... other fields
  }
}
```

## New GraphQL Mutations

### 1. Generate Invoice
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
    invoice {
      id
      totalAmount
      paidAmount
      remainingAmount
      status
    }
  }
}
```

### 2. Generate Invoices for Month (Bulk)
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
    count
    invoices {
      id
      totalAmount
      status
    }
  }
}
```

### 3. Update Course Price (All Enrollments)
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
    updatedCount
    message
  }
}
```

### 4. Update Enrollment Price (Single Student)
```graphql
mutation UpdateEnrollmentPrice(
  $courseStudentId: ID!
  $newPrice: Int!
) {
  updateEnrollmentPrice(
    courseStudentId: $courseStudentId
    newPrice: $newPrice
  ) {
    success
    courseStudent {
      id
      monthlyPayment
      student { fullname }
      course { name }
    }
  }
}
```

### 5. Mark Invoice as Paid (Full Payment)
```graphql
mutation MarkInvoicePaid($invoiceId: ID!) {
  markInvoicePaid(invoiceId: $invoiceId) {
    success
    invoice {
      id
      paidAmount
      remainingAmount
      status
    }
  }
}
```

### 6. Add Partial Payment ⭐ NEW
```graphql
mutation AddPartialPayment(
  $invoiceId: ID!
  $amount: Int!
) {
  addPartialPayment(
    invoiceId: $invoiceId
    amount: $amount
  ) {
    success
    message
    invoice {
      id
      totalAmount
      paidAmount
      remainingAmount
      status
    }
    errors
  }
}
```

### 7. Recalculate Invoice
```graphql
mutation RecalculateInvoice($invoiceId: ID!) {
  recalculateInvoice(invoiceId: $invoiceId) {
    success
    invoice {
      id
      totalAmount
      paidAmount
      remainingAmount
    }
  }
}
```

### 8. Delete Invoice
```graphql
mutation DeleteInvoice($invoiceId: ID!) {
  deleteInvoice(invoiceId: $invoiceId) {
    success
    invoice {
      id
    }
  }
}
```

## Updated Types

### Invoice Type - New Fields
```graphql
type Invoice {
  id: ID!
  totalAmount: Int!
  paidAmount: Int!           # NEW - Amount paid so far
  remainingAmount: Int!      # NEW - Calculated: totalAmount - paidAmount
  status: InvoiceStatus!     # Updated - now includes PARTIALLY_PAID
  # ... other existing fields
}
```

### InvoiceStatus Enum - New Value
```graphql
enum InvoiceStatus {
  PENDING
  PARTIALLY_PAID    # NEW
  PAID
  CANCELLED
}
```

### Student Type - New Field
```graphql
type Student {
  # ... existing fields
  courses: [CourseStudent!]!  # NEW - Returns student's course enrollments
}
```

### Teacher Type - New Field
```graphql
type Teacher {
  # ... existing fields
  courses: [Course!]!  # NEW - Returns courses the teacher is teaching
}
```

## Key Changes Summary

### 1. Invoice Payment Tracking
- **Before**: Only `status` (PENDING/PAID/CANCELLED)
- **After**: 
  - `paidAmount` - Tracks how much has been paid
  - `remainingAmount` - Calculated remaining balance
  - `status` - Now includes `PARTIALLY_PAID`

### 2. Payment Mutations
- **`markInvoicePaid`**: Marks invoice as fully paid (sets paidAmount = totalAmount)
- **`addPartialPayment`**: Records partial payments, automatically updates status

### 3. Price Management
- **`updateCoursePrice`**: Updates price for all enrollments in a course
- **`updateEnrollmentPrice`**: Updates price for a single enrollment

### 4. Query Filters
- **`getInvoices`**: Now supports filtering by `courseId` (get all invoices for a course)

## Frontend Implementation Guide

### Displaying Invoice Payment Status

```typescript
function InvoiceStatusBadge({ invoice }: { invoice: Invoice }) {
  const getStatusColor = () => {
    switch (invoice.status) {
      case 'PENDING':
        return 'gray';
      case 'PARTIALLY_PAID':
        return 'yellow';
      case 'PAID':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div>
      <span style={{ color: getStatusColor() }}>
        {invoice.status}
      </span>
      {invoice.status === 'PARTIALLY_PAID' && (
        <div>
          Paid: {invoice.paidAmount.toLocaleString()} UZS
          <br />
          Remaining: {invoice.remainingAmount.toLocaleString()} UZS
        </div>
      )}
    </div>
  );
}
```

### Partial Payment Form

```typescript
function PartialPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [amount, setAmount] = useState('');
  const [addPayment] = useMutation(ADD_PARTIAL_PAYMENT);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await addPayment({
      variables: {
        invoiceId,
        amount: parseInt(amount),
      },
    });
    
    if (result.data.addPartialPayment.success) {
      // Refresh invoice data
      // Show success message
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Payment amount"
        min="1"
      />
      <button type="submit">Add Payment</button>
    </form>
  );
}
```

### Invoice List with Payment Status

```typescript
function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Total</th>
          <th>Paid</th>
          <th>Remaining</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.courseStudent.student.fullname}</td>
            <td>{invoice.totalAmount.toLocaleString()} UZS</td>
            <td>{invoice.paidAmount.toLocaleString()} UZS</td>
            <td>{invoice.remainingAmount.toLocaleString()} UZS</td>
            <td>
              <InvoiceStatusBadge invoice={invoice} />
            </td>
            <td>
              {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                <>
                  {invoice.remainingAmount > 0 && (
                    <PartialPaymentForm invoiceId={invoice.id} />
                  )}
                  {invoice.remainingAmount === invoice.totalAmount && (
                    <button onClick={() => markAsPaid(invoice.id)}>
                      Mark as Paid
                    </button>
                  )}
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Breaking Changes

### None
All changes are additive. Existing queries and mutations continue to work.

## Migration Notes

1. **Update Invoice Display**: Add `paidAmount` and `remainingAmount` fields to invoice displays
2. **Add Payment UI**: Implement partial payment form/button
3. **Update Status Badges**: Handle new `PARTIALLY_PAID` status
4. **Update Type Definitions**: Add new fields to TypeScript/GraphQL types
5. **Student/Teacher Pages**: Add `courses` field to display course lists

## Example Queries for Common Use Cases

### Get All Partially Paid Invoices
```graphql
query {
  getInvoices(status: PARTIALLY_PAID) {
    id
    totalAmount
    paidAmount
    remainingAmount
    courseStudent {
      student { fullname }
      course { name }
    }
  }
}
```

### Get Invoices for a Course
```graphql
query {
  getInvoices(courseId: "1") {
    id
    totalAmount
    paidAmount
    status
    courseStudent {
      student { fullname }
    }
  }
}
```

### Get Student's Courses
```graphql
query {
  getStudent(id: "1") {
    id
    fullname
    courses {
      id
      monthlyPayment
      joinedAt
      course {
        name
        teacher { fullname }
      }
    }
  }
}
```

### Get Teacher's Courses
```graphql
query {
  getTeacher(id: "1") {
    id
    fullname
    courses {
      id
      name
      startAt
      students {
        id
        student { fullname }
      }
    }
  }
}
```

## Error Codes Reference

### Payment Errors
- `PAYMENT_MISSING_FIELDS` - Missing invoice ID or amount
- `PAYMENT_INVALID_AMOUNT` - Amount must be positive
- `PAYMENT_EXCEEDS_TOTAL` - Payment amount exceeds remaining balance
- `INVOICE_CANCELLED` - Cannot add payment to cancelled invoice

### Invoice Errors
- `INVOICE_MISSING_ID` - Missing invoice ID
- `INVOICE_NOT_FOUND` - Invoice doesn't exist
- `INVOICE_ALREADY_EXISTS` - Invoice already exists for period
- `INVOICE_NO_BILLABLE_PERIOD` - No billable days in period

## Testing Checklist

- [ ] Display invoice with paidAmount and remainingAmount
- [ ] Show PARTIALLY_PAID status correctly
- [ ] Add partial payment functionality
- [ ] Validate payment doesn't exceed total
- [ ] Update status automatically after payment
- [ ] Display student's courses
- [ ] Display teacher's courses
- [ ] Filter invoices by courseId
- [ ] Filter invoices by status (including PARTIALLY_PAID)

