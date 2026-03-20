# Global Architecture Review System v3.3

**Version:** 2026-03-18 (v3.3)  
**Scope:** Unity-based videogames (2.5D tactics/JRPG), iOS/Android mobile apps, web applications, backend/services—**including healthcare/EMR-adjacent products**.  
**Baseline:** This v3.3 retains the v3 cross-domain architecture spine and the v3.2 operating fixes, and adds a **first-class historical-comparison layer**: every review now records current score, prior score, delta, trend, prior verdict, newly gated areas, newly introduced unknowns, and the largest mover so architecture health can be compared over time without manual diffing.

## Scoring scale and tracking

### Score states
Architecture categories use integer scores **0–10** only when there is enough evidence to support a numeric score.

- **U**: unknown / insufficient evidence. The reviewer cannot honestly support a numeric score yet.
- **N/A**: not applicable to this product or to this review scope.

**Important:** **U is not 0.** Unknown means unverified, not absent. Never average **U** as failure.

### Numeric scale
- **0**: absent / not started / capability does not meaningfully exist
- **1–2**: architecturally unsound; unsafe foundations; active harm likely under scale
- **3–4**: fragile; inconsistent; too much depends on tribal knowledge or careful operator behavior
- **5–6**: functional but debt-bearing; survivable with discipline; scale will hurt
- **7**: strong direction; coherent structure; remaining gaps are real but bounded
- **8**: mature for current scope; repeatedly proven with evidence; change is mostly local
- **9**: unusually disciplined; risks are systematically managed; strong operational posture
- **10**: exemplary; rare; sustained excellence across lanes and over time

### Front-page scorecard template
Use this **at the top of every review entry**. If a category is out of scope for that review, mark it **N/A** and do not average it. If evidence is insufficient, mark it **U** and convert that uncertainty into a ranked concern.

**Core architecture scorecard (universal)**

| Category | Current | Prior | Delta | Trend | Notes (1 sentence max) |
|---|---:|---:|---:|---|---|
| Scalability | | | | | |
| Maintainability | | | | | |
| Cohesion | | | | | |
| Coupling risk | | | | | |
| Ownership clarity | | | | | |
| Dependency explicitness | | | | | |
| Boundary / API contract quality | | | | | |
| Runtime architecture maturity | | | | | |
| Runtime stability / regression safety | | | | | |
| Data / state architecture maturity | | | | | |
| Observability / debugability | | | | | |
| Performance / resource budget maturity | | | | | |
| Tooling reliability | | | | | |
| Build / release / reproducibility maturity | | | | | |
| Verification confidence | | | | | |
| Change locality | | | | | |
| Documentation accuracy | | | | | |
| Debt retirement readiness | | | | | |

**Mandatory cross-domain overlays (always addressed; global reviews score these numerically)**

| Overlay category | Current | Prior | Delta | Trend | Notes (1 sentence max) |
|---|---:|---:|---:|---|---|
| Security / privacy / compliance / auditability | | | | | |
| Reliability / availability / recovery / incident readiness | | | | | |
| UX workflow / human-factors integrity | | | | | |
| Design system / accessibility / interaction consistency | | | | | |
| Integration / interoperability / external dependency governance | | | | | |
| Platform / distribution / device lifecycle readiness | | | | | |
| Legal / regulatory / liability posture | | | | | |
| Licensing / asset provenance / attribution hygiene | | | | | |

**Domain overlays (score only if applicable)**

| Domain overlay | Current | Prior | Delta | Trend | Notes (1 sentence max) |
|---|---:|---:|---:|---|---|
| Unity game overlay | | | | | |
| Mobile app overlay (iOS/Android) | | | | | |
| Healthcare / EMR overlay | | | | | |
| Web app + services overlay | | | | | |

### Historical comparison block
Every review must include a compact comparison block directly below the scorecards.

| Comparison item | Current review | Prior review | Delta / note |
|---|---|---|---|
| Review ID |  |  |  |
| Review date |  |  |  |
| Verdict |  |  |  |
| Weighted health index (optional) |  |  |  |
| Highest positive mover |  |  |  |
| Largest regression |  |  |  |
| Newly gated category |  |  |  |
| Newly introduced U state |  |  |  |
| Closed major concern |  |  |  |
| Still-open major concern |  |  |  |

