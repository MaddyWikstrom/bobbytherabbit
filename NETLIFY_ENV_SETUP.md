# Setting Up Shopify Credentials in Netlify

This guide explains how to set up the required environment variables in Netlify for your Shopify integration.

## Required Environment Variables

The log message shows that the Shopify credentials are missing:
```
🔑 Shopify credentials check: { domain: '❌ Missing', token: '❌ Missing' }
❌ Missing Shopify credentials
```

You need to set up these two environment variables in your Netlify dashboard:

1. `SHOPIFY_DOMAIN` - Your Shopify store domain
2. `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Your Storefront API access token

## Steps to Set Up Environment Variables in Netlify

1. **Log in to your Netlify dashboard**
   - Go to [https://app.netlify.com/](https://app.netlify.com/) and log in

2. **Select your site**
   - Click on the site you're deploying to

3. **Navigate to Site Settings**
   - Click on "Site settings" in the navigation tabs

4. **Go to Environment Variables**
   - In the left sidebar, click on "Environment variables"

5. **Add the Variables**
   - Click "Add a variable" and add each of these:
   
   | Key | Value |
   |-----|-------|
   | `SHOPIFY_DOMAIN` | `your-store.myshopify.com` |
   | `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | `your-storefront-access-token` |

   > Replace the values with your actual Shopify domain and Storefront API token

6. **Save the Changes**
   - Netlify will automatically save each variable as you add it

7. **Redeploy Your Site**
   - To ensure the new environment variables are applied, trigger a new deployment
   - Go to the "Deploys" tab and click "Trigger deploy" > "Deploy site"

## How to Get Your Shopify Credentials

### 1. Shopify Domain

This is your store's myshopify.com domain, for example: `your-store.myshopify.com`

### 2. Storefront API Access Token

1. Go to your Shopify admin dashboard
2. Navigate to "Apps" > "App and sales channel settings"
3. Scroll down to "Storefront API integrations" and click "Manage"
4. If you don't have a token already, click "Create a new private app"
5. Give your app a name (e.g., "Bobby Streetwear Checkout")
6. Under "Storefront API" section, check these permissions:
   - ✅ Read products, variants, and collections
   - ✅ Read customer tags, customer details, and customer addresses
   - ✅ Read content like articles, blogs, and comments
   - ✅ Write to cart
7. Click "Save" or "Create app"
8. Copy the "Storefront API access token" that is generated

## Troubleshooting

If you're still seeing credential errors after setting up the environment variables:

1. **Check for Typos**: Ensure there are no typos in your variable names or values
2. **Verify Deployment**: Make sure your site has been redeployed after adding the variables
3. **Check Logs**: Review the function logs in Netlify for more detailed error messages
4. **Test Locally**: Test your function locally using a .env file to verify the credentials work

## Local Development

For local development:

1. Create a `.env` file in your project root (copy from `.env.example`)
2. Add your Shopify credentials to this file
3. Make sure `.env` is in your `.gitignore` to avoid committing sensitive credentials

The format should be:
```
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-access-token
```

## Need Help?

If you're still having issues after following these steps, please:

1. Check the Netlify function logs for specific error messages
2. Verify your Shopify Storefront API token has the correct permissions
3. Ensure your Shopify store is on a plan that allows Storefront API access