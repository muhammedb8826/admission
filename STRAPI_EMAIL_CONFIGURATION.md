# Strapi Email Confirmation URL Configuration Guide

## Problem
Strapi is sending email confirmation links with `http://0.0.0.0:1337/api/auth/email-confirmation?confirmation=...` which is not accessible. The URL should point to your Next.js frontend application instead.

## Solution Options

### Option 1: Configure Strapi Server Settings (Recommended)

Update your Strapi configuration to set the correct frontend URL. This is the cleanest solution.

#### For Strapi v4.x:

1. **Locate your Strapi config file:**
   - Path: `config/server.js` or `config/server.ts` (depending on your Strapi setup)
   - If using environment variables: `.env` file in your Strapi project root

2. **Update the server configuration:**

   **In `config/server.js` or `config/server.ts`:**
   ```javascript
   module.exports = ({ env }) => ({
     host: env('HOST', '0.0.0.0'),
     port: env.int('PORT', 1337),
     app: {
       keys: env.array('APP_KEYS'),
     },
     url: env('PUBLIC_URL', 'http://localhost:1337'), // Your Strapi backend URL
   });
   ```

   **In `.env` file (create if it doesn't exist):**
   ```env
   # Strapi Backend URL
   PUBLIC_URL=http://localhost:1337
   # Or for production: https://api.yourdomain.com

   # Frontend URL (for email links)
   FRONTEND_URL=http://localhost:3000
   # Or for production: https://yourdomain.com
   ```

3. **Update the email plugin configuration:**

   **In `config/plugins.js` or `config/plugins.ts`:**
   ```javascript
   module.exports = ({ env }) => ({
     'users-permissions': {
       config: {
         emailConfirmation: {
           enabled: true,
           redirectUrl: env('FRONTEND_URL', 'http://localhost:3000') + '/email-confirmation',
         },
       },
     },
   });
   ```

   **Or in `.env`:**
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

### Option 2: Customize Email Template in Strapi Admin Panel

1. **Access Strapi Admin Panel:**
   - Navigate to `http://localhost:1337/admin` (or your Strapi URL)
   - Login as admin

2. **Go to Email Templates:**
   - Navigate to: **Settings** → **Users & Permissions plugin** → **Email templates**
   - Find the **Email address confirmation** template

3. **Update the Email Template:**
   
   Replace the template content with:
   ```html
   <p>Thank you for registering!</p>
   <p>You have to confirm your email address. Please click on the link below.</p>
   <p><a href="<%= FRONTEND_URL %>/email-confirmation?confirmation=<%= CODE %>">Confirm your email</a></p>
   <p>Or copy and paste this URL in your browser:</p>
   <p><%= FRONTEND_URL %>/email-confirmation?confirmation=<%= CODE %></p>
   <p>Thanks.</p>
   ```

   **Important:** Replace `<%= FRONTEND_URL %>` with your actual frontend URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

   **Or use environment variable:**
   - In the template, you can use: `<%= process.env.FRONTEND_URL %>` if configured in Strapi

### Option 3: Programmatically Override Email Template (Advanced)

If you need more control, you can create a custom email service in Strapi:

1. **Create a custom email service:**
   
   Create file: `src/extensions/users-permissions/services/user.js`
   
   ```javascript
   'use strict';

   const { sanitize } = require('@strapi/utils');
   const { getService } = require('@strapi/plugin-users-permissions/server/utils');

   module.exports = (plugin) => {
     // Override the email confirmation sending
     plugin.controllers.auth.sendEmailConfirmation = async (ctx) => {
       const { email } = ctx.request.body;
       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

       // Get the user
       const user = await strapi
         .query('plugin::users-permissions.user')
         .findOne({ where: { email } });

       if (!user) {
         return ctx.send({ ok: true }); // Don't reveal if user exists
       }

       // Generate confirmation token
       const confirmationToken = strapi.plugins['users-permissions'].services.users.generateConfirmationToken(user);

       // Update user with confirmation token
       await strapi
         .query('plugin::users-permissions.user')
         .update({
           where: { id: user.id },
           data: { confirmationToken },
         });

       // Send custom email
       await strapi.plugins['users-permissions'].services.users.sendConfirmationEmail({
         email: user.email,
         confirmationUrl: `${frontendUrl}/email-confirmation?confirmation=${confirmationToken}`,
       });

       return ctx.send({ ok: true });
     };

     return plugin;
   };
   ```

2. **Create custom email template:**
   
   You'll need to customize the email sending service to use your frontend URL.

## Quick Fix (Temporary)

If you need a quick temporary fix, you can manually edit the email template in Strapi Admin:

1. Go to **Settings** → **Users & Permissions plugin** → **Email templates**
2. Edit **Email address confirmation** template
3. Replace the URL line with:
   ```
   <p><a href="http://localhost:3000/email-confirmation?confirmation=<%= CODE %>">Confirm your email</a></p>
   ```
   (Replace `http://localhost:3000` with your actual frontend URL)

## Environment Variables Summary

Add these to your Strapi `.env` file:

```env
# Strapi Backend URL
PUBLIC_URL=http://localhost:1337

# Frontend URL (for email confirmation links)
FRONTEND_URL=http://localhost:3000

# For production:
# PUBLIC_URL=https://api.yourdomain.com
# FRONTEND_URL=https://yourdomain.com
```

## Verification

After making changes:

1. Restart your Strapi server
2. Register a new user or resend confirmation email
3. Check the email - the confirmation link should now point to your Next.js frontend URL
4. The link should be: `http://localhost:3000/email-confirmation?confirmation=...`

## Notes

- The Next.js frontend is already set up to handle email confirmation at `/email-confirmation`
- The confirmation code will be automatically processed when users click the link
- Make sure your frontend URL is accessible (not `0.0.0.0`)

