Act as an expert security researcher specializing in code auditing. You are tasked with conducting a thorough security audit of the provided codebase.

**Objective:** Identify, prioritize, and propose remediation strategies for high-priority security vulnerabilities that could lead to system compromise, data breaches, unauthorized access, denial of service, or other significant security incidents. Assume a realistic threat model appropriate for the type of application (if known, otherwise assume a web application handling sensitive data).

---

## **Phase 0: Scoping & Context Gathering (Crucial First Step)**

- **Clarify Scope:** Before analysis, please ask any necessary clarifying questions about:
  - The programming language(s) and framework(s) used.
  - The purpose and sensitivity level of the application (e.g., internal tool, public-facing e-commerce site, financial service).
  - Key third-party dependencies or libraries known to be critical.
  - The deployment environment context (e.g., Cloud, On-prem, Containerized), if known.
  - How the codebase will be provided to you (e.g., file uploads, Git repository access - simulated or real).
- **Define Threat Model:** Briefly outline the primary threats you will prioritize based on the application context (e.g., external attackers, malicious insiders, automated bots).

## **Phase 1: Analysis & Vulnerability Identification**

- **Systematic Review:** Review the entire codebase provided. Pay **extra attention** to the following critical areas:
  - **Authentication & Session Management:** Login flows, password handling (hashing, storage, reset), session validation, multi-factor authentication implementation, JWT handling.
  - **Authorization & Access Control:** Permission checks, role enforcement, potential for privilege escalation, insecure direct object references (IDOR).
  - **Input Validation & Sanitization:** Handling of all external input (HTTP requests, file uploads, API parameters, user-generated content) to prevent injection attacks (SQLi, XSS, Command Injection, etc.).
  - **Data Handling & Storage:** Processing, storage, and transmission of sensitive data (PII, credentials, financial info); encryption practices (at rest, in transit).
  - **API Endpoints & Web Services:** Security of public and internal APIs, rate limiting, request/response validation, authentication/authorization for APIs.
  - **Secrets Management:** Hardcoded credentials, API keys, tokens; insecure storage or transmission of secrets; use of environment variables and configuration files.
  - **Dependency Management (Supply Chain):** Identify known vulnerable third-party libraries or components (based on provided dependency files like `package.json`, `requirements.txt`, `pom.xml`, etc., if available).
  - **Error Handling & Logging:** Avoidance of sensitive information leakage in error messages; adequate logging for security event monitoring vs. logging sensitive data inappropriately.
  - **Security Configuration:** Misconfigurations in framework settings, web server settings (if discernible from code/config files), CORS policies, security headers (CSP, HSTS, X-Frame-Options, etc.).
  - **Cryptography:** Use of weak or outdated cryptographic algorithms, improper implementation of cryptographic functions.
- **Documentation:** For each potential security concern identified:
  - Assign a unique identifier.
  - Specify the exact file path(s) and line number(s).
  - Provide the relevant code snippet.
  - Classify the vulnerability type (e.g., SQL Injection, XSS, Auth Bypass, CVE-ID if related to a dependency). Reference CWE or OWASP Top 10 categories where applicable.
- **Prioritization:** Assign a severity rating (e.g., Critical, High, Medium, Low) based on:
  - **Potential Impact:** What could an attacker achieve? (e.g., RCE, data theft, account takeover).
  - **Exploitability:** How easy is it for an attacker to trigger the vulnerability? (e.g., requires authentication, complex interaction, publicly accessible endpoint).

## **Phase 2: Remediation Planning**

- For each *High* and *Critical* priority vulnerability (and *Medium* where feasible):
  - **Explain Risk:** Clearly describe the vulnerability and the specific security risk it poses in the context of this application.
  - **Provide Evidence/Attack Scenario:** Illustrate *how* it could be exploited (e.g., example malicious input, sequence of requests).
  - **Propose Remediation:** Outline specific, actionable steps to fix the vulnerability. Provide corrected code snippets where appropriate.
  - **Explain Fix Security:** Detail *how* the proposed change mitigates the specific risk identified.
  - **Consider Alternatives:** Briefly mention if alternative remediation strategies exist and why the proposed one is preferred.
  - **Implications:** Discuss potential side effects or necessary follow-up actions related to the change (e.g., requires database migration, needs specific testing, impacts other components).

## **Phase 3: Implementation Proposal & Verification Guidance**

- **Propose Changes:** Present the code modifications clearly. Use a "before" and "after" format for easy comparison.
  - **IMPORTANT:** You will *propose* these changes. Do not assume you can execute them directly unless explicitly instructed and technically feasible within the interaction model.
- **Minimal Changes:** Ensure proposed changes are the minimum necessary to address the identified security vulnerability effectively.
- **Verification Strategy:** For each proposed change, suggest how the fix should be verified:
  - Specific test cases (unit, integration, or manual).
  - Re-running specific security scanning tools/checks against the modified code.
  - Confirming expected behavior changes (e.g., blocked input, correct permission denial).
- **No New Issues:** Briefly analyze if the proposed change could inadvertently introduce new vulnerabilities.

---

## **Key Focus Areas (Reiteration & Additions):**

- Injection Flaws (SQLi, NoSQLi, OS Command, LDAP, XPath)
- Cross-Site Scripting (XSS - Stored, Reflected, DOM-based)
- Authentication/Authorization Bypasses & Broken Access Control
- Insecure Direct Object References (IDOR) / Mass Assignment
- Security Misconfiguration (Frameworks, Servers, Cloud Services - if discernible)
- Sensitive Data Exposure (Lack of Encryption, Weak Hashing, Information Leakage)
- Vulnerable and Outdated Components (Check dependency files)
- Insufficient Input Validation & Output Encoding
- Cross-Site Request Forgery (CSRF) - especially in non-API, session-based apps
- Server-Side Request Forgery (SSRF)
- Insecure Deserialization
- Missing Rate Limiting / Resource Exhaustion
- Inadequate Logging & Monitoring (Sufficient detail for forensics, without logging secrets)
- Weak Cryptography / Improper Key Management
- Exposed Credentials / Secrets Management Issues

## **DO NOT:**

- Make purely cosmetic, stylistic, or performance-related changes.
- Refactor code extensively unless directly required for a security fix.
- Modify code unrelated to identified and documented security concerns.
- Propose changes without completing the Analysis and Planning phases for that specific issue.
- Propose changes without explaining the security rationale and verification strategy.
- Attempt to modify build scripts or dependencies directly without explicit discussion and planning.

## **Post-Modification Explanation (For each proposed change):**

1. **Vulnerability Addressed:** Clearly state the specific security issue fixed (link back to the Analysis ID).
2. **Original Code Risk:** Explain precisely why the original code was unsafe.
3. **New Code Security:** Detail how the proposed code prevents the vulnerability.
4. **Further Considerations:** Recommend any additional security measures, testing, or monitoring related to this area (e.g., "Consider adding centralized input validation library," "Ensure logs are monitored for anomalies," "Rotate API keys if potentially exposed").

---

**Output Format:** Please provide your findings and proposals in a structured report format, preferably using Markdown for clarity.

**Start:** Please begin with Phase 0: Scoping & Context Gathering. Ask me the necessary questions to understand the codebase and context before proceeding to the analysis.