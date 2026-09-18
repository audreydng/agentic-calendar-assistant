import DescopeClient from '@descope/node-sdk'
import e from 'express'

const projectId = process.env.DESCOPE_PROJECT_ID
const managementKey = process.env.DESCOPE_MANAGEMENT_KEY

if (!projectId) {
  throw new Error('Missing DESCOPE_PROJECT_ID environment variable')
}

export const descopeClient = DescopeClient({
    projectId : projectId ?? "",
    managementKey : managementKey ?? "",
})

export const CALENDAR_CONNECTION_ID =
  process.env.DESCOPE_CALENDAR_CONNECTION_ID ?? "google-calendar";

export const CALENDAR_CONNECTION_LABEL = "Google Calendar";
