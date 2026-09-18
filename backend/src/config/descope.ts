import DescopeClient from '@descope/node-sdk'
import e from 'express'

const projectId = process.env.DESCOPE_PROJECT_ID
const managementKey = process.env.DESCOPE_MANAGEMENT_KEY

if (!projectId) {
  throw new Error('Missing DESCOPE_PROJECT_ID environment variable')
}

export const descope = DescopeClient({
    projectId : projectId ?? "",
    managementKey : process.env.DESCOPE_MANAGEMENT_KEY ?? "",
})