**Trend labels:** `Up`, `Flat`, `Down`, `New`, `Recovered`, `Regressed`, `Unknown`, `N/A`.


### Tracking rules
1. Every review must reference the **immediately prior comparable review**: prior global review for a full pass, prior subsystem review for a targeted pass, prior gate review for a gate decision.
2. **Global reviews** produce numeric scores for all Core categories, all Mandatory Overlays, and every relevant Domain Overlay.
3. **Targeted reviews** score only materially impacted Core categories and relevant Domain Overlays numerically. For Mandatory Overlays, use one of the following:
 - **numeric score**: the review explicitly evaluated the overlay or the change materially moved its risk
 - **T**: touched, but no material score change
 - **NMI**: not materially implicated
 - **U**: a meaningful overlay risk surfaced, but evidence is still insufficient; escalate it as a ranked concern
4. **Score movement must be justified by evidence**: boundary changes, tests, validators, telemetry, rollout evidence, incident drills, or verified artifacts.
5. A category should not move by more than **2 points** unless the review explicitly explains the structural reason and points to major new evidence.
6. Maintain a time series per category. The only correct “overall improvement” is **sustained** category rise without regressions in safety-critical overlays.
7. **U does not get averaged.** A persistent **U** in any safety-critical area is itself a risk item and should block inflated verdicts.
8. Score ceilings and hard gates apply in both global and targeted reviews whenever the triggering condition is present.


### Evidence requirements by score band
Use score bands honestly. A category should not receive a high score just because the code “looks organized.”

- **0**: capability is absent. The review must point to what is missing.
- **1–2**: severe structural weakness is visible in code, workflow, or operations, and failure is easy to trigger.
- **3–4**: some functioning exists, but success depends on tribal knowledge, manual intervention, or luck.
- **5–6**: ordinary paths mostly work; some proof exists; edge cases, failure modes, or operational discipline remain underdeveloped.
- **7**: coherent architecture plus at least one meaningful proof path on critical seams. Known gaps are bounded and explicitly owned.
- **8**: repeated evidence across multiple flows, builds, or releases. Regressions are usually caught early and changes are mostly local.
- **9**: systematic proof exists. Operational drills, incident learning, metrics, audits, or repeated real-world use show strong control.
- **10**: sustained excellence over time across lanes, with strong proof, low surprise rate, and disciplined adaptation as scope grows.

**Overlay-specific minimums for high scores**
- **Security / privacy / compliance / auditability** cannot score **≥ 8** without a current threat model or control inventory, meaningful auditability proof, and evidence that access boundaries actually work.
- **Reliability / recovery / incident readiness** cannot score **≥ 8** without rollback or restore evidence, failure-path handling, and some form of operational drill, rehearsal, or production learning loop.
- **UX workflow / human factors** cannot score **≥ 8** without proof on the primary tasks, interruption/error handling, and evidence that the product supports users doing the right thing consistently.
- **Platform / distribution readiness** cannot score **≥ 8** without current shipping artifacts: disclosures, release gating, rollout/rollback plans, and evidence against target devices or store constraints.

### Hard gates and score ceilings
These are intentionally blunt. They prevent “engineering-visible cleanliness” from masking real-world operational, product, or legal risk.

**Global gates (all domains)**
- If **Verification confidence** is **U** or **≤ 4**, cap **Runtime stability / regression safety** at **≤ 6** and cap any “maturity” claims (runtime/data/tooling) at **≤ 7** until proof increases.
- If **Dependency explicitness** is **U** or **≤ 4**, cap **Coupling risk** and **Change locality** at **≤ 6**.

**Healthcare/EMR gates**
- If **Security / privacy / compliance / auditability** is **U** or **≤ 5**, overall verdict cannot be **On Track** (at best: **On Track with Debt**, and often **Fragile but Salvageable**), because technical safeguards and audit controls are baseline requirements for systems handling ePHI.
- If **Reliability / recovery / incident readiness** is **U** or **≤ 5**, cap overall verdict at **On Track with Debt** (clinical workflow downtime, data loss, and unplanned outages are operational safety failures, not “bugs”).
- If regulatory classification, privacy-disclosure ownership, or breach-notification assumptions are undefined, cap **Legal / regulatory / liability posture** at **≤ 4** until ownership and closure criteria exist.

