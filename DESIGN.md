# DESIGN.md

Purpose:
- grand design and master reference
- system intent
- formulas, semantics, feature descriptions, and user experience goals

## Vision
VetBlurbz should become a polished, usability-first app/project that showcases strong workflow design for veterinary software use cases.

## Current Design Truth
- Usability and clean interface are paramount.
- Efficient filtering and low-friction workflow should be first-class design goals.
- The project should help demonstrate Nick's front-end, product-design, and workflow-thinking strengths.
- This is not primarily a backend/HIPAA/authentication proof project.
- The first concrete slice is a discharge-blurb workflow: store reusable sections, find them quickly, assemble them into a workspace, and copy the result with minimal friction.
- Support tools should remain subordinate to that main workflow, not compete with it for primary attention.

## Systems
- Core content system
  - collections of reusable blurbs by type: exams, diseases, medications, recommendations, blurbs, discharge templates, monitoring
- Workspace system
  - assemble multiple blurbs into a final copied output
- Personal support system
  - scratchpad and handouts for sidecar workflow support
- Shared inspiration system
  - browse public blurbs from other users and local public items
- Utility system
  - lightweight calculation tables for quick reference, clearly marked as estimate-oriented

## Formulas / Calculations
- Fast calculations are currently lightweight editable tables intended as workflow helpers, not validated clinical protocol engines.
- Any future medical-calculation expansion should be treated carefully and documented explicitly before being positioned as a primary feature.
