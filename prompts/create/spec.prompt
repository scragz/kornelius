# Technical Specification Generation

Your task is to **generate a comprehensive technical specification** based on either:

- A **new project** request, **or**
- A **new feature** request in an **existing** project

The specification must be precise, thorough, and suitable for planning & code generation.

---

## **Required Inputs**

1. **REQUEST**: The project or feature request in `<project_request>`.
2. **RULES**: The guidelines or best practices in `<project_rules>`, if any.

---

## **Optional Inputs**

1. **REFERENCE**: A starter template or reference design in `<reference_code>`.

---

## **Task Overview**

1. Analyze all inputs and plan an approach inside `<specification_planning>` tags.
2. Cover architecture, feature breakdowns, data flows, and any relevant integration points.
3. Return a final specification in Markdown following one of the two templates (see “Output Templates” below):
   - **Template A**: New Project Specification
   - **Template B**: Existing Project Feature Specification

---

## **Detailed Process Outline**

1. **Review Inputs**
   - The AI reviews `<project_request>`, `<project_rules>`, and (optionally) `<reference_code>`.

2. **Planning**
   - Within `<specification_planning>` tags, the AI identifies key workflows, project structure, data flows, etc.
   - Pinpoints challenges and clarifies requirements.

3. **Specification Output**
   - Based on whether the **REQUEST** is for a new project or a feature in an existing project, the AI creates a detailed specification using the corresponding template:

     - **Template A (New Project Specification)**
     - **Template B (Existing Feature Specification)**

   - The specification must cover:
     1. System Overview
     2. Project Structure
     3. Feature Specification
     4. Database Schema
     5. Server Actions
     6. Design System
     7. Component Architecture
     8. Authentication & Authorization
     9. Data Flow
     10. Payment Integration
     11. Analytics Integration
     12. Testing

4. **Further Iteration**
   - The user can request additional details, modifications, or clarifications as needed.

---

## **Guidelines**

- Ensure that your specification is **extremely detailed**, giving **implementation guidance** and examples for complex features.
- Clearly define interfaces and data contracts.
- Summarize your final specification at the end, noting any open questions.
- The user may keep refining the request until it's complete and ready.

---

## **Output Templates**

Below are **two** templates: one for a **new project** and one for a **feature in an existing project**. Use whichever is appropriate based on the user’s **REQUEST**.

---

### **Template A: New Project Specification**

