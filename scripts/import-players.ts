import { PrismaClient, Position, PlayerStatus } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

const teamAbbrevToName: Record<string, string> = {
  'ADE': 'Adelaide Crows',
  'BRL': 'Brisbane Lions',
  'CAR': 'Carlton',
  'COL': 'Collingwood',
  'ESS': 'Essendon',
  'FRE': 'Fremantle',
  'GEE': 'Geelong Cats',
  'GCS': 'Gold Coast Suns',
  'GWS': 'GWS Giants',
  'HAW': 'Hawthorn',
  'MEL': 'Melbourne',
  'NTH': 'North Melbourne',
  'PTA': 'Port Adelaide',
  'RIC': 'Richmond',
  'STK': 'St Kilda',
  'SYD': 'Sydney Swans',
  'WCE': 'West Coast Eagles',
  'WBD': 'Western Bulldogs',
}

function parsePositions(posStr: string): Position[] {
  if (!posStr) return []
  const cleaned = posStr.replace(/[{}"]/g, '')
  return cleaned.split(',').map(p => p.trim()).filter(p => ['DEF', 'MID', 'RUC', 'FWD'].includes(p)) as Position[]
}

function parseDecimal(val: string | undefined): number | null {
  if (!val || val === '') return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

function parseInt2(val: string | undefined): number | null {
  if (!val || val === '') return null
  const num = parseInt(val)
  return isNaN(num) ? null : num
}

async function main() {
  console.log('🏈 Importing players...')

  // Get team IDs
  const teams = await prisma.aflTeam.findMany()
  const teamNameToId: Record<string, string> = {}
  teams.forEach(t => { teamNameToId[t.name] = t.id })

  // Read CSV
  const csv = fs.readFileSync('afl-players-import.csv', 'utf-8')
  const lines = csv.split('\n').filter(l => l.trim())
  const headers = lines[0].split(',')

  const players: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Parse CSV
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) { values.push(current); current = '' }
      else current += char
    }
    values.push(current)

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h.trim()] = values[idx]?.trim() || '' })

    const teamName = teamAbbrevToName[row['team_abbrev']]
    const aflTeamId = teamName ? teamNameToId[teamName] : null

    players.push({
      aflFantasyId: row['afl_fantasy_id'],
      firstName: row['first_name'],
      lastName: row['last_name'],
      positions: parsePositions(row['positions']),
      isAvailable: row['is_available']?.toLowerCase() === 'true',
      status: (row['status'] as PlayerStatus) || 'ACTIVE',
      gamesPlayed: parseInt2(row['games_played']),
      avgPoints: parseDecimal(row['avg_points']),
      maxScore: parseInt2(row['max_score']),
      games100Plus: parseInt2(row['games_100_plus']),
      games120Plus: parseInt2(row['games_120_plus']),
      cbaPercent: parseDecimal(row['cba_percent']),
      ppm: parseDecimal(row['ppm']),
      regAvg: parseDecimal(row['reg_avg']),
      last5Avg: parseDecimal(row['last5_avg']),
      finalsAvg: parseDecimal(row['finals_avg']),
      avg2024: parseDecimal(row['avg_2024']),
      avg2023: parseDecimal(row['avg_2023']),
      aflTeamId,
    })
  }

  // Bulk insert
  const result = await prisma.aflPlayer.createMany({
    data: players,
    skipDuplicates: true,
  })

  console.log(`✅ Imported ${result.count} players`)
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
