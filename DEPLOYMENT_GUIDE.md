# Deployment Guide for www.bobbytherabbit.com

## Overview
This guide will help you deploy your Bobby Streetwear website to your domain www.bobbytherabbit.com.

## Option 1: Using GitHub Pages (Free & Easy)

### Step 1: Create a GitHub Account
1. Go to [github.com](https://github.com) and create a free account if you don't have one

### Step 2: Create a New Repository
1. Click the "+" icon in the top right and select "New repository"
2. Name it `bobbytherabbit.com` or `bobby-streetwear`
3. Make it public
4. Don't initialize with README (we already have files)

### Step 3: Upload Your Files
1. Click "uploading an existing file"
2. Drag and drop all files from the `bobby-streetwear` folder
3. Commit the files

### Step 4: Enable GitHub Pages
1. Go to Settings → Pages
2. Under "Source", select "Deploy from a branch"
3. Choose "main" branch and "/ (root)" folder
4. Click Save

### Step 5: Configure Your Domain
1. In GitHub Pages settings, under "Custom domain", enter: www.bobbytherabbit.com
2. Check "Enforce HTTPS"
3. GitHub will create a CNAME file automatically

### Step 6: Update DNS Settings
Go to your domain registrar (where you bought bobbytherabbit.com) and add these DNS records:

**For www.bobbytherabbit.com:**
- Type: CNAME
- Name: www
- Value: [your-github-username].github.io

**For bobbytherabbit.com (without www):**
- Type: A
- Name: @
- Value: 185.199.108.153
- Type: A
- Name: @
- Value: 185.199.109.153
- Type: A
- Name: @
- Value: 185.199.110.153
- Type: A
- Name: @
- Value: 185.199.111.153

## Option 2: Using Netlify (Free with More Features)

### Step 1: Create a Netlify Account
1. Go to [netlify.com](https://netlify.com) and sign up for free

### Step 2: Deploy Your Site
1. Drag and drop your entire `bobby-streetwear` folder to the Netlify dashboard
2. Netlify will automatically deploy it and give you a temporary URL

### Step 3: Add Your Custom Domain
1. Go to Domain Settings in your Netlify dashboard
2. Click "Add custom domain"
3. Enter www.bobbytherabbit.com
4. Follow Netlify's instructions to update your DNS

## Option 3: Using Traditional Web Hosting

If you already have web hosting:

1. Use FTP client (like FileZilla) to connect to your hosting
2. Upload all files from `bobby-streetwear` folder to the public_html or www directory
3. Make sure index.html is in the root directory

## Important Notes

1. **DNS Propagation**: After updating DNS settings, it can take 24-48 hours for changes to propagate worldwide
2. **HTTPS**: Both GitHub Pages and Netlify provide free SSL certificates for HTTPS
3. **File Structure**: Keep the same folder structure when uploading:
   ```
   /
   ├── index.html
   ├── assets/
   │   ├── (all image files)
   ├── styles/
   │   ├── main.css
   │   ├── loading.css
   │   └── animations.css
   └── scripts/
       ├── main.js
       ├── loading.js
       ├── cart.js
       └── animations.js
   ```

## Testing Your Deployment

Once deployed and DNS is configured:
1. Visit www.bobbytherabbit.com
2. Test all features:
   - Loading animation
   - Product hover effects
   - Cart functionality
   - Quick view modals
   - All links and buttons

## Troubleshooting

- **Site not loading**: Check DNS settings and wait for propagation
- **Broken images/styles**: Ensure all file paths are relative (starting with ./ or no slash)
- **HTTPS issues**: Enable HTTPS in your hosting settings
- **404 errors**: Make sure index.html is in the root directory

## Recommended: GitHub Pages
For your static website, GitHub Pages is recommended because:
- It's completely free
- Automatic HTTPS
- Easy updates (just push changes to GitHub)
- Reliable and fast
- No maintenance required