**Store policy / distribution gates (mobile)**
- If privacy disclosures, health declarations, or medical-functionality claims cannot be defended, cap **Platform / distribution / device lifecycle readiness** at **≤ 4** because store compliance is a release blocker and liability multiplier.
- If shipped dependencies or assets lack a trustworthy inventory, cap **Licensing / asset provenance / attribution hygiene** at **≤ 5** until provenance and obligations are known.


## Review panel lenses and decision rules

### Why the reviewer persona must be composite
A “senior architect” lens alone reliably over-scores systems that are:
- technically modular but unusable,
- “clean code” but unsafe in edge cases,
- shippable in a game but unacceptable in healthcare environments.

This aligns with established architecture evaluation practice: architecture is evaluated against **quality attributes and stakeholder goals**, and the key output is often the *tradeoff* between them—not a single “cleanliness” score.

### Mandatory reviewer lenses
Every **global review** is authored as one synthesized voice, but it must explicitly incorporate these lenses:

- **Senior Unity/game systems architect** (runtime composition, content pipeline, tooling, performance, save/patch stability)
- **Senior mobile/web architect** (modularity, state, networking, offline/sync, release/rollback, platform constraints)
- **Senior UX/workflow designer** (task flow, cognitive load, error prevention, information architecture)
- **Senior design-systems/front-end architect** (component system integrity, accessibility, responsive behavior, interaction consistency)
- **Senior security/privacy/compliance architect** (threat model, PHI boundaries, auditability, secrets, access controls)
- **Senior reliability/platform engineer** (incident readiness, monitoring, recovery, rollout safety, operational costs)

### Disagreement resolution rule
For each major area, the review must state:
- where lenses **agree**,
- where they **disagree**,
- which lens dominates and why.

**Dominance rule:** In conflicts, prioritize in this order:
1. **Safety / compliance / user harm prevention**
2. **Reliability / recovery**
3. **Workflow correctness (can users do the right thing consistently)**
4. **Scalability / maintainability**
5. **Aesthetics and pattern purity**

This ordering is consistent with how regulated and safety-adjacent domains behave: you don’t get to trade away auditability, access control, or recovery for “engineering neatness.”

### Evidence standard
A claim is only “real” if at least one proof path exists:
- tests (unit/integration/contract/end-to-end),
- security validation and threat model artifacts,
- runtime assertions/validators,
- instrumentation and observed telemetry,
- reproducible incident or rollback drills.

This is directly compatible with OWASP’s approach of using a verification standard as a measurable baseline for mobile security.

## Rubric and overlays

### Core rubric
Keep the v2 core categories as the foundational engineering spine (they are strong and well-structured).
This v3 consolidates and slightly refactors naming so the base rubric is not game-coded.

Recommended **core** set for global reviews:

- Scalability
- Maintainability
- Cohesion
- Coupling risk
- Ownership clarity
- Dependency explicitness
- Boundary / API contract quality
- Runtime architecture maturity
- Runtime stability / regression safety
- Data / state architecture maturity
- Observability / debugability
- Performance / resource budget maturity
- Tooling reliability
- Build / release / reproducibility maturity
- Verification confidence
- Change locality
- Documentation accuracy
- Debt retirement readiness

**Category naming adjustments (to remove domain bias)**
- “Playable slice integrity” → **Core journey integrity** (still works for games; maps to critical workflows in apps)
- “Content throughput” → **Feature/content/config throughput**
- “Authoring workflow/editor ergonomics” → **Authoring/configuration/internal tooling ergonomics**
- “Solo-dev sustainability” → **Delivery sustainability** (solo or team)

### Mandatory cross-domain overlays
These overlays are not optional appendices. They are architecture categories because they determine whether the product can be safely used, shipped, supported, and scaled.

#### Security, privacy, compliance, auditability maturity
Minimum evaluation items:
- authentication/session architecture, including token/session lifecycle
- authorization model (RBAC/ABAC, least privilege, role-based screens/actions)
- PHI/PII boundaries and data-flow mapping
- encryption at rest/in transit, secrets/key management
- audit logs (who did what, when, to which record) and tamper resistance
- data retention/deletion/consent model
- third-party SDK/vendor egress risks and data-sharing controls
- threat model + abuse cases (including insider misuse)

High-score rule:
- Cannot score **≥ 8** without a current threat model or equivalent control map, direct evidence on access boundaries, and proof that auditability exists where it matters.

