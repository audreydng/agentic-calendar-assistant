import { google } from "googleapis";
import { randomUUID } from "node:crypto";
import { getCalendarAccessToken } from "./token.service.js";
import { dayRangeInZone, isValidTimeZone } from "../utils/timezone.js";

const FALLBACK_TIME_ZONE = process.env.DEFAULT_TIMEZONE ?? "UTC";

function calendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();

  auth.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({
    version: "v3",
    auth,
  });
}

async function calendarForUser(authUserId: string) {
  const accessToken = await getCalendarAccessToken(authUserId);

  return calendarClient(accessToken);
}

// Google opens htmlLink in the browser's default account (authuser=0), which
// shows "event not found" when that isn't the calendar owner. Pin the account.
function withAccount(link: string | null | undefined, email?: string | null) {
  if (!link) return null;
  if (!email) return link;

  const url = new URL(link);
  url.searchParams.set("authuser", email);
  return url.toString();
}

function formatEvent(event: {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  organizer?: { email?: string | null } | null;
  attendees?: Array<{
    email?: string | null;
    displayName?: string | null;
  }> | null;
}) {
  return {
    id: event.id,
    title: event.summary ?? "(no title)",
    description: event.description?.trim() || null,
    location: event.location?.trim() || null,
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
    htmlLink: withAccount(event.htmlLink, event.organizer?.email),
    meetLink: withAccount(event.hangoutLink, event.organizer?.email),
    attendees: (event.attendees ?? [])
      .map((person) => person.email || person.displayName)
      .filter((value): value is string => Boolean(value)),
  };
}

/**
 * Time zone of the user's primary Google Calendar. events.list returns it
 * alongside the items, so this works with the scopes we already request.
 */
export async function getCalendarTimeZone(authUserId: string) {
  try {
    const calendar = await calendarForUser(authUserId);
    const response = await calendar.events.list({
      calendarId: "primary",
      maxResults: 1,
      timeMin: new Date().toISOString(),
      fields: "timeZone",
    });

    const timeZone = response.data.timeZone;
    if (timeZone && isValidTimeZone(timeZone)) return timeZone;
  } catch {
    // Calendar not connected yet or request failed; fall back below.
  }

  return FALLBACK_TIME_ZONE;
}

export async function listUpcomingMeetings(input: {
  authUserId: string;
  maxResults?: number;
  todayOnly?: boolean;
  timeZone?: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  let timeMin = new Date().toISOString();

  let timeMax: string | undefined;

  if (input.todayOnly) {
    // "Today" is the user's calendar day, not the server's.
    const timeZone =
      input.timeZone ?? (await getCalendarTimeZone(input.authUserId));
    const { start, end } = dayRangeInZone(new Date(), timeZone);

    timeMin = start.toISOString();
    timeMax = end.toISOString();
  }

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    maxResults: input.maxResults ?? 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items ?? []).map(formatEvent);
}

export async function createMeeting(input: {
  authUserId: string;
  title: string;
  startIso: string;
  endIso: string;
  attendeeEmails?: string[];
  description?: string;
  addGoogleMeet?: boolean;
  timeZone?: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  // enabling this one by default
  const withMeet = input.addGoogleMeet !== false;

  const response = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    conferenceDataVersion: withMeet ? 1 : undefined,
    requestBody: {
      summary: input.title,
      description: input.description,
      start: {
        dateTime: input.startIso,
        timeZone: input.timeZone,
      },
      end: {
        dateTime: input.endIso,
        timeZone: input.timeZone,
      },
      attendees: (input.attendeeEmails ?? []).map((email) => ({ email })),
      conferenceData: withMeet
        ? {
            createRequest: {
              requestId: randomUUID(),
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          }
        : undefined,
    },
  });

  return {
    ...formatEvent(response.data),
    inviteEmailsSent: (input.attendeeEmails ?? []).length > 0,
    googleMeetAdded: withMeet,
  };
}

export async function cancelMeeting(input: {
  authUserId: string;
  eventId: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  await calendar.events.delete({
    calendarId: "primary",
    eventId: input.eventId,
    sendUpdates: "all",
  });

  return {
    cancelled: true,
    eventId: input.eventId,
  };
}

export async function rescheduleMeeting(input: {
  authUserId: string;
  eventId: string;
  startIso: string;
  endIso: string;
  timeZone?: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId: input.eventId,
    sendUpdates: "all",
    requestBody: {
      start: {
        dateTime: input.startIso,
        timeZone: input.timeZone,
      },
      end: {
        dateTime: input.endIso,
        timeZone: input.timeZone,
      },
    },
  });

  return formatEvent(response.data);
}

export async function checkCalendarBusy(input: {
  authUserId: string;
  startIso: string;
  endIso: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: input.startIso,
      timeMax: input.endIso,
      items: [
        {
          id: "primary",
        },
      ],
    },
  });

  const busy = response.data?.calendars?.primary?.busy ?? [];

  return {
    busy: busy.map((item) => ({
      start: item.start ?? null,
      end: item.end ?? null,
    })),
  };
}
