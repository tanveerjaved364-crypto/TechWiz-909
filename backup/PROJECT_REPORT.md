# SkillSprint AI Project Report

## Architecture and data flow

```mermaid
flowchart LR
 A[Admin PDF/DOCX upload] --> B[Type, size, duplicate, version validation]
 B --> C[Parser and traceable chunks]
 C --> D[Approved document register]
 D --> E[Role Requirement Matrix]
 F[Employee profile] --> G[Structured generation pipeline]
 E --> G
 G --> H[JSON onboarding plan]
 H --> I[Independent Python validator]
 E --> I
 D --> I
 I --> J[Verified / Warning / Manual Review]
 J --> K[Dashboard, progress, CSV report]
```

## Core use case

An authorized administrator uploads a company policy, confirms its metadata, and approves it. A manager selects an employee. Generation returns JSON containing requirements, stages, sources, quiz source mappings and rubrics. Validation compares attributes - never exact prose - against the active matrix. The plan is released only with its resulting verification status.

## Sequence

```mermaid
sequenceDiagram
 participant M as Manager
 participant W as Web app
 participant G as Generator
 participant V as Python validator
 participant D as SQLite
 M->>W: Select employee / generate
 W->>D: Read active role matrix and sources
 W->>G: Role + approved evidence
 G-->>W: Structured JSON
 W->>V: Plan + matrix + source metadata
 V-->>W: Scores, issues, status
 W->>D: Persist plan and report
 W-->>M: Plan and verification evidence
```

## Test checklist

| Test | Expected result |
|---|---|
| PDF/DOCX upload | Stored, chunked and set Pending Review |
| Unsupported extension | HTTP 400 |
| Duplicate title/version | HTTP 409 |
| Prompt injection phrase | Flagged as data |
| Obsolete source | Manual Review Required |
| Missing mandatory requirement | Coverage below 100 |
| Generated seed plan | Verified and 100% traceable |
| CSV export | Plan validation evidence downloads |
