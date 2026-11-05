<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Data is read/written from the browser Supabase client; RLS (has_role admin) is the only write guard — keep all writes admin-gated in policies.
- Images live in the private `media` bucket; DB stores storage paths, UI resolves them with signed URLs via `useMediaUrl` (public buckets are blocked in this workspace).
- The first account ever created is granted admin by a trigger; later accounts get no role.
- Reusable items are admin-only library rows referenced by library_id in character item snapshots; a database trigger synchronizes public snapshots on edits, while archive preserves existing recommendations and shared images are never removed by character cleanup.
- Hero list organization uses a browser-safe pure helper in src/lib/hero-order.ts so grouping can be tested independently of the UI and database.
- Power spike selection uses the browser-safe hero-power helpers to normalize input and toggle independent values without relying on combat classification logic.
- Combat classifications are independent arrays on characters; use the shared ClassificationPicker and pure hero-classification helpers for editing and filtering. Selected values must all match within each category to let visitors isolate hybrid heroes.
