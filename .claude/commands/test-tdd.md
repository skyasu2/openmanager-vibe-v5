---
name: test-tdd
description: Create TDD test for a function or component
---

You are going to help create a TDD (Test-Driven Development) test following the Red-Green-Refactor cycle.

Please follow these steps:

1. **Analyze the request** - Understand what functionality needs to be tested
2. **Write RED test** - Create a failing test with @tdd-red tag
3. **Provide minimal GREEN implementation** - Just enough code to pass
4. **Suggest REFACTOR improvements** - Optimize the implementation

Use this format:

```typescript
// @tdd-red @created-date: {current_date}
describe('{ComponentName}', () => {
  it('should {expected_behavior}', () => {
    // Arrange
    
    // Act
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

Remember to:
- Add @tdd-red tag for tracking
- Use AAA pattern (Arrange-Act-Assert)
- Keep tests focused and atomic
- Include edge cases
- Make test names descriptive