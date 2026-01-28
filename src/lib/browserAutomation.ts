import 'server-only';
/**
 * Browser automation for checking operator availability
 * Supports Browserbase and Playwright
 */
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
    // Get operator tours page URL
    const operatorUrls: Record<string, string> = {
      blueHawaiian: 'https://www.bluehawaiian.com/en/tours',
      rainbow: 'https://www.rainbowhelicopters.com/tours',
    };

    const toursUrl = operatorUrls[operator];
    if (!toursUrl) {
      return {
        available: false,
        error: 'Unknown operator',
        source: 'browserbase',
      };
    }

    // Create a browser session using Browserbase API
    // Note: Using api.browserbase.com (not www.browserbase.com) for API calls
    const sessionResponse = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bb-api-key': browserbaseApiKey,
      },
      body: JSON.stringify({
        projectId: browserbaseProjectId,
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`Failed to create browser session: ${errorText}`);
    }

    const session = await sessionResponse.json();
    const sessionId = session.id;

    console.log(`Browserbase session created: ${sessionId} for Blue Hawaiian on ${date}`);

    // Execute script to scrape FareHarbor calendar
    // Navigate directly to FareHarbor calendar URL and extract availability
    const script = `
      const { chromium } = require('playwright');
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      
      try {
        // Navigate directly to FareHarbor calendar
        console.log('Navigating to FareHarbor calendar: ${fareHarborUrl}');
        await page.goto('${fareHarborUrl}', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForTimeout(5000); // Wait for calendar to load
        
        // FareHarbor calendars are typically in iframes, so we need to handle that
        // Try to find the calendar iframe first
        let calendarFrame = null;
        const iframeSelectors = [
          'iframe[src*="fareharbor"]',
          'iframe[src*="calendar"]',
          'iframe',
        ];
        
        for (const selector of iframeSelectors) {
          try {
            const iframe = await page.locator(selector).first();
            if (await iframe.isVisible({ timeout: 3000 })) {
              calendarFrame = await iframe.contentFrame();
              if (calendarFrame) break;
            }
          } catch (e) {
            continue;
          }
        }
        
        // Use the iframe if found, otherwise use main page
        const targetPage = calendarFrame || page;
        
        // Wait for calendar to fully load
        await targetPage.waitForTimeout(3000);
        
        // Look for the specific date in the calendar
        // FareHarbor typically shows dates as clickable elements
        const dateStr = '${date}'; // YYYY-MM-DD format
        const [year, month, day] = dateStr.split('-');
        
        // Try to find and click the date
        const dateSelectors = [
          \`[data-date="\${dateStr}"]\`,
          \`[data-day="\${day}"]\`,
          \`button:has-text("\${day}")\`,
          \`.calendar-day[data-date*="\${dateStr}"]\`,
          \`td:has-text("\${day}")\`,
        ];
        
        let dateClicked = false;
        for (const selector of dateSelectors) {
          try {
            const dateElement = await targetPage.locator(selector).first();
            if (await dateElement.isVisible({ timeout: 2000 })) {
              // Check if date is disabled/unavailable
              const isDisabled = await dateElement.getAttribute('disabled') || 
                                await dateElement.getAttribute('aria-disabled') === 'true' ||
                                (await dateElement.getAttribute('class') || '').includes('disabled') ||
                                (await dateElement.getAttribute('class') || '').includes('unavailable');
              
              if (!isDisabled) {
                await dateElement.click();
                dateClicked = true;
                console.log('Clicked date:', dateStr);
                await targetPage.waitForTimeout(2000);
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        // After clicking date, look for available time slots
        await targetPage.waitForTimeout(3000);
        
        // FareHarbor time slots are typically buttons or links
        const timeSlotSelectors = [
          'button[class*="time"]:not([disabled])',
          'a[class*="time"]:not([disabled])',
          '.time-slot:not(.unavailable):not(.sold-out)',
          '.available-time',
          '[data-time]:not([disabled])',
          'button:has-text("AM"):not([disabled])',
          'button:has-text("PM"):not([disabled])',
        ];
        
        const availableSlots = [];
        for (const selector of timeSlotSelectors) {
          try {
            const slots = await targetPage.locator(selector).all();
            for (const slot of slots) {
              try {
                const timeText = await slot.textContent();
                const isDisabled = await slot.getAttribute('disabled') !== null ||
                                  (await slot.getAttribute('class') || '').includes('unavailable') ||
                                  (await slot.getAttribute('class') || '').includes('sold-out');
                
                if (!isDisabled && timeText && timeText.trim()) {
                  // Try to extract price if available
                  const priceText = await slot.getAttribute('data-price') || 
                                   await slot.getAttribute('aria-label') || '';
                  const priceMatch = priceText.match(/\\$([\\d,]+)/);
                  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;
                  
                  availableSlots.push({
                    time: timeText.trim(),
                    price: price,
                    available: true,
                  });
                }
              } catch (e) {
                continue;
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        // Also check for "no availability" messages
        const noAvailabilitySelectors = [
          'text="No availability"',
          'text="Sold Out"',
          'text="Not Available"',
          '.no-availability',
          '.sold-out',
        ];
        
        let noAvailability = false;
        for (const selector of noAvailabilitySelectors) {
          try {
            const element = await targetPage.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              noAvailability = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        // Determine availability status
        const available = availableSlots.length > 0 && !noAvailability;
        
        // Get page content for debugging
        const pageTitle = await page.title();
        const pageUrl = page.url();
        
        return {
          available,
          availableSlots,
          availableCount: availableSlots.length,
          dateClicked,
          noAvailability,
          details: {
            date: dateStr,
            partySize: ${partySize},
            tourName: '${tourName || 'Unknown'}',
            timeWindow: '${timeWindow || 'Any'}',
            pageTitle,
            pageUrl,
          }
        };
      } catch (error) {
        return {
          available: false,
          error: error.message,
          details: { 
            date: '${date}', 
            partySize: ${partySize},
            errorMessage: error.message,
          }
        };
      } finally {
        await page.close();
        await browser.close();
      }
    `;

      // IMPORTANT: Browserbase doesn't have an /execute endpoint
      // Instead, you need to:
      // 1. Get the connection URL from the session
      // 2. Connect using Playwright/Puppeteer via that URL
      // 3. Run automation scripts using Playwright APIs
      //
      // For serverless functions, this requires:
      // - Installing @browserbasehq/sdk or playwright
      // - Using the SDK's connect() method to get a browser instance
      // - Running Playwright code against that browser
      //
      // Current limitation: This implementation needs to be updated to use Browserbase SDK
      // See: https://docs.browserbase.com/fundamentals/using-browser-session
      
      try {
        // Get session details to retrieve connection URL
        const sessionDetailsResponse = await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
          method: 'GET',
          headers: {
            'x-bb-api-key': browserbaseApiKey,
          },
        });

        if (!sessionDetailsResponse.ok) {
          const errorText = await sessionDetailsResponse.text();
          const status = sessionDetailsResponse.status;
          console.error(`Browserbase get session error (${status}):`, errorText);
          throw new Error(`Failed to get session details (${status}): ${errorText}`);
        }

        const sessionDetails = await sessionDetailsResponse.json();
        console.log('Session details:', { id: sessionDetails.id, ready: sessionDetails.ready });

        // TODO: Use Browserbase SDK to connect and run Playwright automation
        // For now, return manual check required until SDK is integrated
        // Example implementation needed:
        // const { Browserbase } = require('@browserbasehq/sdk');
        // const bb = new Browserbase({ apiKey: browserbaseApiKey });
        // const browser = await bb.connect(sessionId);
        // const page = await browser.newPage();
        // await page.goto(fareHarborUrl);
        // ... automation code ...

        // Close session
        await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'x-bb-api-key': browserbaseApiKey,
          },
        }).catch(err => console.error('Error closing session:', err));

        return {
          available: false,
          error: 'Browserbase automation requires SDK integration. Manual check required.',
          source: 'browserbase',
          details: {
            date,
            partySize,
            operator,
            note: 'Browserbase SDK integration needed. See WORKFLOW.md for implementation details.',
            sessionId,
          },
        };
      } catch (error) {
        console.error('Browserbase execution error:', error);
        
        // Close session on error
        await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'x-bb-api-key': browserbaseApiKey,
          },
        }).catch(err => console.error('Error closing session:', err));
        
        return {
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'browserbase',
          details: {
            date,
            partySize,
            operator,
            note: 'Browserbase execution failed. Manual check may be required.',
          },
        };
      }
    } catch (error) {
      console.error('Browserbase availability check error:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'browserbase',
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
