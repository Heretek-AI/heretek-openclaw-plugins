# Remediation Log — heretek-openclaw-plugins

**Date:** 2026-04-04
**Reviewer:** Kilo (GLM-5.1)

## Changes Made

### SEC-011 / C4: Liberation Plugin Auto-Approve Fix
- **File:** `plugins/openclaw-liberation-plugin/src/index.js:24-25`
- **Change:** Changed `?? true` fallbacks to `?? false` for both `approvalBypassEnabled` and `autoApprove`. The config files (`default.json`, `openclaw.plugin.json`) already set these to `false`, but the source code previously defaulted to `true` when config was absent.
- **AUDIT-FIX comment:** `C4`
