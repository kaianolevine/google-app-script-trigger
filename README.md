# google-app-script-trigger

This project provides an automated mechanism for triggering a GitHub Actions workflow from a Google Apps Script. It is designed to be used in conjunction with Google Drive file monitoring, allowing changes (e.g. new files or updates in a watched folder) to initiate CI/CD tasks via GitHub.

## Features

- 🔁 Listens for changes in a Google Drive folder using Google Apps Script.
- 🚀 Triggers a GitHub Actions workflow using a repository dispatch event.
- 🔐 Uses a GitHub fine-scoped personal access token to authenticate requests.
- 📂 Supports JSON credentials and optional service account-based deployment.
- 🔧 Includes error handling for invalid credentials and RAPT token expiration.
- 🛠️ Provides debug logs to trace trigger calls and webhook results.

## Setup

1. Deploy your Google Apps Script project with the correct OAuth scopes.
2. Add your GitHub personal access token as a secret in the Apps Script project.
3. Configure the Google Drive folder ID to monitor for changes.
4. Customize the GitHub repo, owner, and event type in the script.
5. Push changes using `clasp push` and authorize if prompted.

## Notes

- This version includes improvements to long-term authentication handling.
- It is compatible with GitHub Actions workflows using `repository_dispatch`.
- Manual authorization has been reduced, but some credential expiration issues (e.g. `invalid_rapt`) may still require re-authentication over time.
# google-app-script-trigger

This project provides an automated mechanism for triggering a GitHub Actions workflow from a Google Apps Script. It is intended for automating CI/CD tasks in response to changes in a monitored Google Drive folder (new files, updates, etc.).

---

## Features

- 🔁 Listens for changes in a Google Drive folder via Google Apps Script.
- 🚀 Triggers a GitHub Actions workflow using `repository_dispatch` events.
- 🔐 Supports secure authentication via either a user OAuth token (for `clasp`) or a service account for non-interactive deployments.
- 📂 Includes helpers to read/write Google Sheets and manage Drive files.
- 🛠️ Provides logging and error handling for credential issues (e.g. `invalid_rapt`, quota errors).

---

## Quick architecture

1. Google Apps Script monitors a Drive folder or is invoked manually.
2. When a change is detected, the script issues a `repository_dispatch` (or other) HTTP request to a GitHub Actions workflow.
3. The workflow processes the event and runs repository tasks (e.g., `clasp push`, data processing, etc.).

---

## Prerequisites

- A Google account with access to the Apps Script project and target Drive folder.
- A GitHub repository and permissions to create Actions/workflows.
- `clasp` (optional) for pushing Apps Script code from your local/dev environment.

---

## Obtaining credentials (two supported approaches)

You must choose one of the two approaches depending on whether you need interactive `clasp` behavior or non-interactive CI deployment.

### A — OAuth Client (for `clasp` / user tokens) — interactive, then reuse token in CI

Use this if you want to push with `clasp` and can perform a one-time local interactive auth.

1. Go to Google Cloud Console → **APIs & Services → Credentials**.
2. Create an **OAuth client ID** of type **Desktop app**.
3. Download the JSON and save it as `credentials.json` locally.
4. Locally run:
   ```bash
   npm i -g @google/clasp
   clasp login --creds credentials.json
   ```
5. `clasp login` creates `~/.clasprc.json`. This file contains `access_token` and `refresh_token`.

**CI setup (recommended):**
- Copy the **contents** of `~/.clasprc.json` and add it as a GitHub Actions secret named `CLASPRC_JSON`.
- Add a `CLASP_PROJECT` secret with your `.clasp.json` content (e.g. `{"scriptId":"<ID>","rootDir":"src"}`).

> Notes: This approach requires a one-time manual auth step. The `refresh_token` typically allows the CI runner to refresh access tokens without further interaction, but if the token is revoked, you must repeat the manual step.


### B — Service Account (recommended for automated non-interactive deployments)

Use a service account when you must avoid manual logins and cannot store user OAuth tokens. Important: `clasp` does not support service accounts for the interactive push flow. If you want to deploy Apps Script or manipulate Drive/Sheets using a service account, use the Google APIs directly (or a server-based deployment flow), or use `clasp` only to edit files on an account that has accepted the service account as an editor.

1. In Google Cloud Console → **IAM & Admin → Service Accounts**, create a service account.
2. Generate and download a JSON key. Keep it secure.
3. If operating on an Apps Script project, **share the Apps Script project** with the service account email (add as Editor) so it can access the project.
4. For Drive/Sheets access, ensure the service account has required permissions or the files are shared with it.

**CI setup:**
- Add the downloaded service account JSON to GitHub Secrets as `GOOGLE_CREDENTIALS`.
- Use your workflow to write this into `credentials.json` and invoke scripts that use service account auth.

---


## Recommended GitHub secrets