#### Reliability, availability, recovery, incident readiness maturity
Minimum evaluation items:
- offline behavior and degraded-mode design
- sync/idempotency/retry strategy, conflict resolution, and data integrity
- crash recovery, transactional boundaries, and save/persistence resilience
- backup/restore and rollback safety
- feature flags/kill-switch readiness for high-risk behaviors
- incident workflow, runbooks, and post-incident learning loop

High-score rule:
- Cannot score **≥ 8** without real failure-path evidence: rollback/restore proof, recovery behavior, and some form of drill, rehearsal, or production learning.

#### UX workflow and human-factors integrity
Split this cleanly from “UI architecture.” Evaluate:
- primary-task completion cost
- information architecture and navigation burden
- interruption recovery cost
- error prevention and recovery (undo, confirmations, safe defaults)
- loading/empty/error states and trust signaling
- destructive-action friction correctness
- wrong-entity risk (wrong patient / wrong record / wrong tactical target)
- novice vs expert path support

High-score rule:
- Cannot score **≥ 8** without proof on the primary workflows and the ugly states, not just the happy path.

#### Design system, accessibility, interaction consistency
Evaluate:
- component library maturity and reuse
- typography, spacing, hierarchy, and visual consistency
- accessibility conformance approach and test discipline
- keyboard, touch, controller, and responsive behavior where applicable
- platform-native interaction expectations vs intentional deviations
- consistency of interactive feedback, disabled states, and error messaging

High-score rule:
- Cannot score **≥ 8** without reusable patterns, accessibility intent, and evidence that interaction behavior is coherent across the relevant surfaces.

#### Integration, interoperability, external dependency governance
Evaluate:
- external dependency inventory (SDKs, vendors, APIs) and concentration risk
- contract versioning, backward compatibility approach, contract testing
- rate limits, outages, fallbacks, and degraded-mode behavior
- data import/export correctness, schema mapping, and transform auditability
- ownership of vendor integrations and break-glass plans when external systems fail

High-score rule:
- Cannot score **≥ 8** without contract evidence, dependency visibility, and a believable degraded-mode strategy.

#### Platform, distribution, device lifecycle readiness
Evaluate:
- store policy constraints and evidence requirements for health/medical claims
- privacy disclosure completeness and drift control
- OS version support policy and deprecation strategy
- device storage, battery, performance budgets, and crash rates
- release rollout strategy, staged deployment, and rollback plan
- release-note discipline and support/escalation readiness

High-score rule:
- Cannot score **≥ 8** without current release artifacts, rollout/rollback discipline, and proof against the actual supported device/runtime envelope.

#### Legal, regulatory, liability posture
This overlay is about whether the product’s claims, obligations, and ownership model are explicit enough to ship and support without stepping on a legal landmine.

Minimum evaluation items:
- product claims taxonomy (what the product asserts it does, and does not do)
- regulatory classification assumptions and ownership
- privacy notice / consent / disclosure alignment with actual data flows
- incident and breach-notification obligations awareness
- terms, disclaimers, BAAs, and contractual assumptions mapped to product reality
- counsel review checkpoints and escalation ownership

High-score rule:
- Cannot score **≥ 8** unless classification, claims, disclosures, and incident obligations are explicit, owned, and reflected in shipping behavior.

#### Licensing, asset provenance, attribution hygiene
This overlay is separate because asset or dependency hygiene can block shipping even when regulatory posture is otherwise fine.

Minimum evaluation items:
- third-party code, SDK, font, media, dataset, and asset inventory
- provenance for imported assets, templates, models, or generated content
- license obligation tracking (attribution, redistribution, copyleft, usage limits)
- credits / notices mechanism in product or distribution materials
- removal/replacement path for any asset or dependency that becomes non-compliant

High-score rule:
- Cannot score **≥ 8** without a maintained inventory, clear provenance, and a reliable mechanism for credits/notices and replacement.

### Domain overlays
These overlays are scored **only when applicable**, but they are real scoring rows with real discriminators. They exist because the universal rubric will otherwise wash out domain-specific failure modes.

If a product spans multiple domains (for example: mobile client + web admin + services + healthcare workflow), score **each relevant domain overlay separately**. Let the worst triggered gate dominate the verdict.

