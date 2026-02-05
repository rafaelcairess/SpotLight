# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deploy (Vercel or Netlify)

### 1) Prepare environment variables

Create a `.env.local` for local dev, and configure **these same variables** in your hosting dashboard for production.

**Frontend (public in the browser):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

**Server-only (never expose in the browser):**
- `STEAM_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

> Tip: Use `.env.example` as a template (no secrets inside).

### 2) Build settings

This project uses Vite, so the build command is:

```sh
npm run build
```

The output folder is:

```
dist
```

### 3) Hosting steps

**Vercel**
1. Import the GitHub repo
2. Set the env vars in the project settings
3. Deploy

**Netlify**
1. Import the GitHub repo
2. Set the env vars in the site settings
3. Deploy

## Security notes (important)

- Only variables prefixed with `VITE_` are exposed to the browser. Keep secrets **without** the `VITE_` prefix.
- The Supabase **publishable** key is designed for browser use when RLS is enabled. Never ship the **service role** key in the frontend.

## How can I deploy this project (via Lovable)?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
