# Implementation Plan: Piped-In Data Text Substitution

## Overview

Add support for piped-in data that can be substituted into text elements (information screens, prompts, form labels/descriptions) during interviews. The data comes from external sources and is pre-populated before the interview starts.

## Requirements Summary

- **Data Source**: Pre-populated values inserted into interview JSON from external sources only
- **Storage**: New `pipedData` field in the interview JSON (top-level, alongside `network`)
- **Syntax**: Double braces `{{fieldName}}` for text substitution
- **Display Locations**: Information screen titles/content, prompts, form labels/descriptions
- **NOT in scope**: Interactive UI elements (buttons), data collected during the interview

## Data Structure

```typescript
// Example pipedData structure
type PipedData = Record<string, string | number | boolean>;

// Example interview JSON with pipedData
{
  "network": { "nodes": [], "edges": [], "ego": {...} },
  "pipedData": {
    "participantName": "John Doe",
    "previousInterviewDate": "2024-01-15",
    "waveNumber": 2,
    "customField": "Some value"
  }
}
```

## Implementation Tasks

### 1. Database Schema Update
**File**: `lib/db/schema.prisma`

Add optional `pipedData` JSON field to Interview model:
```prisma
model Interview {
  // ... existing fields
  pipedData     Json?   // New field for piped-in display data
}
```

Run `pnpm prisma migrate dev` after schema change.

---

### 2. Type Definitions
**Files**:
- `schemas/interviews.ts`
- `lib/interviewer/ducks/modules/setServerSession.ts`
- `lib/interviewer/store.ts`

Add PipedData type and update session types:
```typescript
// schemas/interviews.ts
export type PipedData = Record<string, string | number | boolean | null>;

// Update ServerSession type to include pipedData
type ServerSession = {
  // ... existing fields
  pipedData?: PipedData;
};

// Update Session type in store.ts
type Session = {
  // ... existing fields
  pipedData?: PipedData;
};
```

---

### 3. Text Substitution Utility
**New File**: `lib/interviewer/utils/pipedText.ts`

```typescript
import type { PipedData } from '~/schemas/interviews';

/**
 * Substitutes {{key}} placeholders in text with values from pipedData.
 * Missing keys are replaced with empty string.
 */
export function substitutePipedText(
  text: string,
  pipedData?: PipedData
): string {
  if (!pipedData || !text) return text ?? '';

  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = pipedData[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

/**
 * React hook for piped text substitution.
 * Returns a function that substitutes text using pipedData from Redux state.
 */
export function useSubstitutePipedText(): (text: string) => string {
  const pipedData = useSelector(getPipedData);
  return useCallback(
    (text: string) => substitutePipedText(text, pipedData),
    [pipedData]
  );
}
```

---

### 4. Redux State Updates

**File**: `lib/interviewer/ducks/modules/session.js`

Update session reducer to handle `pipedData` in `SET_SERVER_SESSION`:
- Extract `pipedData` from server session payload
- Store in session state

**File**: `lib/interviewer/selectors/session.ts`

Add selector for pipedData:
```typescript
export const getPipedData = (state: RootState): PipedData | undefined => {
  const session = getActiveSession(state);
  return session?.pipedData;
};
```

---

### 5. Integration: Information Interface
**File**: `lib/interviewer/containers/Interfaces/Information.js`

Update to substitute piped text in:
- `stage.title`
- `item.content` (for text items)

```javascript
// Add hook usage
const substitutePipedText = useSubstitutePipedText();

// In render
<h1>{substitutePipedText(title)}</h1>

// In getItemComponent for text type
<Markdown label={substitutePipedText(item.content)} ... />
```

---

### 6. Integration: Prompts Component
**File**: `lib/interviewer/components/Prompts.js`

Update to process prompt text through substitution:

```javascript
const substitutePipedText = useSubstitutePipedText();

// Process prompts before passing to UIPrompts
const processedPrompts = prompts.map(p => ({
  ...p,
  text: substitutePipedText(p.text)
}));
```

---

### 7. Integration: Form Fields
**File**: `lib/interviewer/containers/Field.js`

Update to substitute piped text in:
- Field labels
- Field descriptions/hints

The specific implementation depends on how labels are currently passed to the Field component.

---

### 8. Update SyncInterview (if needed)
**File**: `actions/interviews.ts`

If `pipedData` should be synced back to the server (unlikely since it's read-only), update the sync action. Otherwise, ensure it's preserved and not overwritten during sync.

---

## Files to Modify

| File | Change |
|------|--------|
| `lib/db/schema.prisma` | Add `pipedData` field to Interview |
| `schemas/interviews.ts` | Add `PipedData` type |
| `lib/interviewer/store.ts` | Add `pipedData` to Session type |
| `lib/interviewer/ducks/modules/setServerSession.ts` | Update ServerSession type |
| `lib/interviewer/ducks/modules/session.js` | Handle pipedData in reducer |
| `lib/interviewer/selectors/session.ts` | Add `getPipedData` selector |
| `lib/interviewer/utils/pipedText.ts` | **NEW** - Substitution utility |
| `lib/interviewer/containers/Interfaces/Information.js` | Apply substitution |
| `lib/interviewer/components/Prompts.js` | Apply substitution |
| `lib/interviewer/containers/Field.js` | Apply substitution |

## New Files

| File | Purpose |
|------|---------|
| `lib/interviewer/utils/pipedText.ts` | Text substitution utility and hook |

## Usage Example

### Inserting piped data via SQL:
```sql
INSERT INTO "Interview" (..., network, "pipedData")
VALUES (
  ...,
  '{"nodes": [], "edges": [], "ego": {...}}'::jsonb,
  '{"participantName": "John", "waveNumber": 2}'::jsonb
);
```

### In protocol content (e.g., Information screen):
```
Welcome back, {{participantName}}! This is wave {{waveNumber}} of the study.
```

### Rendered output:
```
Welcome back, John! This is wave 2 of the study.
```

## Testing Plan

1. **Unit Tests** for `substitutePipedText`:
   - Basic substitution works
   - Missing keys return empty string
   - Null/undefined pipedData returns original text
   - Nested braces handled correctly
   - Non-string values converted properly

2. **Integration Tests**:
   - Create interview with pipedData via API/SQL
   - Verify substitution appears in Information screens
   - Verify substitution appears in Prompts
   - Verify substitution appears in Form labels

3. **Manual Testing**:
   - Create test protocol with placeholder text
   - Create interview with pipedData
   - Run through interview verifying substitutions

## Migration Notes

- This is an additive change - no existing interviews are affected
- The `pipedData` field is optional, so no migration of existing data needed
- Protocols don't need changes to use piped data - just use `{{key}}` syntax in text