- `CLASPRC_JSON` — required if you are using a pre-authorized user `~/.clasprc.json` (preferred for `clasp` in CI). Content: full `~/.clasprc.json` text.
- `CLASP_PROJECT` — JSON contents of `.clasp.json` (scriptId/rootDir). Example: `{"scriptId":"AKfy...","rootDir":"src"}`.
- `GOOGLE_CREDENTIALS` — service account JSON (if you prefer a service-account approach for non-`clasp` flows).
- `GH_PAT` or `GITHUB_TOKEN` — GitHub token used by Apps Script to call repository dispatch (if your Apps Script triggers GitHub directly).

---

## Required GitHub Secrets

You must add the following secrets in your repository’s **Settings → Secrets and Variables → Actions**:

| Secret Name         | Purpose                                                                                       | How to Populate                                                                                                                                           |
|---------------------|-----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `CLASPRC_JSON`      | Stores your local `~/.clasprc.json` (OAuth tokens for clasp).                                 | Run `clasp login` locally, open `~/.clasprc.json`, copy the entire JSON and paste it into the secret.                                                     |
| `CLASP_PROJECT`     | Defines your `.clasp.json` project link (scriptId + rootDir).                                 | Copy from your local `.clasp.json` file. Example: `{"scriptId":"AKfycb...","rootDir":"src"}`                                                             |
| `GOOGLE_CREDENTIALS`| Service account JSON for direct API access.                                                   | Create a service account in Google Cloud → download its JSON key → paste contents as secret.                                                              |
| `GH_PAT` or `GITHUB_TOKEN` | GitHub token to allow Apps Script to trigger workflows via repository dispatch.        | Generate a Personal Access Token with `repo` and `workflow` scopes (or use default `${{ secrets.GITHUB_TOKEN }}`).                                       |

> ⚠️ **Tip:** Ensure no extra whitespace or line breaks when pasting JSON into secrets. You can verify syntax with [jq](https://stedolan.github.io/jq/): `cat file.json | jq .`.

Each secret **must** be configured in your GitHub repository by navigating to:  
**Settings → Secrets and Variables → Actions**  
and clicking “New repository secret”.

## Example GitHub Actions workflow (push with pre-authorized `~/.clasprc.json`)

This example assumes you created `CLASPRC_JSON` and `CLASP_PROJECT` secrets.

```yaml
name: Deploy Apps Script
on:
  workflow_dispatch: {}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install clasp
        run: npm install -g @google/clasp

      - name: Restore clasp credentials
        env:
          CLASPRC_JSON: ${{ secrets.CLASPRC_JSON }}
        run: |
          echo "$CLASPRC_JSON" > ~/.clasprc.json

      - name: Restore .clasp.json
        env:
          CLASP_PROJECT: ${{ secrets.CLASP_PROJECT }}
        run: |
          echo "$CLASP_PROJECT" > .clasp.json

      - name: Push to Apps Script
        run: clasp push --force
```

> Important: ensure your `CLASPRC_JSON` is valid and the refresh token has not been revoked. If it is revoked you must re-run `clasp login` locally and update the secret.

---

## How we configured authentication in this project (what we changed)

- Replaced interactive `clasp login` inside CI with rehydrating a pre-authorized `~/.clasprc.json` from the `CLASPRC_JSON` secret to avoid interactive prompts.
- Added clear instructions and code path for service account usage for non-interactive Drive/Sheets access.
- Added robust logging in Sheets/Drive helpers to surface quota, permission, and rate-limit errors.

---

## Troubleshooting

### `invalid_grant` / `invalid_rapt` or other `clasp` login errors

- Usually caused by using an expired/invalid token or mixing service-account JSON with OAuth client JSON.
- Fix: regenerate `~/.clasprc.json` locally via `clasp login` and update `CLASPRC_JSON` secret.

### `redirect_uris` or JSON parsing errors

- These indicate you passed the wrong JSON type (service account vs OAuth client) to `clasp`.
- Use OAuth client credentials for `clasp` (`installed` client), and service account credentials for server-to-server flows.

### Drive/Sheets permission errors

- Ensure the account (user or service) has been **shared** on the target Drive items and has adequate permissions.
- For shared drives, include `supportsAllDrives=True` in API calls (the code does this already).

### Rate limit / quota errors (429 / ReadRequestsPerMinutePerUser)

- We added exponential backoff and retry logic in critical read paths; slow down batch operations when necessary.
- Optionally request higher quota in Google Cloud Console.

---

## Security notes

- Do **not** commit `credentials.json`, `~/.clasprc.json`, or service account keys to source control.
- Use GitHub Secrets for all sensitive values and rotate them if leaked or revoked.
- Limit the permissions of service accounts and GitHub tokens to the minimum required.

---

## Support

If you run into issues, open an issue describing the problem and include relevant logs (redact secrets). We can help with token refresh guidance, CI workflow examples, and Apps Script permission configuration.