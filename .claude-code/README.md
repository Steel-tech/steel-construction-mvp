# Claude Code Configuration for Steel Construction MVP

## 🚀 Quick Start

This directory contains custom Claude Code agents and hooks optimized for steel construction management development.

## 📦 Available Agents

### Core Steel Construction Agents

#### `steel-tracker`
Track and manage piece marks through their lifecycle.
```
Triggers: piece mark, status update, QR code, tracking
Example: "Update piece mark B-101 to shipped status"
```

#### `supabase-ops`
Handle all database operations and real-time subscriptions.
```
Triggers: database, supabase, query, RLS, migration
Example: "Create RLS policy for production workflow"
```

#### `field-mobile`
Optimize for mobile field workers with PWA features.
```
Triggers: mobile, PWA, offline, scanner, camera
Example: "Add QR scanner for piece marks"
```

#### `quality-inspector`
Manage quality control and inspection workflows.
```
Triggers: inspection, quality, NCR, welding, dimensional
Example: "Create welding inspection checklist"
```

#### `realtime-sync`
Handle real-time synchronization between users.
```
Triggers: realtime, subscription, websocket, sync
Example: "Setup real-time updates for production status"
```

### Development & UI Agents

#### `tailwind-ui`
Create responsive Tailwind CSS components.
```
Triggers: component, layout, responsive, styling, UI
Example: "Create responsive dashboard layout"
```

#### `test-gen`
Generate comprehensive test suites (critical - no tests exist yet!).
```
Triggers: test, spec, coverage, unit test
Example: "Setup testing framework and write initial tests"
```

#### `pwa-builder`
Implement Progressive Web App features.
```
Triggers: offline, service worker, manifest, install
Example: "Make the app work offline"
```

#### `security-guard`
Audit and fix security vulnerabilities.
```
Triggers: security, vulnerability, authentication, XSS
Example: "Audit app for security issues"
```

## 🪝 Auto-Commit Hook

The auto-commit hook automatically commits successful code changes to Git.

### Features
- ✅ Runs TypeScript and ESLint checks before committing
- ✅ Generates conventional commit messages
- ✅ Excludes sensitive files (.env, logs)
- ✅ Groups related changes
- ✅ Configurable via `hooks/config.json`

### Configuration
Edit `.claude-code/hooks/config.json` to customize:
- Commit frequency
- File patterns to include/exclude
- Pre-commit checks
- Push to remote (disabled by default)

### Manual Execution
```bash
./.claude-code/hooks/auto-commit.sh
```

## 🎯 Usage Examples

### Using Agents in Claude Code

1. **For piece mark operations:**
   ```
   "Use steel-tracker to update piece mark B-101 status to erected"
   ```

2. **For database work:**
   ```
   "Use supabase-ops to create real-time subscription for production updates"
   ```

3. **For mobile features:**
   ```
   "Use field-mobile to add offline support for field workers"
   ```

4. **For testing:**
   ```
   "Use test-gen to create tests for PieceMarkCard component"
   ```

### Combining Multiple Agents

For complex tasks, combine agents:
```
"Use steel-tracker and supabase-ops to implement piece mark tracking with real-time updates"
```

## 🔧 Customization

### Adding New Agents

1. Create a new JSON file in `.claude-code/agents/`
2. Follow the template structure:
```json
{
  "name": "agent-name",
  "description": "What this agent does",
  "triggers": ["keywords", "that", "activate"],
  "capabilities": {
    "tools": ["Read", "Write", "Edit"],
    "actions": ["What it can do"]
  },
  "prompt_template": "Specialized instructions",
  "examples": [],
  "best_practices": []
}
```

### Modifying Hooks

Edit `.claude-code/hooks/config.json` to change hook behavior:
- Enable/disable hooks
- Adjust timing and triggers
- Configure pre-commit checks
- Set commit message format

## 📊 Agent Performance Tips

1. **Be specific with triggers** - Use exact agent names for better accuracy
2. **Chain agents for complex tasks** - Combine specialists for best results
3. **Use test-gen frequently** - Your app needs tests!
4. **Enable auto-commit** - Never lose work again

## 🐛 Troubleshooting

### Auto-commit not working?
- Check TypeScript compilation: `npx tsc --noEmit`
- Verify ESLint: `npx eslint src`
- Check file permissions: `chmod +x .claude-code/hooks/auto-commit.sh`

### Agent not triggering?
- Use exact trigger words from agent configuration
- Be explicit: "Use [agent-name] to..."

## 📚 Best Practices

1. **Always use agents for their specialty** - Don't use generic commands when an agent exists
2. **Test after major changes** - Use test-gen to maintain quality
3. **Security first** - Run security-guard regularly
4. **Mobile optimization** - Use field-mobile for all field worker features
5. **Keep commits atomic** - Let auto-commit handle grouping

## 🚧 Steel Construction Specific Features

This configuration is optimized for:
- Piece mark lifecycle tracking
- Shop to field workflow
- Quality control inspections
- Real-time collaboration
- Mobile field operations
- Offline capability
- Photo documentation
- QR code scanning

---

*Configuration created for Steel Construction Management MVP*
*Version: 1.0.0*