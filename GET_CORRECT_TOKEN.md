# Getting the Correct Shopify Token

## ⚠️ You Need: Storefront Access Token

**NOT** the Admin API token or Secret key!

## Step-by-Step Guide:

### 1. Go to Your Shopify Admin
- Log into your Shopify store admin panel

### 2. Navigate to Apps
- Click **Settings** (bottom left corner)
- Click **Apps and sales channels**

### 3. Create or Access Your App
- Click **Develop apps** (top right)
- If you don't have an app yet:
  - Click **Create an app**
  - Name it "Bobby Website Integration"
  - Click **Create app**
- If you already have an app, click on it

### 4. Configure Storefront API Access
- Click on **Configuration** tab
- Scroll down to **Storefront API access scopes**
- Click **Configure**

### 5. Enable These Permissions
Check these boxes:
- ✅ `unauthenticated_read_product_listings`
- ✅ `unauthenticated_write_checkouts` 
- ✅ `unauthenticated_read_checkouts`

Click **Save**

### 6. Install the App
- Go back to **Overview** tab
- Click **Install app**

### 7. Get Your Storefront Access Token
- After installation, go to **API credentials** tab
- Look for **Storefront API access token**
- Click **Reveal token once**
- **COPY THIS TOKEN IMMEDIATELY** (you can't see it again!)

## 🔍 How to Identify the Correct Token:

### ✅ Storefront Access Token (CORRECT):
- Shorter (usually 32 characters)
- Looks like: `c47b9818634036f23b41ba1a31b14b22`
- Used for public/frontend access
- Safe to use in browser code

### ❌ Admin API Token (WRONG):
- Much longer
- Starts with `shpat_` or similar
- Used for backend/server access
- NEVER use in browser code

### ❌ API Secret Key (WRONG):
- Very long
- Contains mixed characters
- Used for webhook verification
- NEVER expose publicly

## If You Already Have a Token:

Check if your token (`c47b9818634036f23b41ba1a31b14b22`) is working by:

1. Open browser console (F12)
2. Type: `window.shopifyClient`
3. If it shows an object, your token is correct
4. If it's `null` or errors, you need a new token

## Common Issues:

### "Access Denied" or "Unauthorized"
- Token doesn't have the right permissions
- Create a new app and get a fresh token

### "Invalid API Key"
- You're using the Admin token instead of Storefront token
- Follow steps above to get Storefront token

### Products Not Loading
- Make sure you have products in Shopify
- Check that Printful sync is complete
- Verify token permissions include product reading

## Quick Test:

Run this in your browser console to test your token:
```javascript
fetch('https://bobbytherabbit.com.myshopify.com/api/2024-01/graphql.json', {
    method: 'POST',
    headers: {
        'X-Shopify-Storefront-Access-Token': 'c47b9818634036f23b41ba1a31b14b22',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        query: `{ shop { name } }`
    })
})
.then(r => r.json())
.then(data => console.log('Token test:', data))
.catch(err => console.error('Token error:', err));
```

If it returns your shop name, the token is correct!