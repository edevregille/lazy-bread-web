# Stripe Customer Management - Rationalized System

## Overview

The Stripe customer management has been rationalized to prevent duplicate customer creation and ensure consistent customer handling across the application.

## Problem Solved

Previously, Stripe customers were being created in multiple places:
- During user signup
- During payment processing
- When adding payment methods
- In various API endpoints

This led to:
- Duplicate customer creation attempts
- Inconsistent customer data
- Race conditions
- Unnecessary API calls

## Solution: Centralized Customer Manager

### 1. StripeCustomerManager Class

Located in `src/lib/stripeCustomerManager.ts`, this singleton class provides:

- **createOrFindCustomer(email, name?, metadata?)**: Creates or finds existing customer
- **getCustomer(customerId)**: Retrieves customer by ID
- **updateCustomer(customerId, updateData)**: Updates customer data
- **deleteCustomer(customerId)**: Deletes customer

### 2. Key Features

- **Singleton Pattern**: Ensures only one instance manages all customer operations
- **Idempotent Operations**: Safe to call multiple times with same parameters
- **Automatic Updates**: Updates existing customers with new information
- **Comprehensive Logging**: Tracks all customer operations
- **Error Handling**: Consistent error handling across all operations

### 3. API Endpoints

#### `/api/stripe/create-customer`
- **Purpose**: Create or find customer (legacy endpoint)
- **Method**: POST
- **Body**: `{ email, name?, metadata? }`
- **Response**: `{ id, email, name }`

#### `/api/stripe/get-or-create-customer` (NEW)
- **Purpose**: Ensure customer exists and update user profile
- **Method**: POST
- **Body**: `{ email, name?, uid? }`
- **Response**: `{ id, email, name }`
- **Features**: Automatically updates user profile with customer ID

### 4. Utility Functions

#### `ensureStripeCustomer(email, name?, uid?)`
- **Purpose**: High-level function to ensure user has Stripe customer
- **Location**: `src/lib/stripeService.ts`
- **Features**: 
  - Creates/finds customer
  - Updates user profile automatically
  - Handles errors gracefully

#### `createOrFindCustomer(email, name?, metadata?)`
- **Purpose**: Direct access to customer manager
- **Location**: `src/lib/stripe.ts`
- **Features**: Backward compatibility with existing code

## Usage Examples

### 1. During User Signup

```typescript
// In signup API route
const customer = await stripeCustomerManager.createOrFindCustomer(email, displayName, {
  source: 'lazy-bread-web',
  userId: userCredential.user.uid,
});
```

### 2. During Payment Processing

```typescript
// In payment components
const customer = await ensureStripeCustomer(
  currentUser.email || '',
  currentUser.displayName || '',
  currentUser.uid
);
```

### 3. When Adding Payment Methods

```typescript
// In payment method components
const customer = await ensureStripeCustomer(
  userProfile.email,
  userProfile.displayName,
  userProfile.uid
);
```

## Benefits

### 1. **No More Duplicates**
- Customers are only created once per email
- Existing customers are reused automatically

### 2. **Consistent Data**
- All customer operations go through the same manager
- Metadata is consistently applied

### 3. **Better Performance**
- Fewer API calls to Stripe
- Reduced database operations

### 4. **Improved Reliability**
- Centralized error handling
- Better logging and debugging

### 5. **Easier Maintenance**
- Single point of control for customer operations
- Clear separation of concerns

## Migration Guide

### For Existing Code

1. **Replace direct Stripe calls**:
   ```typescript
   // OLD
   const customer = await stripe.customers.create({ email, name });
   
   // NEW
   const customer = await stripeCustomerManager.createOrFindCustomer(email, name);
   ```

2. **Use ensureStripeCustomer for user operations**:
   ```typescript
   // OLD
   const response = await fetch('/api/stripe/create-customer', {...});
   
   // NEW
   const customer = await ensureStripeCustomer(email, name, uid);
   ```

3. **Update error handling**:
   ```typescript
   // OLD
   throw new Error('Failed to create Stripe customer');
   
   // NEW
   throw new Error('Failed to create/find Stripe customer');
   ```

### For New Code

Always use the centralized functions:
- `ensureStripeCustomer()` for user-related operations
- `stripeCustomerManager.createOrFindCustomer()` for direct customer operations
- `/api/stripe/get-or-create-customer` for API calls

## Testing

### 1. Customer Creation
- Test with new email → should create customer
- Test with existing email → should return existing customer
- Test with updated name → should update existing customer

### 2. Error Handling
- Test with invalid email → should return error
- Test with network issues → should handle gracefully
- Test with Stripe API errors → should provide clear error messages

### 3. Integration
- Test signup flow → should create customer once
- Test payment flow → should reuse existing customer
- Test payment method addition → should use existing customer

## Monitoring

### Logs to Watch
- `StripeCustomerManager: Looking for existing customer`
- `StripeCustomerManager: Found existing customer`
- `StripeCustomerManager: Creating new customer`
- `StripeCustomerManager: Updated existing customer`

### Metrics to Track
- Customer creation rate
- Customer lookup success rate
- API response times
- Error rates by operation type

## Future Improvements

1. **Caching**: Add Redis caching for frequently accessed customers
2. **Batch Operations**: Support batch customer operations
3. **Webhooks**: Handle customer updates from Stripe webhooks
4. **Analytics**: Track customer lifecycle events
5. **Cleanup**: Implement customer cleanup for deleted users 