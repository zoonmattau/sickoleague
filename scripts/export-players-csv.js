const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'afl-fantasy-2026.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(worksheet, { range: 1 });

const teamAbbrevToName = {
  'ADE': 'Adelaide Crows', 'BRL': 'Brisbane Lions', 'CAR': 'Carlton',
  'COL': 'Collingwood', 'ESS': 'Essendon', 'FRE': 'Fremantle',
  'GEE': 'Geelong Cats', 'GCS': 'Gold Coast Suns', 'GWS': 'GWS Giants',
  'HAW': 'Hawthorn', 'MEL': 'Melbourne', 'NTH': 'North Melbourne',
  'PTA': 'Port Adelaide', 'RIC': 'Richmond', 'STK': 'St Kilda',
  'SYD': 'Sydney Swans', 'WCE': 'West Coast Eagles', 'WBD': 'Western Bulldogs',
};

function parseName(fullName) {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function parsePositions(posStr) {
  if (!posStr) return '{}';
  const positions = posStr.split('/').map(p => p.trim()).filter(p => ['DEF', 'MID', 'RUC', 'FWD'].includes(p));
  return '{' + positions.join(',') + '}';
}

const rows = rawData.filter(r => r.Player && r.Team && teamAbbrevToName[r.Team]).map(row => {
  const { firstName, lastName } = parseName(row.Player);
  return {
    afl_fantasy_id: row['Champion Data ID'] || '',
    first_name: firstName,
    last_name: lastName,
    positions: parsePositions(row.Position),
    is_available: 'true',
    status: 'ACTIVE',
    games_played: row.GMS || '',
    avg_points: row.FP || '',
    max_score: row.MAX || '',
    games_100_plus: row['100+'] || '',
    games_120_plus: row['120+'] || '',
    cba_percent: row['CBA%'] ? (row['CBA%'] * 100).toFixed(2) : '',
    ppm: row.PPM || '',
    reg_avg: row.REG || '',
    last5_avg: row.L5 || '',
    finals_avg: row.FIN || '',
    avg_2024: row['2024'] || '',
    avg_2023: row['2023'] || '',
    team_abbrev: row.Team,
  };
});

// Create CSV
const headers = Object.keys(rows[0]);
const csvLines = [headers.join(',')];
for (const row of rows) {
  const values = headers.map(h => {
    const val = row[h];
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  });
  csvLines.push(values.join(','));
}

fs.writeFileSync(path.join(__dirname, '..', 'afl-players-import.csv'), csvLines.join('\n'));
console.log('Created afl-players-import.csv with', rows.length, 'players');
console.log('Sample row:', JSON.stringify(rows[0], null, 2));
