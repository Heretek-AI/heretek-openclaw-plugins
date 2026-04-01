# Consensus Ledger

This folder stores triad consensus records for major version changes.

## Structure

Each consensus record is stored as `consensus-YYYYMMDD-HHMMSS.json` with:
- Proposed change details
- Triad member votes (3 members required)
- Timestamp of each vote
- Final decision and rationale

## Consensus Rules

- **MAJOR version changes**: Require 3/3 triad consensus
- **MINOR version changes**: Require 2/3 triad consensus  
- **PATCH version changes**: Single maintainer approval

## Files

- `pending/` - Consensus requests awaiting votes
- `approved/` - Approved consensus records
- `rejected/` - Rejected consensus records
- `history.json` - Index of all consensus decisions
