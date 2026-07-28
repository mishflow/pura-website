# Daily auto-Story — setup guide

Posts the 3-day (today + next 2) schedule Story to `@purapilatessrilanka`
every morning at **07:00 Sri Lanka time**, with no manual step.

How it works: a GitHub Actions job renders the Story frame in headless Chromium,
uploads the PNG to Vercel Blob (public URL), then publishes it via the Instagram
Graph API.

- Workflow: `.github/workflows/daily-story.yml`
- Script: `puracommunity/scripts/post-story.mjs`
- Render target: the app at `?render=story` (`src/RenderStory.jsx`)

---

## What you need to do (one time)

The code is done. Three things need YOUR Meta/Vercel accounts — I can't do these
for you because they're tied to your identity.

### 1. Meta app + permission (the long pole — start first)

Instagram will not let anything post a Story until `instagram_content_publish`
is approved for a Meta app. This is the slow part (days to ~2 weeks).

1. Go to <https://developers.facebook.com> → **Create App** → type **Business**.
2. Add the **Instagram** product (Instagram Graph API / Instagram API with
   Instagram Login). Connect the `@purapilatessrilanka` account and its linked
   Facebook Page.
3. Under **App Review → Permissions and Features**, request:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement` (and `business_management` if prompted)
4. Submit for review with the use-case text + screencast below.

**Use-case text to paste in the review form:**

> Our app automatically publishes a daily Instagram Story to our own business
> account, @purapilatessrilanka, for Pura Pilates studio in Ahangama, Sri Lanka.
> Each morning it renders our class timetable for the next three days as an image
> and publishes it as a Story using the Instagram Content Publishing API. It posts
> only to our own account, requires no end-user login, and publishes no third-party
> content. This keeps our followers informed of daily class times without manual
> posting.

**Screencast to record (2–3 min):** show the poster app generating the Story
image from the live schedule, then narrate that the same image is published
automatically each morning via the API to your own account. Reviewers want to
see the feature working end to end.

### 2. A permanent access token (avoids 60-day expiry)

Once approved, in **Business Settings → Users → System Users**:

1. Create a System User (Admin), assign it the app and the Facebook Page.
2. **Generate token** with scopes `instagram_basic`, `instagram_content_publish`,
   `pages_read_engagement`. Choose **never expires**.
3. Also grab your **Instagram Business account ID**:
   `GET https://graph.facebook.com/v21.0/me/accounts` → the Page →
   `?fields=instagram_business_account`.

### 3. Vercel Blob token (image hosting)

In your Vercel project → **Storage → Blob → create a store**, then copy its
`BLOB_READ_WRITE_TOKEN`. (The API needs a public image URL; this provides it.)

### 4. Add the secrets to GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `IG_USER_ID` | Instagram Business account ID (step 2) |
| `IG_ACCESS_TOKEN` | System User token (step 2) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (step 3) |

---

## Testing before Meta approves

You can verify the whole render + host pipeline **without** the Instagram
permission, using the dry run:

1. Add just `BLOB_READ_WRITE_TOKEN` as a secret (steps 3–4).
2. GitHub → **Actions → Daily Instagram Story → Run workflow** → check
   **dry_run**.
3. It renders + uploads the PNG and prints the public URL in the logs; it also
   attaches `story.png` as a downloadable artifact. Open it and confirm the
   image looks right. No Story is posted.

Once Meta approves and all three secrets are set, the daily 07:00 run posts for
real. You can also trigger a real post anytime via **Run workflow** with dry_run
unchecked.

## Notes / gotchas

- GitHub scheduled jobs can start a few minutes late under load — fine for a
  morning post, not second-accurate.
- The token, if not set to "never expires", must be refreshed every ~60 days —
  the System User permanent token avoids this.
- Story publishing has a per-account daily API limit; one post/day is well under it.
