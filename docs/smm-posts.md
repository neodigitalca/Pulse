# SMM Posts (content calendar)

**SMM Posts** is the Social workspace that builds an AI content calendar sheet. The manager tab id is still `content-calendar`. The nav label is **SMM Posts** (it used to be Calendar).

## Intent

Produce scheduled social rows (Facebook/Instagram + LinkedIn) with a landing-page URL, optional image, and a prompt modifier. Rows are generated in the browser, not published from this sheet.

## Navigation

| Item | Value |
|------|-------|
| Mega menu | Social → **SMM Posts** |
| Hash | `#content-calendar` |
| Legacy hash | `#content-creator` (redirects to `content-calendar`) |
| Sibling pills | **GBP** (`gbp-post`), **SMM Posts**, **Creator** (`social-creator`) |

Source: [`manager-nav-sections.ts`](../src/components/manager/manager-nav-sections.ts), [`SocialPlatformPills.tsx`](../src/components/social/SocialPlatformPills.tsx), [`Index.tsx`](../src/pages/Index.tsx).

The page mounts [`UnifiedWorkspaceChrome`](../src/components/shared/UnifiedWorkspaceChrome.tsx) via [`ContentCreatorWorkspaceHeader.tsx`](../src/components/social/content-creator/ContentCreatorWorkspaceHeader.tsx):

- Title: **SMM Posts**
- `titleRowMenu`: landing-page source pills (**Posts** / **Pages** / **Random**)
- `titleRowEnd`: Social platform pills
- Toolbar: post count, CSV, generate / cancel, clear, export, sort
- Progress band: pagination + Details drawer (`BulkGeneratorDetailsDrawer`)

## Generate config

[`ContentCreatorGenerateConfig`](../src/lib/social/content-creator-types.ts):

| Field | Constraint |
|-------|------------|
| `postCount` | 1–100 (default 1) |
| `landingPageSource` | `posts` \| `pages` \| `random` (default `random`) |

## Row shape

```ts
{
  events?, keyword?, dayOfWeek?, date?,
  fbInstagramContent?, linkedinContent?,
  landingPageUrl?, imageUrl?, promptModifier?,
  status: "idle" | "generating" | "ready" | "error"
}
```

A row is kept on CSV import only if it has a **keyword** or a **landing page URL**.

## CSV

Template filename: `content-calendar-template.csv`. Export filename: `{site-slug}-content-calendar.csv`.

Headers (exact):

```
Events,Keyword,Day Of week,Dates,FB/Instagram Content,Linkedin Content,Link/Landing page,Image,Prompt Modifier
```

Parser aliases (header keys, case/spacing ignored): `keywords` → keyword, `url` / `landingpage` → landing page, `fblinkedincontent` → FB/Instagram. Source: [`content-calendar-csv.ts`](../src/lib/social/content-calendar-csv.ts).

## Generate pipeline (browser)

Agents in [`src/lib/social/content-creator-agents/`](../src/lib/social/content-creator-agents/):

1. Keyword
2. Social brief
3. Facebook / Instagram copy
4. LinkedIn copy
5. Prompt modifier
6. Social copy checklist (feedback, not a published post)

Controller: [`use-content-creator-workspace.ts`](../src/hooks/social/use-content-creator-workspace.ts).

## Pitfalls

- Hash `#content-creator` is legacy. Bookmarks should use `#content-calendar`.
- This sheet does not publish to Meta or LinkedIn. **Creator** is the organic post generator with visuals.
- GBP posts live on the **GBP** pill, not here.
- Import drops rows that have neither keyword nor landing URL.

## Related tests

- [`src/lib/social/__tests__/social-creator-nav.test.ts`](../src/lib/social/__tests__/social-creator-nav.test.ts)
- [`src/lib/social/__tests__/content-calendar-csv.test.ts`](../src/lib/social/__tests__/content-calendar-csv.test.ts)
