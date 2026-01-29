import 'server-only';
/**
 * Browser automation for checking operator availability
 * Uses Browserbase SDK + Playwright to connect to remote browser and scrape FareHarbor
 */
import { chromium } from 'playwright-core';
import Browserbase from '@browserbasehq/sdk';
import { getFareHarborUrl, updateFareHarborUrlForDate } from './fareharborTours';

/**
 * Check availability using Browserbase API
 * Uses BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID from environment variables
 * For Blue Hawaiian: scrapes FareHarbor calendar pages
 * For Rainbow: returns manual check required (emails operator)
 */
export async function checkAvailabilityBrowserbase({
  operator,
  date,
  partySize,
  tourName,
  timeWindow,
}: {
  operator: 'blueHawaiian' | 'rainbow';
  date: string; // YYYY-MM-DD
  partySize: number;
  tourName?: string;
  timeWindow?: string;
}): Promise<{
  available: boolean;
  details?: any;
  error?: string;
  source: string;
  availableSlots?: Array<{ time: string; price?: number; available: boolean }>;
}> {
  const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
  const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!browserbaseApiKey || !browserbaseProjectId) {
    console.error('Browserbase credentials not configured');
    return {
      available: false,
      error: 'Browserbase credentials not configured. Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID',
      source: 'browserbase',
    };
  }

  // For Rainbow Helicopters, return manual check required (email operator)
  if (operator === 'rainbow') {
    return {
      available: false,
      error: 'Rainbow Helicopters requires manual availability check. Operator will be contacted via email.',
      source: 'manual',
      details: {
        note: 'Rainbow Helicopters does not have live availability API. Operator will confirm availability via email.',
      },
    };
  }

  // For Blue Hawaiian, scrape FareHarbor calendar
  let sessionId: string | undefined;
  try {
    // Get FareHarbor URL for the tour (if tourName provided)
    let fareHarborUrl: string | null = null;
    if (tourName) {
      fareHarborUrl = getFareHarborUrl(tourName);
      if (fareHarborUrl) {
        fareHarborUrl = updateFareHarborUrlForDate(fareHarborUrl, date);
      }
    }

    // If no specific tour URL, use a default Oahu tour
    if (!fareHarborUrl) {
      const defaultTour = getFareHarborUrl('Blue Skies of Oahu');
      if (defaultTour) {
        fareHarborUrl = updateFareHarborUrlForDate(defaultTour, date);
      }
    }

    if (!fareHarborUrl) {
      return {
        available: false,
        error: 'Could not determine FareHarbor URL for tour',
        source: 'browserbase',
      };
    }

    console.log(`Checking availability on FareHarbor: ${fareHarborUrl}`);

    // Create session and connect via Browserbase SDK (required for real scraping)
    const bb = new Browserbase({ apiKey: browserbaseApiKey });
    const session = await bb.sessions.create({
      projectId: browserbaseProjectId,
    });
    sessionId = session.id;
    console.log(`Browserbase session created: ${sessionId} for Blue Hawaiian on ${date}`);

    // Connect to remote browser and scrape FareHarbor (SDK + Playwright)
    const connectUrl = (session as { connectUrl?: string }).connectUrl;
    if (!connectUrl) {
      console.error('Session missing connectUrl');
      return {
        available: false,
        error: 'Browserbase session missing connectUrl',
        source: 'browserbase',
        details: { date, partySize, operator },
      };
    }

    let browser;
    try {
      browser = await chromium.connectOverCDP(connectUrl);
    } catch (err) {
      console.error('Failed to connect to Browserbase session:', err);
      return {
        available: false,
        error: err instanceof Error ? err.message : 'Failed to connect to browser',
        source: 'browserbase',
        details: { date, partySize, operator, sessionId },
      };
    }

    try {
      const defaultContext = browser.contexts()[0];
      const page = defaultContext?.pages()[0] ?? await defaultContext!.newPage();

      await page.goto(fareHarborUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      let targetPage: typeof page = page;
      try {
        const fh = page.locator('iframe[src*="fareharbor"]').first();
        await fh.waitFor({ state: 'visible', timeout: 5000 });
        const frame = await fh.contentFrame();
        if (frame) targetPage = frame as any;
      } catch {
        // use main page
      }

      const [year, month, day] = date.split('-');
      const dateSelectors = [
        `[data-date="${date}"]`,
        `[data-day="${day}"]`,
        `button:has-text("${day}")`,
        `.calendar-day:has-text("${day}")`,
      ];
      for (const sel of dateSelectors) {
        try {
          const el = targetPage.locator(sel).first();
          await el.waitFor({ state: 'visible', timeout: 2000 });
          const disabled = await el.getAttribute('disabled') ?? await el.getAttribute('aria-disabled');
          const cls = await el.getAttribute('class') ?? '';
          if (!disabled && !cls.includes('disabled') && !cls.includes('unavailable')) {
            await el.click();
            await page.waitForTimeout(3000);
            break;
          }
        } catch {
          continue;
        }
      }

      const availableSlots: Array<{ time: string; price?: number; available: boolean }> = [];
      const timeSelectors = [
        'button[class*="time"]:not([disabled])',
        'a[class*="time"]:not([disabled])',
        '[class*="time-slot"]:not([class*="unavailable"]):not([class*="sold-out"])',
        '[data-time]',
        'button:has-text("AM")',
        'button:has-text("PM")',
        'a:has-text("AM")',
        'a:has-text("PM")',
      ];
      const seen = new Set<string>();
      for (const sel of timeSelectors) {
        try {
          const nodes = await targetPage.locator(sel).all();
          for (const node of nodes) {
            try {
              const text = (await node.textContent())?.trim();
              if (!text || seen.has(text)) continue;
              const cls = await node.getAttribute('class') ?? '';
              if (cls.includes('unavailable') || cls.includes('sold-out')) continue;
              const priceAttr = await node.getAttribute('data-price') ?? await node.getAttribute('aria-label') ?? '';
              const priceMatch = priceAttr.match(/\$([\d,]+)/);
              const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : undefined;
              seen.add(text);
              availableSlots.push({ time: text, price, available: true });
            } catch {
              continue;
            }
          }
        } catch {
          continue;
        }
      }

      const hasNoAvailability =
        (await targetPage.locator('text="No availability"').count()) > 0 ||
        (await targetPage.locator('text="Sold Out"').count()) > 0;

      await browser.close();

      const available = availableSlots.length > 0 && !hasNoAvailability;

      return {
        available,
        availableSlots,
        details: {
          date,
          partySize,
          tourName: tourName ?? 'Unknown',
          timeWindow: timeWindow ?? 'Any',
          slotCount: availableSlots.length,
        },
        source: 'browserbase',
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Scrape failed';
      const errStack = error instanceof Error ? error.stack : undefined;
      console.error('FareHarbor scrape error:', errMsg, errStack ?? '');
      try {
        await browser?.close();
      } catch {
        //
      }
      return {
        available: false,
        error: errMsg,
        source: 'browserbase',
        details: {
          date,
          partySize,
          operator,
          sessionId,
          note: 'Manual check may be required. Look up session in Browserbase dashboard.',
        },
      };
    }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      const errStack = error instanceof Error ? error.stack : undefined;
      console.error('Browserbase availability check error:', errMsg, errStack ?? '');
      return {
        available: false,
        error: errMsg,
        source: 'browserbase',
        details: {
          date,
          partySize,
          operator,
          sessionId,
          note: 'Check Vercel logs for stack. Look up session in Browserbase dashboard.',
        },
      };
    }
  }

/**
 * Check availability using Playwright (self-hosted)
 * This would require Playwright to be installed and running
 */
export async function checkAvailabilityPlaywright({
  operator,
  date,
  partySize,
}: {
  operator: 'blueHawaiian' | 'rainbow';
  date: string;
  partySize: number;
}): Promise<{
  available: boolean;
  details?: any;
  error?: string;
}> {
  // This would require Playwright to be installed
  // For now, return a placeholder
  return {
    available: false,
    error: 'Playwright automation not yet implemented. Use Browserbase or implement Playwright service.',
  };
}

/**
 * Main availability check function
 * Uses Browserbase if BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are configured
 * Falls back to Playwright if configured
 */
export async function checkAvailability({
  operator,
  date,
  partySize,
  tourName,
  timeWindow,
}: {
  operator: 'blueHawaiian' | 'rainbow';
  date: string;
  partySize: number;
  tourName?: string;
  timeWindow?: string;
}): Promise<{
  available: boolean;
  details?: any;
  error?: string;
  source?: string;
  availableSlots?: Array<{ time: string; price?: number; available: boolean }>;
}> {
  // Try Browserbase first (requires BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID)
  if (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) {
    return await checkAvailabilityBrowserbase({ operator, date, partySize, tourName, timeWindow });
  }

  // Fallback to Playwright if configured
  if (process.env.PLAYWRIGHT_SERVICE_URL) {
    const result = await checkAvailabilityPlaywright({ operator, date, partySize });
    return { ...result, source: 'playwright' };
  }

  // For Rainbow, always return manual check required
  if (operator === 'rainbow') {
    return {
      available: false,
      error: 'Rainbow Helicopters requires manual availability check. Operator will be contacted via email.',
      source: 'manual',
      details: {
        note: 'Rainbow Helicopters does not have live availability API.',
      },
    };
  }

  return {
    available: false,
    error: 'No browser automation service configured. Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID, or PLAYWRIGHT_SERVICE_URL',
    source: 'none',
  };
}
