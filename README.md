<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1z36a6oIrXKOEKtTl_3zWK0uiOEdLCGTH

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
   `npm run build`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`



















Here is a step-by-step guide to deploying your project to Cloudflare Pages for free.

Key Build Settings (Keep these handy)
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: / (leave empty or /)
Environment Variables:
VITE_API_URL = https://letterhead-api.tajmir0075.workers.dev
NODE_VERSION = 20
(Note: Your 

public/_redirects
 file is already created with /* /index.html 200, so direct links like /view/:letterId will work automatically without 404 errors.)

Option 1: Connect via GitHub (Recommended — Auto Deploy on Push)
Step 1: Push your latest code to GitHub
Make sure your local changes are committed and pushed to your GitHub repository:

bash
git add .
git commit -m "Update HTML logo and offline fonts"
git push origin main
Step 2: Open Cloudflare Dashboard
Go to dash.cloudflare.com and log in (create a free account if you don't have one).
In the left sidebar, click Compute (Workers & Pages) → Pages (or click Workers & Pages → Create application → Pages tab).
Step 3: Connect your GitHub Account
Click Connect to Git.
Select your GitHub account and choose your repository: HasanAbdullah001/Tajmir-Letterhead (or whatever your repo is named).
Click Begin setup.
Step 4: Configure Build Settings
Fill in the deployment settings:

Project name: Choose any name (e.g., tajmir-letterhead).
Production branch: main (or master).
Framework preset: Select Vite from the dropdown.
Build command: npm run build
Build output directory: dist
Step 5: Add Environment Variables
Expand the Environment variables (advanced) section and add:

Variable name: VITE_API_URL
Value: https://letterhead-api.tajmir0075.workers.dev
Variable name: NODE_VERSION
Value: 20
Step 6: Deploy
Click Save and Deploy.
Cloudflare will install dependencies, run npm run build, and deploy your site in ~1 minute.
Once complete, you will receive a free public URL (e.g. https://tajmir-letterhead.pages.dev).
Option 2: Direct Upload (No GitHub Needed)
If you prefer uploading directly from your computer without connecting Git:

Build the production bundle locally: In your terminal, run:

bash
npm run build
This generates the production files inside the dist folder.

Upload to Cloudflare:

Go to dash.cloudflare.com → Workers & Pages → Create application → Pages.
Select Upload assets (Direct Upload).
Give your project a name (e.g. tajmir-letterhead).
Drag and drop the contents of your dist folder (or select the dist folder).
Click Deploy site.
Optional: Connect Custom Domain
If you have a custom domain on Cloudflare (e.g. letterhead.yourdomain.com):

In your Cloudflare Pages project, go to the Custom domains tab.
Click Set up a custom domain.
Enter your domain/subdomain and Cloudflare will automatically configure SSL and DNS for free.