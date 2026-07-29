#!/bin/bash

# Validate dangerous shell commands and require confirmation
# This hook checks for destructive operations before they execute

# Read the hook input from stdin
hook_input=$(cat)

# Extract the command being executed (from toolName)
tool_name=$(echo "$hook_input" | grep -o '"toolName":"[^"]*"' | cut -d'"' -f4)

# If the token contains run_in_terminal, check the command
if [[ "$tool_name" == "run_in_terminal" ]]; then
    # Try to extract the command argument
    command_arg=$(echo "$hook_input" | grep -o '"command":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    # Dangerous patterns to check
    dangerous_patterns=(
        'rm -rf'
        'sudo rm'
        'git push --force'
        'git push -f'
    )
    
    # Check if command matches any dangerous pattern
    for pattern in "${dangerous_patterns[@]}"; do
        if [[ "$command_arg" =~ $pattern ]]; then
            # Return permission decision: ask
            cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "Dangerous command detected: '$pattern'. Requires your confirmation."
  }
}
EOF
            exit 0
        fi
    done
fi

# No dangerous command found, allow execution
exit 0
