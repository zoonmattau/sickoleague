import { PrismaClient } from '@prisma/client'
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

async function main() {
  // Get team IDs from database
  const teams = await prisma.aflTeam.findMany()
  const teamNameToId: Record<string, string> = {}
  teams.forEach(t => { teamNameToId[t.name] = t.id })

  console.log('Team IDs:', teamNameToId)

  // Read CSV
  const csv = fs.readFileSync('afl-players-import.csv', 'utf-8')
  const lines = csv.split('\n').filter(l => l.trim())

  // New header - replace team_abbrev with afl_team_id
  const oldHeader = lines[0]
  const newHeader = oldHeader.replace('team_abbrev', 'afl_team_id')

  const newLines = [newHeader]

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Parse CSV (handle quoted fields)
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    values.push(current)

    // Last column is team_abbrev
    const teamAbbrev = values[values.length - 1]
    const teamName = teamAbbrevToName[teamAbbrev]
    const teamId = teamName ? teamNameToId[teamName] : ''

    if (!teamId) {
      console.log(`Warning: No team ID for ${teamAbbrev}`)
    }

    // Replace last value with team ID
    values[values.length - 1] = teamId

    newLines.push(values.join(','))
  }

  fs.writeFileSync('afl-players-supabase.csv', newLines.join('\n'))
  console.log(`\n✅ Created afl-players-supabase.csv with ${newLines.length - 1} players`)
  console.log('Now import this file into Supabase!')
}

main()
  .finally(() => prisma.$disconnect())
