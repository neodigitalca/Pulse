# Meta Ads workspace (PPC)

Manager nav **PPC → Meta** (`managerTab: ppc-meta`, hash tab in `Index.tsx`). There is **no** Pulse `/api/ppc` namespace. Generation runs in the browser against OpenRouter.

## Intent

Build Meta (Facebook / Instagram) feed ads from a connected WordPress site's page inventory, then download CSV + creative ZIP. Nothing is published to Meta Ads Manager from this workspace.

## Architecture

```
MetaAdsCampaignWorkspace
  → usePpcMetaWorkspace
    → loadPpcPageBucketContext (WP username + app password required)
      → POST /api/wordpress/get-site-inventory-bulk
    → runPpcMetaAdGenerate / batch
      → copy, creative-brief, image agents (OpenRouter)
    → session cache + browser download
```

| Area | Path |
| --- | --- |
| Shell | `src/components/ppc/meta/MetaAdsCampaignWorkspace.tsx` |
| Hook | `src/hooks/ppc/use-ppc-meta-workspace.ts` |
| Orchestration | `src/lib/ppc/run-ppc-meta-ad-generate.ts` |
| Agents | `src/lib/ppc/meta-ad-agents/` |
| Inventory | `src/lib/ppc/ppc-page-bucket-inventory.ts` |

## Constraints

- WordPress credentials (username + application password) must be present or page-bucket load throws.
- Models: per-site research model and image model (`getResearchModel`, `getImageModel`).
- OpenRouter is required for copy and image steps (`callOpenRouterChatCompletion`, `generateImage`).
- Copy limits enforced in prompts (`src/lib/ppc/meta-ads-field-limits.ts`):

| Field | Max |
| --- | --- |
| `primaryText` | 125 |
| `headline` | 40 |
| `description` | 30 |
| `cta` | `Learn More`, `Sign Up`, `Contact Us`, `Get Quote`, `Book Now` |

Placements: `feed_1x1`, `feed_4x5`, `story_9x16`.

## Session storage

| Key | Contents |
| --- | --- |
| `neo-pulse-ppc-meta-ads-v3:{siteId}` | Ad rows |
| `neo-pulse-ppc-meta-generate-config:{siteId}` | Generate config |

## Output

Browser downloads only: `export-meta-ads-csv.ts`, `export-meta-ads-creative-zip.ts`. No WordPress media upload and no Meta Marketing API write from `src/lib/ppc/`.

## Related

- [WordPress site inventory bulk](api/wordpress/wordpress-get-site-inventory-bulk.md)
- [Pulse Forge](api/pulse-forge/overview.md) (separate; recipes do not drive this workspace)
