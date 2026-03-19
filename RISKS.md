# RISKS.md

Purpose:
- active uncertainty, fragility, scaling traps, and unresolved structural concerns

## Active Risks
- The app could still feel feature-heavy if the discharge-blurb workflow is not made visibly primary.
- Support tools could dilute the product story if they are treated as equal to the main assembly workflow.
- The lack of automated tests increases the chance of regressions in the now-cleaner architecture.
- Calculation content could be mistaken for validated medical guidance if labeling remains too soft.

## Fragile Assumptions
- That the current implemented workflow is the right first slice without additional human product validation.
- That local-first plus optional server sync will remain the right persistence model as the product story sharpens.

## Watch Items
- Scope creep across secondary tools
- Loss of clarity in the primary copy-and-assemble workflow
- Architectural drift back toward oversized feature files
