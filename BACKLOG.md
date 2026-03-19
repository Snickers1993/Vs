# BACKLOG.md

Purpose:
- deferred work, bugs, tech debt, and future ideas that are not approved current work

## Near-Term
- Reduce the home-page surface so the discharge-blurb workflow reads as the clear primary lane.
- Add automated coverage for auth, section CRUD, and local/server merge behavior.
- Revisit workspace, shared blurbs, and handout UX for small friction cuts.

## Medium-Term
- Expand the first validated workflow into a stronger product surface.
- Decide whether handouts, shared blurbs, and calculations remain in the primary shell or move behind lighter secondary navigation.
- Design a cross-platform desktop/web shell that preserves the same core workflow and interaction model intended for a future iOS app.
- Establish project-specific conventions if they differ from the global default.

## Long-Term / Speculative
- Additional workflows, features, and integrations to be defined after the first slice is proven.

## Technical Debt
- Add tests around section data flow and synchronization.
- Consider cleaning up repeated object URL creation in handout views.
- Continue tightening module boundaries if additional home-surface complexity appears.
