# Deploy to bobbytherabbit.com

## Quick Deployment Options

### Option 1: Netlify (Recommended - Free & Easy)

1. **Create a Netlify account** at netlify.com

2. **Deploy via Drag & Drop:**
   - Open netlify.com
   - Drag your entire `bobby-streetwear` folder to the deployment area
   - Your site deploys instantly!

3. **Connect Your Domain:**
   - In Netlify: Site settings → Domain management → Add custom domain
   - Add `bobbytherabbit.com`
   - Follow their DNS instructions:
     - Add A record: `75.2.60.5`
     - Add CNAME record: `www` → `[your-site].netlify.app`

### Option 2: GitHub Pages (Free)

1. **Create GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/bobby-streetwear.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)

3. **Add Custom Domain:**
   - Add `bobbytherabbit.com` in Pages settings
   - Create `CNAME` file with: `bobbytherabbit.com`
   - Update DNS:
     - A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

### Option 3: Traditional Web Hosting

If you already have hosting:

1. **Upload via FTP:**
   - Use FileZilla or similar
   - Upload all files from `bobby-streetwear` folder
   - Make sure to upload to public_html or www folder

2. **Via cPanel File Manager:**
   - Login to cPanel
   - Open File Manager
   - Upload to public_html
   - Extract if uploaded as zip

### Option 4: Vercel (Alternative to Netlify)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd bobby-streetwear
   vercel
   ```

3. **Add Domain:**
   - In Vercel dashboard → Domains
   - Add bobbytherabbit.com
   - Update DNS as instructed

## Pre-Deployment Checklist

- [ ] Re-enable Shopify integration (it will work on real domain!)
- [ ] Test all images load correctly
- [ ] Verify all script paths are relative
- [ ] Check mobile responsiveness
- [ ] Test cart functionality

## Update Your Files for Production

1. **Re-enable Shopify Integration:**
   Edit `index.html` and uncomment the Shopify script:
   ```html
   <!-- Shopify Integration - Option B -->
   <script src="scripts/shopify-integration.js"></script>
   
   <!-- Remove the manual mapper -->
   <!-- <script src="scripts/manual-product-mapper.js"></script> -->
   ```

2. **Add Product IDs:**
   You still need to update `shopify-integration.js` with your actual product IDs

## DNS Settings for bobbytherabbit.com

Depending on where you registered your domain:

### GoDaddy:
1. Login to GoDaddy
2. DNS Management
3. Update A record to point to your host
4. Add CNAME for www

### Namecheap:
1. Dashboard → Domain List
2. Manage → Advanced DNS
3. Add host records

### Cloudflare:
1. Add site to Cloudflare
2. Update nameservers at registrar
3. Add DNS records in Cloudflare

## After Deployment

1. **Test Everything:**
   - Visit https://bobbytherabbit.com
   - Check Shopify integration works
   - Test checkout process
   - Verify HTTPS is working

2. **Enable HTTPS:**
   - Netlify/Vercel: Automatic
   - GitHub Pages: Automatic with custom domain
   - Traditional hosting: Use Let's Encrypt

3. **Set Up Analytics:**
   - Add Google Analytics
   - Set up Shopify Analytics
   - Monitor conversion rates

## Quick Deploy Commands

### For Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=bobby-streetwear
```

### For GitHub:
```bash
cd bobby-streetwear
git init
git add .
git commit -m "Deploy Bobby Streetwear"
git branch -M main
git remote add origin https://github.com/[YOUR_USERNAME]/bobby-streetwear.git
git push -u origin main
```

## Troubleshooting

**"Site not loading"**
- DNS can take 24-48 hours to propagate
- Check DNS with: `nslookup bobbytherabbit.com`

**"HTTPS not working"**
- Wait for SSL certificate (usually automatic)
- Force HTTPS in hosting settings

**"Shopify still showing CORS error"**
- Clear browser cache
- Make sure you're accessing via bobbytherabbit.com, not IP

## Next Steps

1. Deploy first (Netlify is fastest)
2. Update DNS settings
3. Re-enable Shopify integration
4. Add your product IDs
5. Launch! 🚀

Your Shopify integration will work perfectly once deployed to bobbytherabbit.com!