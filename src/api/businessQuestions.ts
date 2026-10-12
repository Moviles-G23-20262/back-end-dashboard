import type { MeetingPointHeatmap, MeetingPointHourCount } from '../types'
import { executeRawSql } from './rawSql'

export const MEETING_POINT_USAGE_SQL = `SELECT mp.name AS meeting_point,
       EXTRACT(HOUR FROM e."completedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota')::int AS local_hour,
       COUNT(*)::int AS exchanges
FROM "Exchange" e
JOIN "MeetingPoint" mp ON mp.id = e."meetingPointId"
WHERE e.status = 'COMPLETED' AND e."completedAt" IS NOT NULL
GROUP BY mp.name, local_hour
ORDER BY mp.name, local_hour;`

export async function fetchMeetingPointUsage(): Promise<MeetingPointHourCount[]> {
  const result = await executeRawSql({ query: MEETING_POINT_USAGE_SQL })
  return result.rows.map((row) => ({
    meetingPoint: String(row.meeting_point),
    localHour: Number(row.local_hour),
    exchanges: Number(row.exchanges),
  }))
}

export function toMeetingPointHeatmap(rows: MeetingPointHourCount[]): MeetingPointHeatmap {
  const byPoint = new Map<string, Record<number, number>>()
  for (const row of rows) {
    const counts = byPoint.get(row.meetingPoint) ?? {}
    counts[row.localHour] = (counts[row.localHour] ?? 0) + row.exchanges
    byPoint.set(row.meetingPoint, counts)
  }
  const usedHours = rows.map((row) => row.localHour)
  const hours = usedHours.length === 0 ? [] : range(Math.min(...usedHours), Math.max(...usedHours))
  const points = [...byPoint.entries()]
    .map(([name, counts]) => ({ name, counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  const maxCount = Math.max(0, ...rows.map((row) => row.exchanges))
  return { hours, points, maxCount }
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
}
