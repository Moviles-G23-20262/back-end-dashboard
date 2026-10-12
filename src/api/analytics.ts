import type { BuyerJourneyFunnel } from '../types'
import { analyticsBase } from './config'

export async function getBuyerJourneyFunnel(): Promise<BuyerJourneyFunnel> {
  const response = await fetch(`${analyticsBase}/analytics/buyer-journey-funnel/`)
  if (!response.ok) throw new Error(`Unable to load buyer journey funnel (${response.status})`)
  return response.json() as Promise<BuyerJourneyFunnel>
}
