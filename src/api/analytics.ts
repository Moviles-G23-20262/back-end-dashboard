import type { AverageTicket, BuyerJourneyFunnel } from '../types'
import { analyticsBase } from './config'

export async function getBuyerJourneyFunnel(): Promise<BuyerJourneyFunnel> {
  const response = await fetch(`${analyticsBase}/analytics/buyer-journey-funnel/`)
  if (!response.ok) throw new Error(`Unable to load buyer journey funnel (${response.status})`)
  return response.json() as Promise<BuyerJourneyFunnel>
}

export async function getAverageTicket(): Promise<AverageTicket> {
  // no-store: the figure comes from the database on every call and must never be a browser-cached copy.
  const response = await fetch(`${analyticsBase}/analytics/average-ticket/`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to load average ticket (${response.status})`)
  const data = (await response.json()) as Partial<AverageTicket>
  // An answer of another shape is an error to show, never a silent default.
  if (typeof data !== 'object' || data === null || typeof data.byCondition !== 'object' || data.byCondition === null || !('globalAverage' in data)) {
    throw new Error('Average ticket answer has an unexpected shape')
  }
  return data as AverageTicket
}
