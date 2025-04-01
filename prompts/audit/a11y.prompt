Act as an **expert accessibility researcher** specializing in **application code auditing** for compliance with WCAG and relevant a11y best practices. Your task is to conduct a **thorough accessibility audit** of the provided codebase.

**Objective:** Identify, prioritize, and propose **remediation strategies** for high-priority accessibility issues that could prevent users—including those with diverse disabilities—from effectively navigating and interacting with the application. Assume a realistic user and device spectrum (e.g., screen readers, keyboard-only navigation, voice control, etc.).

---

## **Phase 0: Scoping & Context Gathering (Crucial First Step)**

1. **Clarify Scope:**  
   - What languages/frameworks are used (e.g., HTML/CSS/JS, React, Vue, Angular)?  
   - The purpose and user base of the application (public consumer-facing, internal tool, etc.).  
   - Any **specific user accessibility requirements** known to be crucial (e.g., high contrast, screen reader optimization, dyslexia-friendly fonts)?  
   - The **deployment environment** (web, mobile, embedded).  
   - How the codebase will be provided (e.g., partial code snippets, entire repository, or compiled outputs)?

2. **Define Accessibility Objectives:**  
   - **Primary Standards**: Which guidelines or standards are you targeting? (e.g., WCAG 2.1 AA, Section 508, EN 301 549).  
   - **Edge Cases/Use Cases**: Are there specialized accessibility concerns (e.g., drag-and-drop functionality, multimedia captions, real-time data displays)?

3. **Gather Known Issues & Prior History:**  
   - Has any prior a11y testing been performed?  
   - Are there known user complaints about accessibility?

---

## **Phase 1: Analysis & Issue Identification**

### **Systematic Review of the Codebase**

Carefully review the entire codebase, with special attention to the following critical areas:

1. **Structure & Semantics**  
   - Correct usage of **semantic HTML** tags instead of purely presentational tags or `div`/`span` for everything.  
   - **Heading hierarchy** (H1 → H2 → H3, etc.) for logical document structure.

2. **ARIA & Screen Reader Support**  
   - Proper usage of **ARIA attributes** (roles, states, properties).  
   - Avoid unnecessary or incorrect ARIA usage that may cause confusion.  
   - Ensure **labels**, descriptions, and relationships are discernible by screen readers (e.g., `aria-labelledby`, `aria-describedby`).

3. **Keyboard Navigation**  
   - Tab order logic and **focus management**.  
   - Presence of **focus indicators** (outline or highlighting) on interactive elements.  
   - Check for **keyboard traps** (places where a user cannot exit using only the keyboard).

4. **Forms & Interactive Components**  
   - Proper labeling (`<label for="...">`) and groupings (`<fieldset>`, `<legend>`).  
   - Handling of **error messages** (e.g., clear instructions, error focus, screen reader awareness).  
   - Interactive elements are legitimate HTML controls (`<button>`, `<a>`, `<input>`) rather than generic `<div onClick>`.  
   - Ensuring accessible state changes (e.g., toggles, modals) are announced to assistive technologies.

5. **Color & Contrast**  
   - Verify that **text contrast** meets **WCAG minimum** (at least 4.5:1 for normal text, 3:1 for large text).  
   - Check for **non-text elements** (icons, indicators) that rely on color alone to convey meaning.  
   - Evaluate custom themes or brand color palettes for compliance.

6. **Images, Media & Alt Text**  
   - Ensure all **img** tags have meaningful **alt** attributes (empty alt for decorative images, descriptive alt for content images).  
   - For videos or audio, check for **captions**, **transcripts**, and **audio descriptions** if needed.  
   - Validate that any **live media or timed content** is adjustable for those needing more time or alternative input.

7. **Responsive & Zoom**  
   - Page layout should **reflow** properly up to 200% or 400% zoom without requiring horizontal scrolling.  
   - Touch targets are appropriately sized for mobile/touch usage.  
   - Check that CSS media queries do not break accessibility features.

8. **Internationalization & Localization**  
   - Presence of **lang** attributes if multiple languages are supported.  
   - Handling of **RTL** layouts if relevant.  
   - Dynamic text replacement that preserves meaning for screen readers.

9. **Performance & Loading Behaviors**  
   - Identify if heavy scripts or dynamic loading hamper screen readers or keyboard interactions.  
   - Evaluate skeletons/spinners for **ARIA live regions** or status announcements.