```markdown
# {Project Name} Technical Specification (New Project)

## 1. System Overview
- **Core Purpose & Goals**: High-level product vision and why it exists
- **Primary Use Cases**: Key user workflows and expected outcomes
- **High-Level Architecture**: Diagram or textual overview (client, server, DB, third-party services)

## 2. Technology & Tools
- **Languages & Frameworks**: (e.g., TypeScript, React, Node.js)
- **Libraries & Dependencies**: (e.g., Express, Redux, Tailwind)
- **Database & ORM**: (e.g., PostgreSQL, Prisma)
- **DevOps & Hosting**: (e.g., Docker, AWS, Heroku)
- **CI/CD Pipeline**: (e.g., GitHub Actions, CircleCI)

## 3. Project Structure
- **Folder Organization**: Proposed layout (e.g., `/src`, `/server`, `/client`)
- **Naming Conventions**: File naming rules and patterns
- **Key Modules**: Briefly describe each module’s purpose (e.g., auth module, payment module)

## 4. Feature Specification
### 4.1 Feature Name
- **User Story & Requirements**: What the user needs to do and why
- **Implementation Details**: Step-by-step outline
- **Edge Cases & Error Handling**: Anticipated failures, fallback UI, or notifications
- **UI/UX Considerations**: Wireframes or reference to design mocks

*(Repeat this sub-section as needed for each major feature.)*

## 5. Database Schema
### 5.1 Tables / Collections
- **Entities**: Each table/collection name, fields, data types, constraints
- **Relationships**: (One-to-many, many-to-many), indexes, etc.
- **Migrations**: Strategy for setting up or evolving schema over time

## 6. Server Actions
### 6.1 Database Actions
- **CRUD Operations**: Summaries of Create/Read/Update/Delete methods
- **Endpoints or GraphQL Queries**: Outline how data is fetched or modified
- **ORM/Query Examples**: Snippets showing typical queries or operations

### 6.2 Other Backend Logic
- **External API Integrations**: Payment gateways, third-party data sources
- **File or Media Handling**: Uploads, transformations, storage
- **Background Jobs or Workers**: Scheduled tasks, asynchronous processing

## 7. Design System
### 7.1 Visual Style
- **Branding & Theme**: Colors, fonts, icons
- **Layout & Spacing**: Grid systems, breakpoints for responsiveness
- **Accessibility Considerations**: (WCAG, ARIA attributes)

### 7.2 UI Components
- **Common Elements**: Buttons, forms, modals
- **Interaction States**: Hover, focus, disabled, error
- **Reusable Patterns**: Notification system, cards, lists

## 8. Component Architecture
### 8.1 Server/Backend Components
- **Framework**: (e.g., Express, NestJS)
- **Data Models & Domain Objects**: Classes or structs representing data
- **Error Boundaries**: Global error handling approach

### 8.2 Client/Frontend Components
- **State Management**: (Redux, Vuex, Zustand, etc.)
- **Routing**: Public vs. protected routes, lazy loading
- **Type Definitions**: If using TypeScript or Flow

## 9. Authentication & Authorization
- **Method**: JWT, OAuth2, session cookies, etc.
- **Role-Based or Permission-Based Access**: Admin, user, etc.
- **Session Management**: Token expiration, refresh tokens

## 10. Data Flow
- **Request/Response Lifecycle**: How the client communicates with the server
- **State Sync**: Strategies for updating UI when data changes
- **Real-Time Updates**: If using websockets or push notifications

## 11. Payment Integration (If Applicable)
- **Supported Providers**: Stripe, PayPal, etc.
- **Checkout Flow**: Steps from cart to confirmation
- **Webhook Handling**: Event-driven notifications for refunds, disputes

## 12. Analytics Integration (If Applicable)
- **Tracking Tools**: (Google Analytics, Mixpanel, custom)
- **Event Naming Conventions**: e.g., `user_sign_up`, `purchase_completed`
- **Reporting & Dashboards**: Where and how data is displayed

## 13. Security & Compliance
- **Encryption**: Data-at-rest (DB encryption), data-in-transit (TLS)
- **Compliance**: GDPR, HIPAA, PCI, or relevant regulations
- **Threat Modeling**: Potential vulnerabilities and mitigations
- **Secrets Management**: Storing API keys, credentials

## 14. Environment Configuration & Deployment
- **Local Setup**: Environment variables, Docker usage, build scripts
- **Staging/Production Environments**: Differences, scaling approach
- **CI/CD**: Build/test/deploy pipeline, versioning strategy
- **Monitoring & Logging**: Tools (Sentry, Datadog), log format

## 15. Testing
- **Unit Testing**: Tools (Jest, Mocha), coverage targets
- **Integration Testing**: API & DB tests
- **End-to-End (E2E) Testing**: Cypress, Playwright, test flows
- **Performance & Security Testing**: Load tests, automated scans

---

### Summary & Next Steps
- **Recap**: Key design choices and architectural patterns
- **Open Questions**: Any unresolved dependencies, features, or resource constraints
- **Future Enhancements**: Suggestions for iteration or expansions
```

---

### **Template B: Existing Project Feature Specification**

