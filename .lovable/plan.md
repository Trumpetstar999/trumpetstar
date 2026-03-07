## Understanding the Current State

- The `levels` table has a `language` column (currently all levels are `language: 'de'`)
- The user will add English levels in the admin panel and set their `language` to `'en'`
- The app already knows the user's language (`language` from `useLanguage()` — values: `'de'`, `'en'`, `'es'`, `'sl'`)
- Currently `fetchLevels()` in `LevelsPage.tsx` fetches **all** active levels without any language filter

## What Needs to Change

The logic should be:

- **German users** (`language = 'de'`): see only levels with `language = 'de'` (or `null`/`'all'`)
- **English users** (`language = 'en'`): see only levels with `language = 'en'` (or `null`/`'all'`)
- **Other languages** (ES, SL): currently no dedicated levels → show `de` levels as fallback (or `null`/`'all'`)

This means: levels tagged `language = 'en'` are **only shown to English-speaking users** and are hidden from German/ES/SL users.

## Plan

### 1. Update `fetchLevels()` in `src/pages/LevelsPage.tsx`

Add a language filter to the Supabase query. After the user's language is loaded, re-fetch levels when language changes.

**Query logic:**

```
.or(`language.eq.${language},language.eq.all,language.is.null`)
```

This ensures:

- English users see `language = 'en'` and `language = 'all'` levels
- German users see `language = 'de'` and `language = 'all'` levels
- ES/SL users fall back to `de` levels (since no ES/SL content exists yet)

Fallback rule: if `language` is `'es'` or `'sl'`, also fetch `'de'` levels (since there are no dedicated ES/SL levels).

### 2. Re-fetch when language changes

Add `language` to the `useEffect` dependency array that calls `fetchLevels()` so the level list refreshes when the user switches language.

### 3. File to edit

Only `src/pages/LevelsPage.tsx`:

- Change `useEffect` that calls `fetchLevels()` to depend on `language`
- Pass `language` to `fetchLevels(language)`  
- Inside `fetchLevels`, build the filter:
  - `'en'` → filter for `language = 'en'` OR `language IS NULL` OR `language = 'all'`
  - `'de'` → filter for `language = 'de'` OR `language IS NULL` OR `language = 'all'`
  - `'es'`/`'sl'` → fallback to `'de'` filter (no dedicated content)

No database migration needed — the `language` column already exists on the `levels` table.

Mache noch eine manuelle auswahlmöglichkeit im Adminbereich pro Level für All, DE, EN, ES, SL

### Summary of changes


| File                       | Change                                                                         |
| -------------------------- | ------------------------------------------------------------------------------ |
| `src/pages/LevelsPage.tsx` | Filter levels by user language in `fetchLevels()`; re-fetch on language change |


No other files need changes — `LevelSidebar`, `SectionRow`, and `VideoCard` all consume the already-filtered `filteredLevels` array.