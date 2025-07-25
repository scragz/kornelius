# Technical Specification Generation

Your task is to **generate a comprehensive technical specification**. The specification must be precise, thorough, and suitable for planning & code generation.

---

## **Required Inputs**

1. **REQUEST**: The project or feature request in `<project_request>`.

---

## **Optional Inputs**

1. **RULES**: The guidelines or best practices in `<project_rules>`, if any.
2. **REFERENCE**: A starter template or reference design in `<reference_code>`.

---

## **Task Overview**

1. Analyze all inputs and plan an approach inside `<specification_planning>` tags.
2. Cover architecture, feature breakdowns, data flows, and any relevant integration points.
3. Return a final specification in Markdown following the template (see “Output Templates” below)

---

## **Detailed Process Outline**

1. **Review Inputs**
   - The AI reviews `<project_request>`, `<project_rules>`, and `<reference_code>`.

2. **Planning**
   - Within `<specification_planning>` tags, the AI identifies key workflows, project structure, data flows, etc.
   - Pinpoints challenges and clarifies requirements.

3. **Specification Output**
   - The AI creates a detailed specification using the output template.
   - The specification must cover:
      1. Planning & Discovery
      2. System Architecture & Technology
      3. Database & Server Logic
      4. Feature Specifications
      5. Design System
      6. Security & Compliance
      7. Optional Integrations
      8. Environment Configuration & Deployment
      9. Testing & Quality Assurance
      10. Edge Cases, Implementation Considerations & Reflection
      11. Summary & Next Steps


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

Use the output template below.

---

### **Template: Project Specification**

