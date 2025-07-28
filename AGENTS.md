# Development Principles for AI Agents

## Code Minimalism

When working with this project, it is **extremely important** to follow the principle of minimalism. This means:

### What TO add:
- Only **necessary** functionality to solve the specific task
- Simple and readable code without excessive abstractions
- Basic logic without additional "improvements"

### What NOT to add:
- Error handling (unless critical)
- Performance optimizations (at initial stage)
- Additional features "for the future"
- Complex patterns and architectural solutions
- Validation and checks (unless mandatory)

## Why This Matters

1. **Readability**: Simple code is easier for humans to understand and continue development
2. **Debugging**: Less code = fewer places for bugs
3. **Flexibility**: Simple foundation is easier to modify and extend
4. **Development Speed**: Focus on essentials accelerates MVP creation
5. **Logic Understanding**: Clear structure helps understand developer intentions

## Development Approach

1. First, create a **minimally working** version
2. Test basic functionality
3. Only then add improvements one by one
4. Each change must have a **specific purpose**

## Example of Correct Approach

Instead of creating a complex highlighting system with element filtering, scroll handling, and caching - we created simple functions with classList.add/remove. It works and is easily understood.

## Remember

> Better a simple working solution than a complex perfect one that's hard to understand and modify.