#### Unity game overlay
Minimum evaluation items:
- save/version compatibility and migration strategy
- content authoring pipeline safety, validation, and bulk-edit resilience
- frame pacing, load-time, memory, and scene-transition behavior in representative slices
- combat/tactical readability, feedback clarity, and input reliability
- editor/toolchain stability, import determinism, and content iteration speed
- playtest instrumentation, regression capture, and “do not break” slice protection

Ceilings and scoring rules:
- If save/version compatibility is unproven, cap the overlay at **≤ 6** and cap **Runtime stability / regression safety** at **≤ 6**.
- If content authoring validators are weak or absent, cap **Tooling reliability** at **≤ 6**.
- If representative performance budgets are unmeasured, cap **Performance / resource budget maturity** at **≤ 6**.

#### Mobile app overlay (iOS/Android)
Minimum evaluation items:
- lifecycle correctness (foreground/background/resume/termination)
- offline and degraded behavior under network volatility
- auth/session renewal, deeplinks, push notifications, and permission flows
- battery, storage, bandwidth, and crash-free session posture
- device and OS support policy, staged rollout, rollback, and analytics/privacy alignment
- platform-specific interaction expectations where they materially affect usability

Ceilings and scoring rules:
- If lifecycle, resume, or offline behavior is unproven, cap the overlay and **Reliability / recovery / incident readiness** at **≤ 6**.
- If permission, deeplink, or auth-renewal flows are inconsistent across supported devices, cap **UX workflow** and **Platform readiness** at **≤ 6**.
- If OS/device support policy is undefined, cap **Platform readiness** at **≤ 5**.

#### Healthcare / EMR overlay
Minimum evaluation items:
- wrong-record / wrong-patient prevention and context locking
- provenance visibility for access, edits, and order-like actions
- role-based workflow partitioning, review/sign-off, amendment, and correction flows
- downtime/degraded/offline workflow and recovery steps
- unit/time/date/identity disambiguation and alert-fatigue control
- interoperability assumptions (FHIR/SMART/export/import) and reconciliation behavior
- admin/support controls for access review, audit inspection, and incident investigation

Ceilings and scoring rules:
- If wrong-record prevention or provenance visibility is weak, cap the overlay at **≤ 5** and cap **UX workflow** and **Data / state architecture maturity** at **≤ 6**.
- If role boundaries or amendment/correction flows are unclear, cap **Security / privacy / compliance / auditability** and **Boundary / API contract quality** at **≤ 6**.
- If downtime or recovery behavior is untested, cap **Reliability / recovery / incident readiness** at **≤ 6** and cap the overall verdict at **On Track with Debt**.

#### Web app + services overlay
Minimum evaluation items:
- browser/runtime variance and responsive behavior
- session continuity, tenancy/isolation, and boundary enforcement
- API/service dependency resilience, contract versioning, and backward compatibility
- deployment topology, rollback, config drift control, and environment parity
- observability across client/server boundaries
- separation between end-user, admin, and internal operational tooling

Ceilings and scoring rules:
- If tenancy/isolation is unclear, cap the overlay and **Security / privacy / compliance / auditability** at **≤ 6**.
- If contract versioning or backward compatibility is weak, cap **Integration / interoperability / external dependency governance** at **≤ 6**.
- If rollback or config-drift control is unproven, cap **Build / release / reproducibility maturity** and **Reliability / recovery / incident readiness** at **≤ 6**.


## Evidence pack and review workflow

### Evidence pack required for every global review
This is “review fuel.” Without it, the review becomes opinion.

Minimum:
- architecture truth doc(s)
- decisions log + ADRs (architecture decision records)
- risk register (active concerns + mitigation state)
- release notes since last global review
- dependency inventory (third-party SDKs, services, APIs, licenses)
- test/verification inventory (what tests exist, what they prove)
- observability inventory (logs, metrics, traces, crash reporting)
- “known bad” list (what must not break; what is intentionally fragile)

### Review workflow
Use an architecture evaluation approach that makes tradeoffs explicit, not vibes. The Software Engineering Institute ATAM framing is useful here: evaluate a system relative to quality goals, expose architectural risks, and clarify tradeoffs.

Workflow sequence:
1. **Stakeholder-quality attribute alignment**
 Identify the top 3–5 quality attributes per domain (e.g., security + auditability + recovery for healthcare; performance + authoring throughput for games).
