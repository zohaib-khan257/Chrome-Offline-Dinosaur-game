#!/bin/bash

# Post-tool formatting and validation hook for Python/Django projects
# Runs after file edits/creates: black, ruff, Django check, pytest

set -e
trap 'exit_code=$?; echo "Hook failed with exit code $exit_code" >&2; exit $exit_code' EXIT

# Read the hook input from stdin
hook_input=$(cat)

# Extract tool info
tool_name=$(echo "$hook_input" | grep -o '"toolName":"[^"]*"' | head -1 | cut -d'"' -f4)

# Only run formatting after file modification tools
file_tools=("create_file" "replace_string_in_file" "edit_notebook_file" "multi_replace_string_in_file")
should_run_format=false

for tool in "${file_tools[@]}"; do
    if [[ "$tool_name" == "$tool" ]]; then
        should_run_format=true
        break
    fi
done

if [[ "$should_run_format" != true ]]; then
    exit 0
fi

# Check if we're in a Python project
if ! command -v python &> /dev/null; then
    exit 0
fi

project_root="."
cd "$project_root" || exit 1

echo "🔧 Running Python formatting and validation..."

# Step 1: Run black
if command -v black &> /dev/null; then
    echo "📝 Running black..."
    if ! black . --quiet; then
        echo "❌ black failed"
        exit 1
    fi
else
    echo "⏭️  black not installed, skipping..."
fi

# Step 2: Run ruff fix
if command -v ruff &> /dev/null; then
    echo "🔍 Running ruff check..."
    if ! ruff check . --fix --quiet; then
        echo "⚠️  ruff found issues (they may have been auto-fixed)"
    fi
else
    echo "⏭️  ruff not installed, skipping..."
fi

# Step 3: Run Django check (only if manage.py exists)
if [[ -f "manage.py" ]]; then
    echo "🔧 Running Django checks..."
    if ! python manage.py check 2>&1; then
        echo "❌ Django check failed"
        exit 1
    fi
else
    echo "⏭️  Not a Django project (manage.py not found), skipping Django checks..."
fi

# Step 4: Run pytest (only if installed)
if python -c "import pytest" 2>/dev/null; then
    echo "✅ Running pytest..."
    if ! pytest --quiet --tb=short 2>&1; then
        echo "❌ pytest failed"
        exit 1
    fi
else
    echo "⏭️  pytest not installed, skipping..."
fi

echo "✅ All checks passed!"
exit 0
