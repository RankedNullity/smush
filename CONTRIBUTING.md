# Contributing to Migration Smush

Thank you for your interest in contributing to Migration Smush! This document provides guidelines for contributing to this project.

## 🚀 Development Setup

### Prerequisites
- **[Bun](https://bun.sh/)** v1.0.0 or higher
- **Git** for version control
- A **Prisma project** for testing (recommended to use a test database)

### Getting Started
```bash
# Clone the repository
git clone https://github.com/RankedNullity/smush.git
cd smush

# Install dependencies
bun install

# Verify installation
bun run help

# Run type checking
bun run type-check
```

### Testing Your Changes
```bash
# Test help command
bun run help

# Test individual scripts
bun run step1 --help  # (Note: will show usage info)

# Test with a Prisma project (use a backup database!)
bun smush.ts --prisma-dir=/path/to/test/project/prisma

# Run linting
bun run lint
```

## 📝 Code Style & Standards

- **TypeScript**: Use strict TypeScript with proper type annotations
- **Formatting**: Consistent with existing code style (Bun handles most formatting)
- **Naming**: Use descriptive variable and function names
- **Comments**: Add JSDoc comments for functions and complex logic
- **Error Handling**: Use consistent error messages with emoji prefixes (❌, ⚠️, etc.)
- **Logging**: Use descriptive console output with emoji and consistent formatting

### Code Examples
```typescript
// Good: Descriptive function with JSDoc
/**
 * Extracts SQL queries from a migration file content
 * @param content - Raw migration file content
 * @returns Array of cleaned SQL query strings
 */
function extractQueries(content: string): string[] {
  // Implementation
}

// Good: Clear error handling
if (!fs.existsSync(filePath)) {
  console.error("❌ File not found:", filePath);
  process.exit(1);
}
```

## 🔄 Submitting Changes

### 1. Fork & Branch
```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/smush.git
cd smush
git checkout -b feature/descriptive-feature-name
```

### 2. Make Changes
- Keep commits atomic (one feature/fix per commit)
- Write clear commit messages following [Conventional Commits](https://conventionalcommits.org/)
- Test your changes thoroughly

### 3. Commit Guidelines
```bash
# Examples of good commit messages:
git commit -m "feat: add support for custom filter patterns"
git commit -m "fix: handle edge case in query parsing"
git commit -m "docs: update README with new CLI options"
git commit -m "refactor: simplify error handling in step2"
```

### 4. Submit Pull Request
- Push your branch to your fork
- Create a Pull Request with a clear description
- Link any related issues
- Ensure CI passes

## 🎯 Areas for Contribution

We welcome contributions in these areas:

### High Priority
- **🔍 New filter patterns** - Add useful patterns to `filters.json`
- **🛡️ Error handling improvements** - Better user feedback and edge case handling
- **📚 Documentation** - Examples, guides, and API documentation
- **🧪 Testing** - Unit tests and integration tests

### Medium Priority  
- **⚡ Performance optimizations** - Handle large migration sets efficiently
- **🔧 CLI enhancements** - New command-line options and features
- **🎨 Output formatting** - Better console output and file formats
- **🔄 Workflow improvements** - Better step orchestration and recovery

### Ideas Welcome
- **🏗️ Architecture improvements** - Code organization and modularity
- **🌐 Cross-platform compatibility** - Better Windows/Linux/macOS support
- **📊 Analytics and reporting** - Migration analysis and statistics
- **🔌 Plugin system** - Extensible filter and processing system

## 🐛 Reporting Issues

### Before Opening an Issue
1. Search existing issues to avoid duplicates
2. Test with the latest version
3. Prepare a minimal reproduction case

### Issue Template
```markdown
**Environment:**
- Bun version: (run `bun --version`)
- OS: (Windows/macOS/Linux + version)
- Prisma version: (from your project's package.json)

**Steps to Reproduce:**
1. Run command: `bun smush.ts --prisma-dir=...`
2. Expected behavior: ...
3. Actual behavior: ...

**Error Output:**
```
(paste any error messages here)
```

**Additional Context:**
- Migration count: X migrations
- Database type: PostgreSQL/MySQL/SQLite
- Any custom filters.json modifications
```

## 💬 Getting Help

- **🐛 Bug reports**: [GitHub Issues](https://github.com/RankedNullity/smush/issues)
- **💡 Feature requests**: [GitHub Discussions](https://github.com/RankedNullity/smush/discussions)  
- **❓ Questions**: Check existing issues or start a discussion

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
