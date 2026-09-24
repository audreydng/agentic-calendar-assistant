import { AuthenticatedExtra, defineTool } from "@descope/mcp-express";
import { z } from "zod";
import {
  cancelMeeting,
  checkCalendarBusy,
  createMeeting,
  getCalendarTimeZone,
  listUpcomingMeetings,
  rescheduleMeeting,
} from "../services/calendar.service.js";

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function authUserIdFromToken(token: string): string {
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1] ?? "", "base64").toString("utf8"),
  ) as { sub?: string };

  if (!payload.sub) {
    throw new Error("MCP token has no user id");
  }

  return String(payload.sub);
}

const defineMcpTool = defineTool as (cfg: {
  name: string;
  description: string;
  input?: Record<string, unknown>;
  scopes?: string[];
  handler: (
    args: Record<string, unknown>,
    extra: AuthenticatedExtra,
  ) => ReturnType<typeof textResult> | Promise<ReturnType<typeof textResult>>;
}) => ReturnType<typeof defineTool>;

const isoDateTime = z.string().describe("Time as ISO-8601 datetime");

/** Parses args once so each handler gets typed values instead of unknowns. */
function parseArgs<T extends z.ZodType>(schema: T, args: Record<string, unknown>) {
  const parsed = schema.safeParse(args);

  if (!parsed.success) {
    throw new Error(z.prettifyError(parsed.error));
  }

  return parsed.data as z.infer<T>;
}

export const listUpcomingMeetingsTools = defineMcpTool({
  name: "listUpcomingMeetings",
  description:
    "List Google Calendar events. Set todayOnly=true for today's agenda only.",
  input: {
    maxResults: z.number().int().min(1).max(20).optional(),

    todayOnly: z
      .boolean()
      .optional()
      .describe("If true, only return events for today"),
  },
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const authUserId = authUserIdFromToken(extra.authInfo.token);

      const meetings = await listUpcomingMeetings({
        authUserId,
        maxResults:
          typeof args.maxResults === "number" ? args.maxResults : undefined,
        todayOnly:
          typeof args.todayOnly === "boolean" ? args.todayOnly : undefined,
      });

      return textResult({ meetings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "List Failed";
      return textResult({ error: message });
    }
  },
});

const checkCalendarBusyInput = {
  startIso: isoDateTime,
  endIso: isoDateTime,
};

export const checkCalendarBusyTool = defineMcpTool({
  name: "checkCalendarBusy",
  description:
    "Check if the user is busy between two ISO datetimes using Google freebusy.",
  input: checkCalendarBusyInput,
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const authUserId = authUserIdFromToken(extra.authInfo.token);
      const input = parseArgs(z.object(checkCalendarBusyInput), args);

      return textResult(await checkCalendarBusy({ authUserId, ...input }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Busy check failed";
      return textResult({ error: message });
    }
  },
});

const createMeetingInput = {
  title: z.string().min(1),
  startIso: isoDateTime,
  endIso: isoDateTime,
  attendeeEmails: z
    .array(z.email())
    .optional()
    .describe(
      "Invite these emails exactly as the user wrote them; Google sends calendar invites",
    ),
  description: z.string().optional(),
  addGoogleMeet: z
    .boolean()
    .optional()
    .describe("Default true. Set false to skip Google Meet link"),
};

export const createMeetingTool = defineMcpTool({
  name: "createMeeting",
  description:
    "Create a Google Calendar event. Adds a Google Meet link by default. Emails invitees when attendeeEmails are set.",
  input: createMeetingInput,
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const authUserId = authUserIdFromToken(extra.authInfo.token);
      const input = parseArgs(z.object(createMeetingInput), args);
      const timeZone = await getCalendarTimeZone(authUserId);

      return textResult(await createMeeting({ authUserId, timeZone, ...input }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Create failed";
      return textResult({ error: message });
    }
  },
});

const rescheduleMeetingInput = {
  eventId: z.string().min(1),
  startIso: isoDateTime,
  endIso: isoDateTime,
};

export const rescheduleMeetingTool = defineMcpTool({
  name: "rescheduleMeeting",
  description:
    "Move an existing event to a new start/end time and email invitees.",
  input: rescheduleMeetingInput,
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const authUserId = authUserIdFromToken(extra.authInfo.token);
      const input = parseArgs(z.object(rescheduleMeetingInput), args);
      const timeZone = await getCalendarTimeZone(authUserId);

      return textResult(
        await rescheduleMeeting({ authUserId, timeZone, ...input }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Reschedule failed";
      return textResult({ error: message });
    }
  },
});

const cancelMeetingInput = {
  eventId: z.string().min(1),
};

export const cancelMeetingTool = defineMcpTool({
  name: "cancelMeeting",
  description:
    "Cancel a Google Calendar event by id and email attendees about the cancellation.",
  input: cancelMeetingInput,
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const authUserId = authUserIdFromToken(extra.authInfo.token);
      const input = parseArgs(z.object(cancelMeetingInput), args);

      return textResult(await cancelMeeting({ authUserId, ...input }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cancel failed";
      return textResult({ error: message });
    }
  },
});
