import type { AverageTicket, BuyerJourneyFunnel } from '../types'
import { analyticsBase } from './config'

export async function getBuyerJourneyFunnel(): Promise<BuyerJourneyFunnel> {
  const response = await fetch(`${analyticsBase}/analytics/buyer-journey-funnel/`)
  if (!response.ok) throw new Error(`Unable to load buyer journey funnel (${response.status})`)
  return response.json() as Promise<BuyerJourneyFunnel>
}

export async function getAverageTicket(): Promise<AverageTicket> {
  const response = await fetch(`${analyticsBase}/analytics/average-ticket/`)
  if (!response.ok) throw new Error(`Unable to load average ticket (${response.status})`)
  return response.json() as Promise<AverageTicket>
}