2. **Reality inspection**
 Inspect code, runtime behavior, tools, pipelines, and release artifacts.
3. **Risk and sensitivity point identification**
 Find the “if this fails, everything fails” seams (permissions boundaries, save/persistence, sync/retries, composition root, build pipeline).
4. **Score with ceilings**
 Apply gates and cap scores where proof or safety is missing.
5. **Rank concerns by severity and time-to-regret**
 Prioritize by the *cost of delay* and *blast radius*, not annoyance.
6. **Prescribe the cheapest honest remedy**
 Surgical fix vs refactor vs redesign vs rewrite.
7. **Define verification**
 Every remedy must include a proof plan (tests, validators, telemetry, drills).

### Cadence and review plan
Use different depths on purpose. A review system this global becomes noise if you force the full ceremony every week.

- **Weekly hotspot / delta review (15–30 minutes):** inspect what changed, what could now break, which gates moved, and whether any new **U** states or blocker risks were introduced.
- **Targeted subsystem review (30–120 minutes):** run between globals on risky seams such as save/migration, auth/roles, sync, UI workflow, vendors, release pipeline, or performance hotspots.
- **Full global review (default monthly):** score the full system with all required lenses, all Core categories, all Mandatory Overlays, and relevant Domain Overlays.
- **Biweekly full global review** is acceptable during active architectural churn, major refactors, or pre-launch hardening.
- **Milestone gate review:** run before major phase shifts (beta launch, app-store submission, live-service scale change, EMR integration, major content expansion).
- **Post-release / post-incident review:** feed operational reality back into the architecture scores instead of letting incidents live in a separate universe.


## Weighting profiles and score-ceiling gates

### Why weighting must be domain-aware
A single weighting profile will systematically under-penalize failures that matter most in a given domain. Quality depends on stakeholder needs, risk posture, and operating context; that is why this system uses weighting **profiles**, not one universal priority order.

### Weight selection governance
Weighting is a governance choice, not a post-hoc way to make the verdict look nicer.

Rules:
1. **Declare the active weighting profile before scoring begins.**
2. If you use a custom or hybrid profile, record the rationale in **one short paragraph**.
3. **Lock the weights once draft scoring starts.** Do not retroactively tune them to improve or worsen the verdict.
4. If multiple products with different risk postures are reviewed together, either:
 - run separate scorecards, or
 - declare a hybrid weighting table up front and explain why.
5. **U, N/A, T, and NMI are excluded from weighted averages.** They still generate risk or scope implications.

### Recommended weighting presets
Use these as multipliers (default **1.0**). This lets you compute a weighted health index while preserving raw category trends.

**Unity game weighting**
- Runtime stability / regression safety, performance, tooling, authoring/configuration/internal tooling ergonomics, and core-journey protection: **1.3–1.6**
- Security / compliance: **0.6–0.9** (unless accounts, monetization, UGC, or sensitive data raise the risk)
- Accessibility / design-system consistency: **0.9–1.1**

**Mobile/web app weighting**
- UX workflow, platform/distribution, reliability/recovery, and integration governance: **1.3–1.6**
- Performance / resource budget maturity: **1.1–1.3**
- Tooling / authoring ergonomics: **0.8–1.1**

**Healthcare/EMR weighting**
- Security / privacy / compliance / auditability: **1.6–2.0**
- Reliability / recovery / incident readiness: **1.4–1.8**
- UX workflow / human factors: **1.3–1.6**
- Integration / interoperability / external dependency governance: **1.2–1.5**
- Legal / regulatory / liability posture: **1.2–1.5**

### Domain-specific score ceilings
**Healthcare/EMR**
- If auditability is weak, cap **Data / state architecture maturity** at **≤ 6** (you do not “own” integrity without provenance).
- If authorization boundaries are weak, cap **Ownership clarity** and **Boundary / API contract quality** at **≤ 6**.
- If legal/regulatory ownership is undefined, cap **Legal / regulatory / liability posture** at **≤ 4**.

**Mobile distribution**
- If store-policy compliance artifacts are missing, cap **Build / release / reproducibility maturity** and **Platform / distribution / device lifecycle readiness** at **≤ 5** because “can build locally” is not “can ship honestly.”

