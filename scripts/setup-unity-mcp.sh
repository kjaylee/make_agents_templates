#!/bin/bash
# Unity3D Vibe Coding MCP Setup Script
# Usage: ./setup-unity-mcp.sh [unity-project-path]

set -e

UNITY_PROJECT="${1:-.}"

echo "=== Unity3D Vibe Coding MCP Setup ==="
echo ""

# Check if it's a Unity project
if [ ! -d "$UNITY_PROJECT/Assets" ]; then
    echo "Error: '$UNITY_PROJECT' does not appear to be a Unity project (no Assets folder found)"
    echo "Usage: $0 [path-to-unity-project]"
    exit 1
fi

cd "$UNITY_PROJECT"
echo "Setting up in: $(pwd)"
echo ""

# 1. Create CLAUDE.md if it doesn't exist
if [ ! -f "CLAUDE.md" ]; then
    echo "Creating CLAUDE.md..."
    cat > CLAUDE.md << 'EOF'
# Unity Project: [Your Game Name]

## Project Overview
[Brief description of your game]

## Purchased Assets
<!-- List your purchased assets here so AI can leverage them -->
- [Asset Name] - [What it does]
<!-- Examples:
- DOTween Pro - Tweening and animation
- Odin Inspector - Editor extensions
- TextMeshPro - Text rendering (free, included)
-->

## Project Conventions
- Scripts go in: Assets/Scripts/{FeatureName}/
- Prefabs go in: Assets/Prefabs/{Category}/
- ScriptableObjects go in: Assets/Data/

## Code Style
- PascalCase for public members
- _camelCase for private fields
- Always use [SerializeField] for inspector fields

## Important Notes
<!-- Add any project-specific notes for AI assistance -->
EOF
    echo "  Created CLAUDE.md (edit to add your purchased assets)"
else
    echo "  CLAUDE.md already exists, skipping"
fi

# 2. Create .claude directory for MCP config
mkdir -p .claude

# 3. Create MCP settings
if [ ! -f ".claude/settings.json" ]; then
    echo "Creating .claude/settings.json..."
    cat > .claude/settings.json << 'EOF'
{
  "mcpServers": {
    "unity-mcp-ivanmurzak": {
      "command": "npx",
      "args": ["-y", "@anthropic/unity-mcp-server"],
      "env": {
        "UNITY_MCP_PORT": "8090"
      }
    },
    "unity-mcp-coplaydev": {
      "command": "npx",
      "args": ["-y", "coplaydev-unity-mcp"],
      "env": {
        "UNITY_MCP_PORT": "8091"
      }
    }
  }
}
EOF
    echo "  Created .claude/settings.json with both MCP servers"
else
    echo "  .claude/settings.json already exists, skipping"
fi

# 4. Create Scripts directory structure
echo "Creating script directories..."
mkdir -p Assets/Scripts/Player
mkdir -p Assets/Scripts/UI
mkdir -p Assets/Scripts/Core
mkdir -p Assets/Scripts/Utils
mkdir -p Assets/Prefabs
mkdir -p Assets/Data

# 5. Add .gitignore entries if .gitignore exists
if [ -f ".gitignore" ]; then
    if ! grep -q ".claude/" .gitignore 2>/dev/null; then
        echo "" >> .gitignore
        echo "# Claude Code local settings" >> .gitignore
        echo ".claude/settings.local.json" >> .gitignore
        echo "  Added .claude exclusions to .gitignore"
    fi
fi

# 6. Scan for purchased assets
echo ""
echo "=== Purchased Assets Detection ==="
if [ -d "Assets/Plugins" ]; then
    echo "Found Assets/Plugins/:"
    ls -1 "Assets/Plugins" 2>/dev/null | head -10 | sed 's/^/  - /'
fi
if [ -d "Assets/ThirdParty" ]; then
    echo "Found Assets/ThirdParty/:"
    ls -1 "Assets/ThirdParty" 2>/dev/null | head -10 | sed 's/^/  - /'
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit CLAUDE.md to add your purchased assets list"
echo "2. Start Unity Editor with your project open"
echo "3. Install Unity-MCP package in Unity:"
echo "   - Package Manager > Add package from git URL"
echo "   - https://github.com/IvanMurzak/Unity-MCP.git"
echo "   OR"
echo "   - https://github.com/AmeAya/unity-mcp.git"
echo ""
echo "4. Run 'claude' in this directory to start vibe coding!"
echo ""
