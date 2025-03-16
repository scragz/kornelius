# Implementation Plan Generation

Your task is to **create a comprehensive, step-by-step implementation plan** for building a fully functional web application based on provided input documents. The plan should be detailed enough for a code-generation AI to execute each step sequentially.

---

## **Required Inputs**

1. **PROJECT_REQUEST**: An overview of the project requirements or user request.
2. **PROJECT_RULES**: Any specific rules, guidelines, or best practices to follow.
3. **TECHNICAL_SPECIFICATION**: A thorough technical spec outlining architecture, data flows, features, etc.
4. **REFERENCE_CODE**: Any initial code or directory structure templates that should be referenced or expanded.

---

## **Task Overview**

In each exchange, you will:

1. **Analyze** the provided inputs to understand the scope and requirements of the project.
2. **Brainstorm** (within `<brainstorming>` tags) the logical approach to development, considering project structure, database schema, API routes, shared components, authentication, etc.
3. **Construct** an itemized, ordered list of implementation steps, each sufficiently granular and self-contained.
4. **Format** these steps as a Markdown-based plan, ensuring it follows the guidelines:
   - Each step modifies no more than ~20 files.
   - The plan is structured so the AI can tackle one step at a time (sequentially).
   - Each step clearly outlines its dependencies, tasks, and any user instructions (like installing a library or updating config on a remote service).

Upon completion, the AI will produce a final **Implementation Plan**—a single document containing your project build steps in order. This plan should cover everything from **initial project setup** to **final testing**.

---

## **Detailed Process Outline**

1. **Review Inputs**: The AI reads `<project_request>`, `<project_rules>`, `<technical_specification>`, and `<reference_code>` to form a complete understanding of the project.
2. **Brainstorm**: Within `<brainstorming>` tags, the AI considers:
   - Core structure and essential configurations.
   - Database schema, server actions, and API routes.
   - Shared components, layouts, and feature pages.
   - Authentication, authorization, and third-party service integrations.
   - Client-side interactivity and state management.
   - Testing strategy and error handling.
3. **Create the Step-by-Step Plan**:
   - **List** each step with a short title and description.
   - **Specify** affected files (ensuring no more than 20 changes in a single step).
   - **Indicate** step dependencies (if any).
   - **Highlight** any user instructions for manual tasks.
4. **Finalize the Plan**: The AI returns the complete plan under a `# Implementation Plan` heading, with each major section labeled (e.g., “## [Section Name]”) and the sub-steps in a checklist format.

---

## **Output Template**

Below is an example of the **Implementation Plan** structure you should produce once the brainstorming is complete:

```markdown
# Implementation Plan

## [Section Name]
- [ ] Step 1: [Brief title]
  - **Task**: [Detailed explanation of what needs to be implemented]
  - **Files**: [Up to 20 files, ideally less]
    - `path/to/file1.ts`: [Description of changes]
    - ...
  - **Step Dependencies**: [e.g., "None" or "Step 2"]
  - **User Instructions**: [Any manual tasks the user must perform]

[Additional steps... up to final deployment and testing]
```

After listing all steps, provide a **brief summary** of your overall approach and key considerations (e.g., major dependencies, potential complexities, or recommended best practices).

---

## **Context**

<technical_specification>
{{TECHNICAL_SPECIFICATION}}
</technical_specification>

<project_request>
{{PROJECT_REQUEST}}
</project_request>

<project_rules>
{{PROJECT_RULES}}
</project_rules>

<reference_code>
{{REFERENCE_CODE}}
</reference_code>

---
