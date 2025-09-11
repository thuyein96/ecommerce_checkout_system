# E-commerce Checkout System - Unit Testing

This project implements unit testing for the `calculateDeliveryFees` function in the ecommerce checkout system.

## Test Cases

The following test cases are implemented for the `calculateDeliveryFees` function:

### Test Case 1: Single Shop Standard Delivery

- **Input:** 1 shop, Standard delivery
- **Expected:** 19 THB

### Test Case 2: Single Shop Priority Delivery

- **Input:** 1 shop, Priority delivery
- **Expected:** 29 THB

### Test Case 3: Multiple Shop Standard Delivery

- **Input:** 3 shops, Standard delivery
- **Expected:** 57 THB (19 × 3)

### Test Case 4: Multiple Shop Priority Delivery

- **Input:** 3 shops, Priority delivery
- **Expected:** 87 THB (29 × 3)

### Test Case 5: Mixed Delivery Types

- **Input:** (Shop 1, Standard), (Shop 2, Priority)
- **Expected:** 48 THB (19 + 29)

## Additional Test

The tests also include:

- Verification of delivery fee constants (19 THB standard, 29 THB priority)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Function Under Test

The `calculateDeliveryFees` function is located in `src/utils/checkout.ts` and:

1. Groups cart items by shop ID
2. Calculates one delivery fee per shop (regardless of number of items)
3. Uses the specified delivery method per shop (standard or priority)
4. Defaults to standard delivery if no method is specified
5. Returns total delivery fees and shop groups

## Currency

The entire application uses Thai Baht (THB) as the currency:

- Standard delivery: 19.00 THB per shop
- Priority delivery: 29.00 THB per shop

## Test Structure

Tests are located in `__tests__/calculateDeliveryFees.test.ts` and follow the AAA pattern:

- **Arrange:** Set up test data (cart items, delivery methods)
- **Act:** Call the function under test
- **Assert:** Verify the expected results

All 6 tests pass (5 main test cases + 1 constants verification) and focus specifically on the `calculateDeliveryFees` function behavior.
