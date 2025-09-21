#!/usr/bin/env bash

# Clear the screen for a clean start
clear

# Run only the Final Price Calculation tests
# --testPathPattern: Run only tests in the finalPriceCalculation.test.ts file
# --testPathIgnorePatterns: An empty pattern so no tests are ignored
# --verbose: Show detailed test output

echo "========================================"
echo "  Running Final Price Calculation Tests"
echo "========================================"
echo ""

# Run Jest with specific file pattern to avoid showing other tests as skipped
npx jest __tests__/finalPriceCalculation.test.ts --verbose

# The command above will only run tests in the specified file
# This prevents other tests from showing up as "skipped"