```markdown
# {Project Name} Project Specification

---

## 1. Planning & Discovery

### 1.1 Core Purpose & Success

* **Mission Statement**: One-sentence purpose of the website.
* **Core Purpose & Goals**: High-level product vision—why it exists.
* **Success Indicators**: Metrics or signals that prove goals are met.
* **Experience Qualities**: Three adjectives that should define the UX.

### 1.2 Project Classification & Approach

* **Complexity Level**: Micro Tool, Content Showcase, Light App, or Complex App.
* **Primary User Activity**: Consuming, Acting, Creating, or Interacting.
* **Primary Use Cases**: Key user workflows and expected outcomes.

### 1.3 Feature-Selection Rationale

* **Core Problem Analysis**: The specific pain we solve.
* **User Context**: When, where, and how users engage.
* **Critical Path**: Smallest journey from entry to goal completion.
* **Key Moments**: Two-to-three pivotal interactions that define success.

### 1.4 High-Level Architecture Overview

* **System Diagram / Textual Map**: Client, server, database, third-party services.

### 1.5 Essential Features *(repeat per core feature)*

* **Feature Functionality**: What it does.
* **Feature Purpose**: Why it matters.
* **Feature Validation**: How we confirm it works.

---

## 2. System Architecture & Technology

### 2.1 Tech Stack

* **Languages & Frameworks**: e.g., TypeScript, React, Node.js.
* **Libraries & Dependencies**: e.g., Express, Redux, Tailwind.
* **Database & ORM**: e.g., PostgreSQL, Prisma.
* **DevOps & Hosting**: e.g., Docker, AWS, Heroku.
* **CI/CD Pipeline**: e.g., GitHub Actions, CircleCI.

### 2.2 Project Structure

* **Folder Organization**: Proposed layout (`/src`, `/server`, `/client`, etc.).
* **Naming Conventions**: File and directory patterns.
* **Key Modules**: Auth, payment, notifications, and other major domains.

### 2.3 Component Architecture

#### Server / Backend

* **Framework**: Express, NestJS, etc.
* **Data Models & Domain Objects**: Classes representing entities.
* **Error Boundaries**: Global error-handling strategy.

#### Client / Frontend

* **State Management**: Redux, Vuex, Zustand, etc.
* **Routing**: Public vs. protected, lazy loading strategies.
* **Type Definitions**: Interfaces and types if using TypeScript or Flow.

### 2.4 Data Flow & Real-Time

* **Request/Response Lifecycle**: How client talks to server.
* **State Sync**: UI update strategies on data change.
* **Real-Time Updates**: WebSockets, server-sent events, or push notifications.

---

## 3. Database & Server Logic

### 3.1 Database Schema

* **Entities**: Table/collection names, fields, data types, constraints.
* **Relationships**: One-to-many, many-to-many, indexes.
* **Migrations**: Strategy for evolving the schema safely.

### 3.2 Server Actions

#### Database Actions

* **CRUD Operations**: Create, read, update, delete summaries.
* **Endpoints / GraphQL Queries**: How data is fetched or mutated.
* **ORM/Query Examples**: Representative snippets.

#### Other Backend Logic

* **External API Integrations**: Payments, third-party data, auth providers.
* **File / Media Handling**: Uploads, transformations, storage rules.
* **Background Jobs / Workers**: Scheduled tasks and async processing.

---

## 4. Feature Specifications *(repeat per major feature)*

* **User Story & Requirements**: What the user needs to do and why.
* **Implementation Details**: Step-by-step outline.
* **Edge Cases & Error Handling**: Anticipated failures and fallbacks.
* **UI/UX Considerations**: Wireframes, design-mock links, accessibility notes.

---

## 5. Design System

### 5.1 Visual Tone & Identity

* **Branding & Theme**: Core colors, fonts, icons.
* **Emotional Response**: Feelings the design should evoke.
* **Design Personality**: Playful, serious, elegant, rugged, cutting-edge, or classic.
* **Visual Metaphors**: Imagery or concepts reflecting the purpose.
* **Simplicity Spectrum**: Minimal vs. rich interface—choose what serves the goal.

### 5.2 Color Strategy

* **Color Scheme Type**: Monochromatic, Analogous, Complementary, Triadic, or Custom.
* **Primary Color**: Main brand color and what it communicates.
* **Secondary Colors**: Supporting hues and their purposes.
* **Accent Color**: Attention-grabbing highlights for CTAs and key elements.
* **Color Psychology**: How chosen colors influence perception and behavior.
* **Color Accessibility**: Contrast and color-blind-friendly combinations.
* **Foreground/Background Pairings**: WCAG AA-checked text colors.

### 5.3 Typography System

* **Font Pairing Strategy**: Harmony between heading and body fonts.
* **Typographic Hierarchy**: Size, weight, spacing rules.
* **Font Personality**: Characteristics conveyed by typefaces.
* **Readability Focus**: Optimal line length, spacing, sizing.
* **Typography Consistency**: Rules for cohesive treatment.
* **Which Fonts**: Google Fonts (or other) to be used.
* **Legibility Check**: Verification that fonts remain readable.

### 5.4 Visual Hierarchy & Layout

* **Attention Direction**: How design guides the eye.
* **White Space Philosophy**: Negative space for rhythm and focus.
* **Grid System**: Structural alignment framework.
* **Responsive Approach**: Adaptation across devices and breakpoints.
* **Content Density**: Balancing richness with clarity.
* **Layout & Spacing**: Grid definitions and spacing scales.

### 5.5 Animations

* **Purposeful Meaning**: Motion that communicates brand and guides attention.
* **Hierarchy of Movement**: Which elements deserve animation focus.
* **Contextual Appropriateness**: Balancing subtle utility and delight.

### 5.6 UI Elements & Components

* **Common Elements**: Buttons, forms, modals.
* **Component Usage**: Dialogs, cards, lists, etc.
* **Component Customization**: Tailwind tweaks for brand alignment.
* **Component States**: Hover, focus, disabled, error.
* **Interaction States**: Visual feedback conventions.
* **Reusable Patterns**: Notifications, lists, pagination.
* **Icon Selection**: Icons representing actions or concepts.
* **Component Hierarchy**: Primary, secondary, tertiary treatments.
* **Spacing System**: Consistent padding/margins via Tailwind scale.
* **Mobile Adaptation**: How components reflow on small screens.

### 5.7 Visual Consistency Framework

* **Design System Approach**: Component-based vs. page-based.
* **Style-Guide Elements**: Decisions to document for future devs.
* **Visual Rhythm**: Predictable interface patterns.
* **Brand Alignment**: Ways visuals reinforce identity.

### 5.8 Accessibility & Readability

* **Accessibility Considerations**: WCAG guidelines, ARIA attributes.
* **Contrast Goal**: WCAG AA minimum for all text and meaningful graphics.

---

## 6. Security & Compliance

* **Encryption**: Data-at-rest and data-in-transit.
* **Compliance**: GDPR, HIPAA, PCI, or other relevant regulations.
* **Threat Modeling**: Potential vulnerabilities and mitigations.
* **Secrets Management**: Secure handling of API keys and credentials.

---

## 7. Optional Integrations

### 7.1 Payment Integration

* **Supported Providers**: Stripe, PayPal, etc.
* **Checkout Flow**: Steps from cart to confirmation.
* **Webhook Handling**: Events for refunds, disputes, etc.

### 7.2 Analytics Integration

* **Tracking Tools**: Google Analytics, Mixpanel, custom.
* **Event Naming Conventions**: e.g., `user_sign_up`, `purchase_completed`.
* **Reporting & Dashboards**: Where and how metrics are displayed.

---

## 8. Environment Configuration & Deployment

* **Local Setup**: ENV vars, Docker usage, build scripts.
* **Staging / Production Environments**: Differences and scaling approach.
* **CI/CD**: Build, test, deploy pipeline and versioning.
* **Monitoring & Logging**: Sentry, Datadog, log format and retention.

---

## 9. Testing & Quality Assurance

* **Unit Testing**: Jest, Mocha, coverage goals.
* **Integration Testing**: API and DB tests.
* **End-to-End Testing**: Cypress, Playwright, full-flow scenarios.
* **Performance & Security Testing**: Load tests and automated scans.
* **Accessibility Tests**: axe-playwright or pa11y integration.

---

## 10. Edge Cases, Implementation Considerations & Reflection

* **Potential Obstacles**: Factors that might block user success.
* **Edge-Case Handling**: Strategies for unexpected behavior.
* **Technical Constraints**: Known limitations to consider.
* **Scalability Needs**: How the solution may grow over time.
* **Testing Focus**: Assumptions requiring validation.
* **Critical Questions**: Unknowns that could affect success.
* **Approach Suitability**: Why this approach fits the need.
* **Assumptions to Challenge**: Items that must be proved.
* **Exceptional Solution Definition**: What would make the outcome outstanding.

---

## 11. Summary & Next Steps

* **Recap**: Key design and architecture decisions.
* **Open Questions**: Unresolved dependencies or constraints.
* **Future Enhancements**: Ideas for iteration or expansion.

---
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
