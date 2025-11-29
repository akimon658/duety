import ICAL from "ical.js";

export interface ParsedEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart?: Date;
  dtend?: Date;
  dueDate?: Date;
}

/**
 * Parses an iCal string and extracts events
 * @param icalData - Raw iCal data string
 * @returns Array of parsed events
 */
export function parseIcal(icalData: string): ParsedEvent[] {
  const jcalData = ICAL.parse(icalData);
  const vcalendar = new ICAL.Component(jcalData);
  const vevents = vcalendar.getAllSubcomponents("vevent");

  return vevents.map((vevent: ICAL.Component) => {
    const event = new ICAL.Event(vevent);

    const dtstart = event.startDate?.toJSDate();
    const dtend = event.endDate?.toJSDate();

    // For assignments, the due date is typically the end date or start date
    const dueDate = dtend || dtstart;

    return {
      uid: event.uid,
      summary: event.summary,
      description: event.description || undefined,
      dtstart,
      dtend,
      dueDate,
    };
  }).filter((event: ParsedEvent) => event.uid && event.summary);
}

/**
 * Fetches and parses an iCal URL
 * @param url - The iCal URL to fetch
 * @returns Array of parsed events
 */
export async function fetchAndParseIcal(url: string): Promise<ParsedEvent[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch iCal: ${response.statusText}`);
  }

  const icalData = await response.text();
  return parseIcal(icalData);
}
