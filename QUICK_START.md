# Quick Start Guide

## 1. Install Dependencies

```bash
cd bookings/hto-next
npm install
```

## 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- Supabase credentials (get from https://supabase.com)
- OpenAI API key (get from https://platform.openai.com)
- SMTP credentials (from Site5 email account)
- Optional: Browserbase API key, n8n webhook URL

## 3. Set Up Supabase Database

1. Create a new project at https://supabase.com
2. Go to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script
5. Verify tables are created in the Table Editor

## 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the booking form.

## 5. Test the System

### Test Booking Form
1. Fill out the booking form on the homepage
2. Submit the form
3. Check Supabase `bookings` table for the new record
4. Check your email inbox (operator and customer emails should be sent)

### Test API Routes
Use curl or Postman to test:

```bash
# New booking request
curl -X POST http://localhost:3000/api/new-booking-request \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "elionreigns@gmail.com",
    "customerPhone": "808-555-1234",
    "partySize": 2,
    "preferredDate": "2026-02-15",
    "source": "web"
  }'
```

## 6. Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

See `DEPLOYMENT.md` for detailed deployment instructions.

## Next Steps

- Configure chatbot integration (Chatbase)
- Set up phone agent (Vapi)
- Configure n8n workflows
- Set up browser automation (Browserbase)
- Customize email templates
- Add more operators to `lib/constants.ts`

## Troubleshooting

**Build errors?**
- Run `npm run build` locally to see errors
- Check TypeScript errors: `npx tsc --noEmit`

**API errors?**
- Check Vercel function logs
- Verify environment variables are set
- Check Supabase connection

**Email not sending?**
- Verify SMTP credentials
- Test with a simple email script
- Check Site5 email account settings
