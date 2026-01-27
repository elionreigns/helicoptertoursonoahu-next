# Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure all environment variables are set in your Vercel project:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_SECURE`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASSWORD`
- [ ] `BROWSERBASE_API_KEY` (optional)
- [ ] `BROWSERBASE_PROJECT_ID` (optional)
- [ ] `N8N_WEBHOOK_URL` (optional)

### 2. Database Setup
1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `supabase-schema.sql` in the Supabase SQL editor
3. Verify tables are created: `bookings`, `operators`, `availability_logs`
4. Insert initial operators (already in schema)
5. Configure Row Level Security policies as needed

### 3. Email Configuration
1. Configure Site5 email account: `bookings@helicoptertoursonoahu.com`
2. Get SMTP credentials from Site5 control panel
3. Test email sending with a test script

### 4. Domain Configuration
1. In Vercel, go to Project Settings → Domains
2. Add custom domain: `booking.helicoptertoursonoahu.com`
3. Follow DNS configuration instructions
4. Wait for SSL certificate to be issued

### 5. Testing
Before going live, test:
- [ ] Booking form submission
- [ ] Email sending (to test addresses)
- [ ] Database writes (check Supabase dashboard)
- [ ] API routes (use Postman or curl)
- [ ] n8n webhook (if configured)

## Vercel Deployment Steps

1. **Connect GitHub Repository**:
   - Go to Vercel dashboard
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `bookings/hto-next` folder as root directory

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Root Directory: `bookings/hto-next`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - Make sure to add them for Production, Preview, and Development

4. **Deploy**:
   - Push to main branch (auto-deploys)
   - Or manually trigger deployment from Vercel dashboard

## Post-Deployment

1. **Verify Deployment**:
   - Visit `https://booking.helicoptertoursonoahu.com`
   - Test booking form
   - Check Vercel logs for errors

2. **Monitor**:
   - Set up error tracking (Sentry, etc.)
   - Monitor Supabase usage
   - Check email delivery rates

3. **Integration Testing**:
   - Test chatbot integration (Chatbase)
   - Test phone agent integration (Vapi)
   - Test n8n webhook triggers

## Troubleshooting

### Build Errors
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build`

### Runtime Errors
- Check Vercel function logs
- Verify environment variables are set correctly
- Check Supabase connection

### Email Issues
- Verify SMTP credentials
- Check Site5 email account settings
- Test with a simple email script

### Database Issues
- Verify Supabase connection string
- Check RLS policies
- Verify service role key has proper permissions

## Rollback

If deployment fails:
1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

## Support

For issues or questions:
- Check Vercel logs
- Check Supabase logs
- Review API route error responses
- Check email delivery logs