**Licensing / provenance**
- If third-party dependency or asset provenance is materially incomplete, cap **Licensing / asset provenance / attribution hygiene** at **≤ 5** and treat the gap as a release blocker if already shipping.


## Output templates and operating modes

### Review modes
Use the smallest honest review mode that still answers the real risk question.

#### 1) Full global review
Use when: project-health assessment, milestone health, pre-launch, post-incident recovery, or major direction changes.

Required outputs:
- full front-page scorecard (all Core + all Mandatory Overlays + relevant Domain Overlays)
- declared reviewer lenses
- declared weighting profile
- single verdict
- ranked concerns with remedies and verification
- “do not break” list
- follow-through plan

#### 2) Targeted subsystem review
Use when: one risky seam needs a deeper pass (save/migration, auth/roles, sync, battle loop, workflow redesign, vendor integration, release pipeline).

Required outputs:
- impacted Core categories scored numerically
- relevant Domain Overlay scored numerically if applicable
- Mandatory Overlay status for each row: **numeric score**, **T**, **NMI**, or **U**
- specific blast-radius statement
- cheapest honest remedy and proof plan

#### 3) Fast gate review
Use when: release go/no-go, vendor/SDK addition, app-store submission, security delta, or milestone readiness decision.

Required outputs:
- gate-focused scorecard rows only
- pass / conditional pass / block decision
- blocking evidence gaps
- exact closure evidence required to pass

#### 4) Five-minute architecture checkpoint
Use when: immediately after a meaningful change, refactor, incident, or design decision.

Required outputs:
- what changed
- what could now break
- which category or overlay likely moved
- whether a bigger review is now required

### Required outputs for every global review
Every global review ships with:
- the front-page scorecards
- the historical comparison block
- a declared weighting profile
- a single verdict
- ranked concerns (severity + urgency)
- remedies with verification
- a “do not break” list
- follow-through plan (who/what/when)

### Global review entry template
Use this as the canonical format.

**Review ID:** AR-YYYY-MM-DD-XX
**Scope:** Global (full project health)
**Prior comparable review ID:** AR-YYYY-MM-DD-XX
**Products included:** Game / Mobile / Web / Services (select)
**Reviewer lenses applied:** Game / Mobile-Web / UX / Design-System / Security / Reliability
**Weighting profile:** Unity / Mobile-Web / Healthcare / Hybrid (declare before scoring)
**Timebox:** [hours]

**Front-page scorecards:** *(paste the tables from the scoring section, including Current / Prior / Delta / Trend columns)*

**Historical comparison block:** *(paste the comparison table from the scoring section)*

**Verdict:** On Track / On Track with Debt / Fragile but Salvageable / Heading Toward Rewrite Debt / Unsafe Foundation for Scale

**Executive summary (5–10 sentences):**
- What is structurally strong
- What is structurally dangerous
- What must happen next, in order

**Score movement summary**
- Biggest positive mover and why
- Largest regression and why
- Newly gated category or newly introduced U state
- Whether the verdict changed relative to the prior review

**Ranked concerns (no fluff)**
For each concern:
- Severity (1–5)
- Likely blast radius
- Why it matters (business + user + operational)
- Remedy type (surgical / refactor / redesign / rewrite)
- Verification plan

**Section findings**
- Project-wide architecture and ownership boundaries
- Runtime / flow / orchestration
- Data / state / persistence + migration
- UI architecture
- UX workflow / human factors
- Tooling / pipelines / authoring
- Verification + observability
- Build / release + distribution readiness
- Security / privacy / compliance / auditability
- Reliability / recovery / incident readiness
- Integration / interoperability governance
- Legal / regulatory / liability posture
- Licensing / asset provenance / attribution hygiene

**Non-negotiables (“do not break casually”)**
List the top 5–15 behaviors that are currently protecting the product.

**Verification plan**
Must include at least:
- what new test / validator / telemetry / drill proves the remediation
- what regression would look like
- what evidence must be attached to mark the concern closed

### Targeted subsystem review template
**Review ID:** AR-YYYY-MM-DD-XX-T
**Scope:** Targeted (subsystem)
**Prior comparable review ID:** AR-YYYY-MM-DD-XX-T / AR-YYYY-MM-DD-XX / None
**Subsystem:** [save / auth / battle loop / sync / UI flow / release pipeline / vendor integration / etc.]
**Reviewer lenses applied:** [select only what is materially needed]
**Weighting profile:** [declare]
**Timebox:** [minutes / hours]