```markdown
# {Feature Name} Technical Specification (Existing Project)

## 1. High-Level Context
- **Existing System Recap**: Brief description of the project’s overall purpose
- **Where This Feature Fits**: Which modules or user flows it impacts
- **Key Integration Points**: Data sources, APIs, or shared services it relies on

## 2. Adhering to Existing Conventions
- **File Structure & Naming**: Follow the current repository layout (e.g., `/server/api`, `/client/components`)
- **Styling & Theming**: Align with existing design system (colors, typography, spacing)
- **Coding Standards**: Language style guides, linting, or frameworks already in use

## 3. Feature Specification
### 3.1 Feature Name
- **User Story & Requirements**: Specific functionality or user journey
- **Implementation Details**: Outline of how this integrates into existing code
- **Edge Cases & Error Handling**: Additional or changed logic for unexpected inputs
- **UI/UX Changes**: New screens or modifications to existing components

*(Repeat or subdivide for multiple related sub-features if needed.)*

## 4. Database Schema (Updates or New Tables)
### 4.1 Tables / Fields
- **Modified Entities**: Additional columns, changed constraints
- **New Tables**: If the feature requires entirely new entities
- **Migration Strategy**: How to roll out changes without disrupting existing data

## 5. Server Actions
### 5.1 Database Actions
- **New or Updated CRUD Ops**: Summaries of how data is created, read, updated, deleted
- **Impact on Existing Data Models**: Note any relationships with existing tables
- **Queries or Stored Procedures**: If relevant, show code snippets or references

### 5.2 Other Backend Logic
- **External API Calls**: If we add or modify integrations
- **File Handling**: Uploading, processing, or storing new file types
- **Background Jobs**: Any scheduled tasks relevant to the feature

## 6. Design System (Adjustments or Extensions)
### 6.1 Visual Style
- **Alignment with Current Theme**: Use existing color palette, typography
- **Additional Icons or Elements**: If the feature needs new icons, states, or patterns

### 6.2 UI Components
- **New Components**: Reusable parts introduced by this feature
- **Modifications to Existing Components**: Updated props, styling, or logic
- **State & Validation Changes**: Additional checks, error messages, or dynamic updates

## 7. Component Architecture (New or Modified)
### 7.1 Server/Backend
- **Endpoints or Services**: Revised or newly added
- **Refactoring Needs**: If existing code must be reorganized
- **Data Models**: Updated or extended classes/interfaces

### 7.2 Client/Frontend
- **Updated State Management**: Additional store slices, new actions or reducers
- **Routing Changes**: New routes, guarded routes for the feature
- **Integration with Existing Hooks/HOCs**: Where and how the feature is injected

## 8. Authentication & Authorization
- **Adjustments to Existing Auth Flow**: New roles or permissions required?
- **Access Control**: Which users can use this feature, any restricted endpoints?
- **Session/Token Implications**: If token scopes or session data need changes

## 9. Data Flow
- **Revised Sequence Diagram**: Show how data moves for the new feature
- **Impacts on Global State**: If the feature modifies shared application state
- **Real-Time or Async Updates**: Changes to websockets, push notifications, or polling

## 10. Payment Integration (If Applicable)
- **Updates to Existing Payment Flows**: New products, pricing, or discount codes
- **Webhook Changes**: Handling refunds or subscription modifications
- **Security/Compliance**: If PCI or other guidelines are affected

## 11. Analytics Integration
- **New Events or Metrics**: Additional tracking for usage, conversions, or performance
- **Dashboards/Reports**: Where new metrics appear, how they’re accessed
- **Alignment with Existing Analytics**: Follow naming conventions, data schemas

## 12. Testing
- **Unit Tests**: New or updated tests focusing on changed logic
- **Integration Tests**: Checking how this feature interacts with existing modules
- **End-to-End Tests**: Confirm end-user scenarios using e.g. Cypress, Playwright
- **Backward Compatibility**: Ensuring existing features remain functional

---

### Summary & Next Steps
- **Recap**: How this feature enhances or modifies the existing system
- **Open Questions**: Dependencies, integration pitfalls, unresolved decisions
- **Deployment Considerations**: Any phased rollout, feature flagging, or scheduled release
```

---

## **Context**

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
