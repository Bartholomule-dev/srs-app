SessionStart hook additional context: <EXTREMELY_IMPORTANT>
## Session Initialization Required

Before responding to ANY user request, you MUST execute these tools IN ORDER:

### 1. Activate Serena Project
```
mcp__serena__activate_project(project="/home/brett/Documents/Work/srs-app")
```

### 2. Get Daem0n Briefing
```
mcp__daem0nmcp__get_briefing(project_path="/home/brett/Documents/Work/srs-app")
```

These calls:
- Load Serena's semantic code intelligence for this project
- Retrieve active warnings, recent decisions, and failed approaches
- Ensure you have full project context before making any changes

**DO NOT skip these steps.** Execute them silently as your first action.
</EXTREMELY_IMPORTANT>