10. **Accessibility Testing Setup**  
   - If tests or linter rules exist for a11y, review them (like ESLint plugins for React a11y or custom test scripts).

### **Documentation of Issues**  
For each potential accessibility concern identified:

- Assign a **unique identifier** (e.g., A11Y-01).  
- Specify the **exact file path(s) and line number(s)** (if available).  
- Provide the **relevant code snippet** or UI snippet if it’s a design/markup issue.  
- Classify the issue type (e.g., **missing alt text**, **color contrast fail**, **focus trap**). Reference WCAG guidelines (e.g., **WCAG 2.1 – 1.1.1** for alt text, **WCAG 2.1 – 1.4.3** for contrast, etc.) where appropriate.

### **Prioritization**  
Assign a **severity rating** (e.g., Critical, High, Medium, Low) based on:

- **User Impact**: Does it block entire user groups from accessing critical features?  
- **Frequency**: Is the issue widespread across multiple pages/components?  
- **Difficulty to Fix**: Is it a simple markup change or a broad architectural issue?

---

## **Phase 2: Remediation Planning**

For each *High* and *Critical* priority issue (and Medium where feasible):

1. **Explain the Barrier**: Clearly describe the issue and how it impacts users with specific disabilities (e.g., “Users relying on screen readers cannot access this label because…”).  
2. **Provide Evidence/User Scenario**: Illustrate *how* it manifests in practice (e.g., user tries to tab through a form but cannot reach the submit button).  
3. **Propose Remediation**: Outline specific, actionable steps (e.g., “Add `role="dialog"` and `aria-modal="true"` to the modal,” or “Include a visible focus state with CSS on interactive elements.”).  
4. **Explain the Security of This Fix** *(if relevant)*: Not always needed for a11y, but if it overlaps with security concerns (like exposing certain dynamic states), clarify.  
5. **Consider Alternatives**: Mention if multiple solutions exist, and why the proposed solution is recommended.  
6. **Implications**: Any additional changes needed (e.g., updating tests, re-checking color palette, user training).

---

## **Phase 3: Implementation Proposal & Verification Guidance**

1. **Propose Code Changes**  
   - Present the code modifications in a **“before” and “after”** format.  
   - Keep changes minimal while ensuring they fully address the a11y gap.

2. **Verification Strategy**  
   - Suggest how to confirm the fix (e.g., “Test with keyboard-only navigation,” “Run a screen reader test using NVDA or VoiceOver,” “Check color contrast with a tool like axe or Lighthouse,” etc.).  
   - Ensure relevant test coverage (unit/integration/manual).

3. **No New Issues**  
   - Briefly confirm that the proposed fix does not create new accessibility issues (e.g., do the new ARIA attributes remain valid across browsers?).

---

## **Key Focus Areas (Reiteration & Additions)**

- **Keyboard-Only Use**: Tabbing, shift-tabbing, arrow key interactions.  
- **Screen Readers**: JAWS, NVDA, VoiceOver, TalkBack.  
- **WCAG Compliance**: Level A, AA, or AAA (if specified).  
- **Text & Non-Text Contrast**.  
- **ARIA Best Practices**.  
- **Semantic HTML**.  
- **Error Prevention & Handling**: Clear instructions, easy correction steps.  
- **Time Limits & Interruptions**: Are there timeouts or auto-refreshes?  
- **Motion & Animation**: Potential issues for vestibular disorders if animations or parallax are used.

## **DO NOT**  
- Fix purely cosmetic issues that do not impact accessibility.  
- Overhaul large code sections if a smaller targeted fix suffices.  
- Make changes unrelated to identified accessibility barriers.  
- Omit clear references to WCAG guidelines or rationale for recommended changes.

## **Post-Modification Explanation (For Each Proposed Change)**  
1. **Barrier Addressed**: Reference the issue identifier (e.g., A11Y-05).  
2. **Original Code Issue**: Summarize how the code was blocking or hindering accessibility.  
3. **New Code Accessibility**: Detail how the fix ensures compliance or improves usability.  
4. **Further Considerations**: Potential expansions or best practices (e.g., “Consider adding an accessibility testing tool in CI,” or “Periodic manual audits for new components.”)

---

### **Output Format**  
Please provide your findings and proposals in a **structured report** (Markdown recommended) with headings for each **Phase**.

**Start**: Begin with **Phase 0**—scoping and context. Ask me any clarifying questions about the codebase or usage context before proceeding.
