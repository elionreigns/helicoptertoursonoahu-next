/**
 * Controls the optional post-capture automation for Blue Hawaiian leads.
 *
 * Off is the safe default: the site still saves the lead and alerts the team,
 * but it does not scrape availability, contact the operator, or run n8n.
 * Set BLUE_HAWAIIAN_LEAD_ROUTING_ENABLED=true only after the workflow is
 * reviewed and intentionally enabled in Vercel.
 */
export function isBlueHawaiianLeadRoutingEnabled(): boolean {
  return process.env.BLUE_HAWAIIAN_LEAD_ROUTING_ENABLED?.trim().toLowerCase() === 'true';
}
