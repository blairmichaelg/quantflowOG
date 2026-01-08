# Contributing to QuantFlow AI Backtest

First off, thank you for considering contributing to QuantFlow AI Backtest! It's people like you that make this tool better for the entire quantitative trading community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Style Guides](#style-guides)
  - [Git Commit Messages](#git-commit-messages)
  - [TypeScript Style Guide](#typescript-style-guide)
  - [Documentation Style Guide](#documentation-style-guide)
- [Development Setup](#development-setup)
- [Testing Guidelines](#testing-guidelines)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/blairmichaelg/quantflowOG/issues) to avoid duplicates. When you create a bug report, include as many details as possible using the provided template.

**To submit a bug report:**

1. Use the bug report template in `.github/ISSUE_TEMPLATE/bug_report.md`
2. Use a clear and descriptive title
3. Describe the exact steps to reproduce the problem
4. Provide specific examples to demonstrate the steps
5. Describe the behavior you observed and what you expected
6. Include screenshots if applicable
7. Include your environment details (OS, Node version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

1. Use the feature request template in `.github/ISSUE_TEMPLATE/feature_request.md`
2. Use a clear and descriptive title
3. Provide a detailed description of the proposed feature
4. Explain why this enhancement would be useful
5. List any alternative solutions you've considered

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Good for newcomers
- `help wanted` - Issues where we need community help

### Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the [TypeScript Style Guide](#typescript-style-guide)
   - Add or update tests as needed
   - Update documentation for any changed functionality

3. **Test your changes**
   ```bash
   npm run build
   npm run dev  # Manual testing
   ```

4. **Commit your changes**
   - Follow the [Git Commit Messages](#git-commit-messages) guide
   - Keep commits focused and atomic

5. **Push to your fork** and submit a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Pull Request Guidelines:**
   - Provide a clear description of the problem and solution
   - Link to the related issue(s)
   - Include screenshots for UI changes
   - Ensure CI checks pass
   - Request review from maintainers

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

**Commit Message Format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, missing semicolons, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Example:**
```
feat: Add Monte Carlo simulation confidence intervals

Implement statistical analysis for backtesting results with
95% confidence intervals using 1000 simulations.

Closes #42
```

### TypeScript Style Guide

**General Principles:**
- Use TypeScript's strict mode
- Prefer interfaces over type aliases for object shapes
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility

**Naming Conventions:**
- `PascalCase` for types, interfaces, classes, and React components
- `camelCase` for variables, functions, and methods
- `UPPER_SNAKE_CASE` for constants
- Prefix private class members with underscore (`_privateMember`)

**Code Style:**
```typescript
// ✅ Good
interface BacktestConfig {
  initialCapital: number;
  leverage: number;
}

function calculateSharpeRatio(returns: number[], riskFreeRate: number): number {
  const meanReturn = returns.reduce((a, b) => a + b) / returns.length;
  const stdDev = calculateStdDev(returns);
  return (meanReturn - riskFreeRate) / stdDev;
}

// ❌ Avoid
interface backtest_config {
  initial_capital: number;
  leverage: number;
}

function calc_sharpe(r: number[], rf: number): number {
  // ...
}
```

**TypeScript Specific:**
- Always specify return types for functions
- Use strict null checks
- Avoid `any` type - use `unknown` if type is truly unknown
- Leverage union types and type guards

**React/JSX:**
- Use functional components with hooks
- Use `React.FC` type for component definitions
- Keep components focused and composable
- Use descriptive prop names

### Documentation Style Guide

**Code Documentation:**
- Add JSDoc comments for all exported functions, classes, and interfaces
- Document complex algorithms and business logic
- Include examples for non-trivial usage

**JSDoc Format:**
```typescript
/**
 * Calculates the Sharpe ratio for a series of returns.
 * 
 * The Sharpe ratio measures risk-adjusted return by comparing
 * excess return to volatility.
 * 
 * @param returns - Array of period returns (e.g., daily returns)
 * @param riskFreeRate - The risk-free rate of return
 * @returns The calculated Sharpe ratio
 * 
 * @example
 * ```typescript
 * const returns = [0.01, -0.02, 0.03, 0.015];
 * const sharpe = calculateSharpeRatio(returns, 0.02);
 * console.log(sharpe); // 0.85
 * ```
 */
export function calculateSharpeRatio(
  returns: number[], 
  riskFreeRate: number
): number {
  // Implementation
}
```

**README Updates:**
- Keep the README up-to-date with new features
- Update installation instructions if dependencies change
- Add examples for new functionality

## Development Setup

1. **Prerequisites:**
   - Node.js (v18.0.0+)
   - npm (v9.0.0+)
   - Git

2. **Clone and Install:**
   ```bash
   git clone https://github.com/blairmichaelg/quantflowOG.git
   cd quantflowOG
   npm install
   ```

3. **Environment Setup:**
   ```bash
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   npm run preview
   ```

## Testing Guidelines

Currently, the project focuses on manual testing. When contributing:

1. **Manual Testing Checklist:**
   - Test your changes in development mode
   - Verify UI changes across different screen sizes
   - Test with both synthetic and real market data
   - Ensure all existing features still work
   - Test edge cases and error scenarios

2. **Future Testing:**
   - We welcome contributions to add automated tests
   - Consider unit tests for utility functions
   - Integration tests for the backtesting engine
   - E2E tests for critical user flows

## Community

- **Questions?** Open a discussion in [GitHub Discussions](https://github.com/blairmichaelg/quantflowOG/discussions)
- **Need Help?** Check existing issues or create a new one
- **Want to Chat?** Join our community discussions

## Recognition

Contributors will be recognized in our README and release notes. We appreciate every contribution, no matter how small!

---

Thank you for contributing to QuantFlow AI Backtest! 🚀