**Required scorecard handling**
- Score impacted Core categories numerically.
- Score relevant Domain Overlay numerically if applicable.
- For each Mandatory Overlay, mark **numeric score**, **T**, **NMI**, or **U**.
- If a targeted review reveals a material regression in a Mandatory Overlay, convert that overlay to a numeric score immediately.

**Output**
- subsystem verdict
- blast radius
- what moved since the prior comparable review
- ranked concerns
- remedy + proof plan
- escalation note if a full global review is now warranted

### Fast gate review template
**Scope:** Gate
**Question:** [Should this ship / integrate / launch / merge / submit?]
**Prior comparable gate:** Pass / Conditional Pass / Block / None
**Gate overlays:** [security / reliability / platform / legal / licensing / etc.]
**Decision:** Pass / Conditional Pass / Block

**Required**
- gate-relevant rows only
- current vs prior gate movement
- blocking gaps
- exact closure evidence
- fallback or rollback path if conditionally passed

### Five-minute architecture checkpoint template
**Trigger:** [change / incident / refactor / new vendor / new release assumption]
**Prior comparable review:** [ID / date / none]
**What changed?**
**What could now break?**
**Which categories or overlays likely moved versus the prior review?**
**Need targeted review or gate review?** yes / no

### Incident and postmortem integration
For apps, services, and any product with operational reality, incidents must feed architecture scoring. Treat each incident as an architecture signal and use postmortems to expose systemic causes rather than blame. Production incidents, rollback failures, audit gaps, or support escalations should move scores when they reveal the real operating posture.


## Legal, regulatory, privacy, liability, and licensing

### Regulatory classification is an architecture input, not a legal afterthought
Your review must explicitly record which regime you believe applies, because that decision changes architecture priorities:

- **HIPAA context:** If the product handles ePHI for a covered entity or business associate, HIPAA Security Rule technical safeguards (including audit controls) become baseline system requirements.
- **Consumer health apps context:** If you are not in HIPAA but you are a vendor of personal health records or related entities, FTC breach-notification obligations may apply.
- **Medical device software function context:** If the software has device software functions or mobile medical application functionality, FDA oversight may apply depending on intended use and risk.

### Store policy compliance is both legal risk and release risk
- The App Store review framework explicitly includes Safety and Legal considerations, and privacy disclosures must remain accurate.
- Google Play requires health declarations for health/medical apps and imposes restrictions and disclosure requirements around health functionality and sensitive health data.

### Architecture review checklist for legal / regulatory / liability posture
At minimum, the review must verify:

**Claims and disclosures**
- Product marketing and feature claims match implemented reality.
- Privacy policy and in-app disclosures match actual data collection, sharing, and retention behavior.
- Data retention, deletion, and consent flows are implemented as described.

**Classification and ownership**
- Regulatory/classification assumptions are explicit.
- Ownership exists for legal/compliance decisions and counsel checkpoints.
- BAAs, vendor terms, and contract assumptions match how the system actually operates.

**Incident and breach posture**
- Incident response and disclosure ownership is defined.
- Auditability exists where regulated or safety-sensitive workflows require it.
- Notification assumptions, timelines, and escalation paths are not implicit.

### Architecture review checklist for licensing / asset provenance / attribution hygiene
At minimum, the review must verify:

**Inventory and provenance**
- Third-party libraries, SDKs, fonts, media, Unity assets, datasets, templates, and generated content are inventoried.
- Provenance is known for imported assets and dependencies.
- There is a trustworthy owner for keeping the inventory current.

**Obligations and compliance**
- License obligations (attribution, redistribution, copyleft, usage limits, seat restrictions) are known and tracked.
- Credits, notices, and attribution mechanisms exist in product and/or distribution materials.
- There is a removal or replacement path for anything that becomes non-compliant.

### Liability posture guidance
This document is a review operating system, not legal advice—but it must force the legal inputs to exist:

- identify who owns regulatory classification decisions
- identify counsel review checkpoints (pre-release, post-incident, vendor onboarding)
- treat unknown applicability as a risk item with explicit closure criteria
- treat unowned compliance assumptions as architecture debt with a timer on it

If you adopt only one principle here: **unowned legal or licensing assumptions are architecture debt with external enforcement attached.**
