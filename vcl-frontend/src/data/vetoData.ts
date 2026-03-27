/**
 * Map veto data for playoff teams — sourced from Liquipedia (2026-03-27).
 * Used to compute first ban / first pick tendencies per team.
 */

type VetoStep = [action: string, team: string, map: string]

interface VetoMatch {
  date: string
  opponent: string
  tournament: string
  score: string
  format: string
  vetoes: VetoStep[]
}

const MISA_MATCHES: VetoMatch[] = [
  { date: '2026-01-11', opponent: 'Fire Flux Esports', tournament: 'VCL Türkiye Kickoff Week 1', score: '1-2', format: 'Bo3', vetoes: [['Ban 1','MISA','Pearl'],['Ban 2','Fire Flux Esports','Sunset'],['Pick 1','MISA','Corrode'],['Pick 2','Fire Flux Esports','Abyss'],['Ban 3','MISA','Bind'],['Ban 4','Fire Flux Esports','Haven'],['Decider','-','Split']] },
  { date: '2026-01-17', opponent: 'Eternal Fire', tournament: 'VCL Türkiye Kickoff Week 2', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Eternal Fire','Breeze'],['Ban 2','MISA','Pearl'],['Pick 1','Eternal Fire','Abyss'],['Pick 2','MISA','Haven'],['Ban 3','Eternal Fire','Bind'],['Ban 4','MISA','Split'],['Decider','-','Corrode']] },
  { date: '2026-01-19', opponent: 'Galatasaray Esports', tournament: 'VCL Türkiye Kickoff Week 2', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','Galatasaray Esports','Abyss'],['Ban 2','MISA','Bind'],['Pick 1','Galatasaray Esports','Split'],['Pick 2','MISA','Haven'],['Ban 3','Galatasaray Esports','Breeze'],['Ban 4','MISA','Pearl'],['Decider','-','Corrode']] },
  { date: '2026-01-24', opponent: 'FUT Academy', tournament: 'VCL Türkiye Kickoff Week 3', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','MISA','Pearl'],['Ban 2','FUT Academy','Abyss'],['Pick 1','MISA','Haven'],['Pick 2','FUT Academy','Bind'],['Ban 3','MISA','Breeze'],['Ban 4','FUT Academy','Split'],['Decider','-','Corrode']] },
  { date: '2026-01-26', opponent: 'S2G Esports', tournament: 'VCL Türkiye Kickoff Week 3', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','S2G Esports','Bind'],['Ban 2','MISA','Breeze'],['Pick 1','S2G Esports','Pearl'],['Pick 2','MISA','Haven'],['Ban 3','S2G Esports','Corrode'],['Ban 4','MISA','Abyss'],['Decider','-','Split']] },
  { date: '2026-02-01', opponent: 'Bushido Wildcats', tournament: 'VCL Türkiye Kickoff Week 4', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Bushido Wildcats','Split'],['Ban 2','MISA','Breeze'],['Pick 1','Bushido Wildcats','Corrode'],['Pick 2','MISA','Haven'],['Ban 3','Bushido Wildcats','Bind'],['Ban 4','MISA','Pearl'],['Decider','-','Abyss']] },
  { date: '2026-02-07', opponent: 'Beşiktaş Esports', tournament: 'VCL Türkiye Kickoff Week 5', score: '0-2', format: 'Bo3', vetoes: [['Ban 1','MISA','Breeze'],['Ban 2','Beşiktaş Esports','Haven'],['Pick 1','MISA','Corrode'],['Pick 2','Beşiktaş Esports','Pearl'],['Ban 3','MISA','Bind'],['Ban 4','Beşiktaş Esports','Abyss'],['Decider','-','Split']] },
  { date: '2026-02-28', opponent: 'S2G Esports', tournament: 'VCL Türkiye Kickoff Playoffs', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','S2G Esports','Haven'],['Ban 2','MISA','Bind'],['Pick 1','S2G Esports','Breeze'],['Pick 2','MISA','Split'],['Ban 3','S2G Esports','Pearl'],['Ban 4','MISA','Corrode'],['Decider','-','Abyss']] },
  { date: '2026-03-01', opponent: 'Beşiktaş Esports', tournament: 'VCL Türkiye Kickoff Playoffs', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','MISA','Bind'],['Ban 2','Beşiktaş Esports','Haven'],['Pick 1','MISA','Abyss'],['Pick 2','Beşiktaş Esports','Split'],['Ban 3','MISA','Corrode'],['Ban 4','Beşiktaş Esports','Breeze'],['Decider','-','Pearl']] },
  { date: '2026-03-08', opponent: 'S2G Esports', tournament: 'VCL Türkiye Kickoff Playoffs', score: '3-1', format: 'Bo5 (Advantage)', vetoes: [['Ban 1','MISA','Bind'],['Ban 2','MISA','Corrode'],['Pick 1','MISA','Split'],['Pick 2','S2G Esports','Pearl'],['Pick 3','MISA','Haven'],['Pick 4','S2G Esports','Breeze'],['Decider','-','Abyss']] },
  { date: '2026-03-19', opponent: 'Eintracht Frankfurt', tournament: 'VCL EMEA Stage 1 Group A', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Eintracht Frankfurt','Corrode'],['Ban 2','MISA','Bind'],['Pick 1','Eintracht Frankfurt','Split'],['Pick 2','MISA','Haven'],['Ban 3','Eintracht Frankfurt','Breeze'],['Ban 4','MISA','Pearl'],['Decider','-','Abyss']] },
  { date: '2026-03-20', opponent: 'Team Liquid Academy', tournament: 'VCL EMEA Stage 1 Group A', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','MISA','Corrode'],['Ban 2','Team Liquid Academy','Abyss'],['Pick 1','MISA','Split'],['Pick 2','Team Liquid Academy','Pearl'],['Ban 3','MISA','Bind'],['Ban 4','Team Liquid Academy','Haven'],['Decider','-','Breeze']] },
  { date: '2026-03-26', opponent: 'Enterprise Esports', tournament: 'VCL EMEA Stage 1 Playoffs', score: '1-2', format: 'Bo3', vetoes: [['Ban 1','EP','Breeze'],['Ban 2','MISA','Corrode'],['Pick 1','EP','Abyss'],['Pick 2','MISA','Haven'],['Ban 3','EP','Pearl'],['Ban 4','MISA','Bind'],['Decider','-','Split']] },
]

const EP_MATCHES: VetoMatch[] = [
  { date: '2026-02-07', opponent: 'Boars Gaming', tournament: 'VCL N//E Stage 1', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Boars Gaming','Haven'],['Ban 2','EP','Breeze'],['Pick 1','Boars Gaming','Split'],['Pick 2','EP','Corrode'],['Ban 3','Boars Gaming','Pearl'],['Ban 4','EP','Abyss'],['Decider','-','Bind']] },
  { date: '2026-02-08', opponent: 'Coalesce', tournament: 'VCL N//E Stage 1', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','Coalesce','Pearl'],['Ban 2','EP','Breeze'],['Pick 1','Coalesce','Bind'],['Pick 2','EP','Haven'],['Ban 3','Coalesce','Abyss'],['Ban 4','EP','Corrode'],['Decider','-','Split']] },
  { date: '2026-02-11', opponent: 'Pixel Lumina', tournament: 'VCL N//E Stage 1', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','Pixel Lumina','Abyss'],['Ban 2','EP','Breeze'],['Pick 1','Pixel Lumina','Bind'],['Pick 2','EP','Pearl'],['Ban 3','Pixel Lumina','Corrode'],['Ban 4','EP','Split'],['Decider','-','Haven']] },
  { date: '2026-02-12', opponent: 'EVOPLAY', tournament: 'VCL N//E Stage 1', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','EVOPLAY','Abyss'],['Ban 2','EP','Breeze'],['Pick 1','EVOPLAY','Split'],['Pick 2','EP','Corrode'],['Ban 3','EVOPLAY','Haven'],['Ban 4','EP','Bind'],['Decider','-','Pearl']] },
  { date: '2026-02-14', opponent: 'FULL BOX 200', tournament: 'VCL N//E Stage 1', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','FULL BOX 200','Haven'],['Ban 2','EP','Breeze'],['Pick 1','FULL BOX 200','Abyss'],['Pick 2','EP','Pearl'],['Ban 3','FULL BOX 200','Corrode'],['Ban 4','EP','Bind'],['Decider','-','Split']] },
  { date: '2026-02-15', opponent: 'Twisted Saints Esports', tournament: 'VCL N//E Stage 1', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','Twisted Saints Esports','Corrode'],['Ban 2','EP','Breeze'],['Pick 1','Twisted Saints Esports','Haven'],['Pick 2','EP','Abyss'],['Ban 3','Twisted Saints Esports','Split'],['Ban 4','EP','Pearl'],['Decider','-','Bind']] },
  { date: '2026-02-18', opponent: 'VR2', tournament: 'VCL N//E Stage 1', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','VR2','Abyss'],['Ban 2','EP','Breeze'],['Pick 1','VR2','Bind'],['Pick 2','EP','Corrode'],['Ban 3','VR2','Split'],['Ban 4','EP','Haven'],['Decider','-','Pearl']] },
  { date: '2026-02-19', opponent: 'Stallions Esports', tournament: 'VCT EMEA Clash', score: '1-2', format: 'Bo3', vetoes: [['Ban 1','EP','Breeze'],['Ban 2','Stallions Esports','Haven'],['Pick 1','EP','Corrode'],['Pick 2','Stallions Esports','Split'],['Ban 3','EP','Abyss'],['Ban 4','Stallions Esports','Pearl'],['Decider','-','Bind']] },
  { date: '2026-02-21', opponent: 'Karmine Corp', tournament: 'VCT EMEA Clash', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Karmine Corp','Corrode'],['Ban 2','EP','Breeze'],['Pick 1','Karmine Corp','Bind'],['Pick 2','EP','Pearl'],['Ban 3','Karmine Corp','Split'],['Ban 4','EP','Abyss'],['Decider','-','Haven']] },
  { date: '2026-02-22', opponent: 'Joblife', tournament: 'VCT EMEA Clash', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','EP','Breeze'],['Ban 2','Joblife','Bind'],['Pick 1','EP','Pearl'],['Pick 2','Joblife','Haven'],['Ban 3','EP','Abyss'],['Ban 4','Joblife','Split'],['Decider','-','Corrode']] },
  { date: '2026-02-24', opponent: 'GIANTX', tournament: 'VCT EMEA Clash', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','EP','Breeze'],['Ban 2','GIANTX','Corrode'],['Pick 1','EP','Haven'],['Pick 2','GIANTX','Split'],['Ban 3','EP','Abyss'],['Ban 4','GIANTX','Bind'],['Decider','-','Pearl']] },
  { date: '2026-02-25', opponent: 'FUT Esports', tournament: 'VCT EMEA Clash', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','EP','Breeze'],['Ban 2','FUT Esports','Abyss'],['Pick 1','EP','Split'],['Pick 2','FUT Esports','Bind'],['Ban 3','EP','Haven'],['Ban 4','FUT Esports','Corrode'],['Decider','-','Pearl']] },
  { date: '2026-03-01', opponent: 'BONK', tournament: 'VCL N//E Stage 1 Playoffs', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','BONK','Corrode'],['Ban 2','EP','Breeze'],['Pick 1','BONK','Bind'],['Pick 2','EP','Pearl'],['Ban 3','BONK','Split'],['Ban 4','EP','Abyss'],['Decider','-','Haven']] },
  { date: '2026-03-02', opponent: 'VR2', tournament: 'VCL N//E Stage 1 Playoffs', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','EP','Breeze'],['Ban 2','VR2','Abyss'],['Pick 1','EP','Split'],['Pick 2','VR2','Bind'],['Ban 3','EP','Haven'],['Ban 4','VR2','Pearl'],['Decider','-','Corrode']] },
  { date: '2026-03-06', opponent: 'Team Liquid Academy', tournament: 'VCL N//E Stage 1 Playoffs', score: '0-2', format: 'Bo3', vetoes: [['Ban 1','EP','Breeze'],['Ban 2','Team Liquid Academy','Abyss'],['Pick 1','EP','Bind'],['Pick 2','Team Liquid Academy','Corrode'],['Ban 3','EP','Haven'],['Ban 4','Team Liquid Academy','Split'],['Decider','-','Pearl']] },
  { date: '2026-03-07', opponent: 'Pixel Lumina', tournament: 'VCL N//E Stage 1 Playoffs', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Pixel Lumina','Abyss'],['Ban 2','EP','Breeze'],['Pick 1','Pixel Lumina','Split'],['Pick 2','EP','Pearl'],['Ban 3','Pixel Lumina','Haven'],['Ban 4','EP','Bind'],['Decider','-','Corrode']] },
  { date: '2026-03-08', opponent: 'Team Liquid Academy', tournament: 'VCL N//E Stage 1 Playoffs', score: '3-0', format: 'Bo5 (Advantage)', vetoes: [['Ban 1','Team Liquid Academy','Abyss'],['Ban 2','Team Liquid Academy','Bind'],['Pick 1','EP','Split'],['Pick 2','Team Liquid Academy','Corrode'],['Pick 3','EP','Haven'],['Pick 4','Team Liquid Academy','Pearl'],['Decider','-','Breeze']] },
  { date: '2026-03-19', opponent: 'Barça eSports', tournament: 'VCL EMEA Stage 1 Group B', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','EP','Breeze'],['Ban 2','Barça eSports','Corrode'],['Pick 1','EP','Pearl'],['Pick 2','Barça eSports','Bind'],['Ban 3','EP','Haven'],['Ban 4','Barça eSports','Abyss'],['Decider','-','Split']] },
  { date: '2026-03-20', opponent: 'FOKUS', tournament: 'VCL EMEA Stage 1 Group B', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','FOKUS','Haven'],['Ban 2','EP','Breeze'],['Pick 1','FOKUS','Bind'],['Pick 2','EP','Pearl'],['Ban 3','FOKUS','Corrode'],['Ban 4','EP','Abyss'],['Decider','-','Split']] },
  { date: '2026-03-26', opponent: 'Misa Esports', tournament: 'VCL EMEA Stage 1 Playoffs', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','EP','Breeze'],['Ban 2','MISA','Corrode'],['Pick 1','EP','Abyss'],['Pick 2','MISA','Haven'],['Ban 3','EP','Pearl'],['Ban 4','MISA','Bind'],['Decider','-','Split']] },
]

const UCAM_MATCHES: VetoMatch[] = [
  { date: '2026-02-19', opponent: 'FOKUS', tournament: 'VCT EMEA Clash', score: '1-2', format: 'Bo3', vetoes: [['Ban 1','FOKUS','Pearl'],['Ban 2','UCAM','Breeze'],['Pick 1','FOKUS','Bind'],['Pick 2','UCAM','Haven'],['Ban 3','FOKUS','Corrode'],['Ban 4','UCAM','Split'],['Decider','-','Abyss']] },
  { date: '2026-02-21', opponent: 'Natus Vincere', tournament: 'VCT EMEA Clash', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','UCAM','Breeze'],['Ban 2','Natus Vincere','Corrode'],['Pick 1','UCAM','Pearl'],['Pick 2','Natus Vincere','Bind'],['Ban 3','UCAM','Split'],['Ban 4','Natus Vincere','Abyss'],['Decider','-','Haven']] },
  { date: '2026-02-22', opponent: 'Beşiktaş Esports', tournament: 'VCT EMEA Clash', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','UCAM','Breeze'],['Ban 2','Beşiktaş Esports','Haven'],['Pick 1','UCAM','Corrode'],['Pick 2','Beşiktaş Esports','Split'],['Ban 3','UCAM','Abyss'],['Ban 4','Beşiktaş Esports','Pearl'],['Decider','-','Bind']] },
  { date: '2026-02-24', opponent: 'ULF Esports', tournament: 'VCT EMEA Clash', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','UCAM','Breeze'],['Ban 2','ULF Esports','Corrode'],['Pick 1','UCAM','Bind'],['Pick 2','ULF Esports','Split'],['Ban 3','UCAM','Abyss'],['Ban 4','ULF Esports','Pearl'],['Decider','-','Haven']] },
  { date: '2026-02-25', opponent: 'Team Vitality', tournament: 'VCT EMEA Clash', score: '0-2', format: 'Bo3', vetoes: [['Ban 1','UCAM','Breeze'],['Ban 2','Team Vitality','Pearl'],['Pick 1','UCAM','Haven'],['Pick 2','Team Vitality','Corrode'],['Ban 3','UCAM','Split'],['Ban 4','Team Vitality','Abyss'],['Decider','-','Bind']] },
  { date: '2026-02-28', opponent: 'KPI Gaming', tournament: 'VCL Spain Stage 2', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','KPI Gaming','Pearl'],['Ban 2','UCAM','Breeze'],['Pick 1','KPI Gaming','Bind'],['Pick 2','UCAM','Haven'],['Ban 3','KPI Gaming','Split'],['Ban 4','UCAM','Abyss'],['Decider','-','Corrode']] },
  { date: '2026-03-01', opponent: 'DNSTY', tournament: 'VCL Spain Stage 2', score: '1-2', format: 'Bo3', vetoes: [['Ban 1','UCAM','Breeze'],['Ban 2','DNSTY','Pearl'],['Pick 1','UCAM','Bind'],['Pick 2','DNSTY','Haven'],['Ban 3','UCAM','Abyss'],['Ban 4','DNSTY','Corrode'],['Decider','-','Split']] },
  { date: '2026-03-02', opponent: 'KPI Gaming', tournament: 'VCL Spain Stage 2', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','KPI Gaming','Pearl'],['Ban 2','UCAM','Breeze'],['Pick 1','KPI Gaming','Bind'],['Pick 2','UCAM','Corrode'],['Ban 3','KPI Gaming','Split'],['Ban 4','UCAM','Abyss'],['Decider','-','Haven']] },
  { date: '2026-03-07', opponent: 'Barça eSports', tournament: 'VCL Spain Stage 2 Playoffs', score: '0-2', format: 'Bo3', vetoes: [['Ban 1','UCAM','Breeze'],['Ban 2','Barça eSports','Abyss'],['Pick 1','UCAM','Corrode'],['Pick 2','Barça eSports','Bind'],['Ban 3','UCAM','Split'],['Ban 4','Barça eSports','Pearl'],['Decider','-','Haven']] },
  { date: '2026-03-19', opponent: 'Pixel Lumina', tournament: 'VCL EMEA Stage 1 Group C', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Pixel Lumina','Abyss'],['Ban 2','UCAM','Breeze'],['Pick 1','Pixel Lumina','Split'],['Pick 2','UCAM','Corrode'],['Ban 3','Pixel Lumina','Haven'],['Ban 4','UCAM','Bind'],['Decider','-','Pearl']] },
  { date: '2026-03-22', opponent: 'Joblife', tournament: 'VCL EMEA Stage 1 Group C', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Joblife','Corrode'],['Ban 2','UCAM','Breeze'],['Pick 1','Joblife','Abyss'],['Pick 2','UCAM','Haven'],['Ban 3','Joblife','Split'],['Ban 4','UCAM','Bind'],['Decider','-','Pearl']] },
  { date: '2026-03-26', opponent: 'Mandatory', tournament: 'VCL EMEA Stage 1 Playoffs', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','MDR','Abyss'],['Ban 2','UCAM','Breeze'],['Pick 1','MDR','Corrode'],['Pick 2','UCAM','Bind'],['Ban 3','MDR','Split'],['Ban 4','UCAM','Haven'],['Decider','-','Pearl']] },
]

const MDR_MATCHES: VetoMatch[] = [
  { date: '2026-01-10', opponent: 'Esprit Shōnen', tournament: 'VCL France Stage 1 Week 1', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','MDR','Bind'],['Ban 2','Esprit Shōnen','Pearl'],['Pick 1','MDR','Corrode'],['Pick 2','Esprit Shōnen','Haven'],['Ban 3','MDR','Split'],['Ban 4','Esprit Shōnen','Breeze'],['Decider','-','Abyss']] },
  { date: '2026-01-11', opponent: 'Galions', tournament: 'VCL France Stage 1 Week 1', score: '2-1', format: 'Bo3', vetoes: [['Ban 1','Galions','Pearl'],['Ban 2','MDR','Bind'],['Pick 1','Galions','Split'],['Pick 2','MDR','Breeze'],['Ban 3','Galions','Corrode'],['Ban 4','MDR','Abyss'],['Decider','-','Haven']] },
  { date: '2026-01-16', opponent: 'Joblife', tournament: 'VCL France Stage 1 Week 2', score: '0-2', format: 'Bo3', vetoes: [['Ban 1','MDR','Breeze'],['Ban 2','Joblife','Bind'],['Pick 1','MDR','Pearl'],['Pick 2','Joblife','Corrode'],['Ban 3','MDR','Abyss'],['Ban 4','Joblife','Haven'],['Decider','-','Split']] },
  { date: '2026-01-18', opponent: 'F9 EICAR', tournament: 'VCL France Stage 1 Week 2', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','MDR','Bind'],['Ban 2','F9 EICAR','Abyss'],['Pick 1','MDR','Split'],['Pick 2','F9 EICAR','Corrode'],['Ban 3','MDR','Breeze'],['Ban 4','F9 EICAR','Pearl'],['Decider','-','Haven']] },
  { date: '2026-01-24', opponent: 'Erah Esport', tournament: 'VCL France Stage 1 Week 3', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Erah Esport','Breeze'],['Ban 2','MDR','Bind'],['Pick 1','Erah Esport','Corrode'],['Pick 2','MDR','Haven'],['Ban 3','Erah Esport','Split'],['Ban 4','MDR','Abyss'],['Decider','-','Pearl']] },
  { date: '2026-01-25', opponent: 'Caldya Esport', tournament: 'VCL France Stage 1 Week 3', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','MDR','Bind'],['Ban 2','Caldya Esport','Corrode'],['Pick 1','MDR','Haven'],['Pick 2','Caldya Esport','Breeze'],['Ban 3','MDR','Abyss'],['Ban 4','Caldya Esport','Split'],['Decider','-','Pearl']] },
  { date: '2026-02-01', opponent: 'WIP Esports', tournament: 'VCL France Stage 1 Week 4', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','MDR','Abyss'],['Ban 2','WIP Esports','Bind'],['Pick 1','MDR','Corrode'],['Pick 2','WIP Esports','Haven'],['Ban 3','MDR','Split'],['Ban 4','WIP Esports','Breeze'],['Decider','-','Pearl']] },
  { date: '2026-02-07', opponent: 'Galions', tournament: 'VCL France Stage 1 Playoffs', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','Galions','Pearl'],['Ban 2','MDR','Bind'],['Pick 1','Galions','Breeze'],['Pick 2','MDR','Haven'],['Ban 3','Galions','Split'],['Ban 4','MDR','Corrode'],['Decider','-','Abyss']] },
  { date: '2026-02-08', opponent: 'Joblife', tournament: 'VCL France Stage 1 Playoffs', score: '1-2', format: 'Bo3', vetoes: [['Ban 1','Joblife','Breeze'],['Ban 2','MDR','Pearl'],['Pick 1','Joblife','Abyss'],['Pick 2','MDR','Haven'],['Ban 3','Joblife','Corrode'],['Ban 4','MDR','Bind'],['Decider','-','Split']] },
  { date: '2026-02-09', opponent: 'WIP Esports', tournament: 'VCL France Stage 1 Playoffs', score: '3-1', format: 'Bo5', vetoes: [['Ban 1','MDR','Bind'],['Ban 2','WIP Esports','Abyss'],['Pick 1','MDR','Haven'],['Pick 2','WIP Esports','Pearl'],['Pick 3','MDR','Breeze'],['Pick 4','WIP Esports','Corrode'],['Decider','-','Split']] },
  { date: '2026-02-11', opponent: 'Joblife', tournament: 'VCL France Stage 1 Playoffs', score: '2-3', format: 'Bo5 (Advantage)', vetoes: [['Ban 1','Joblife','Breeze'],['Ban 2','Joblife','Haven'],['Pick 1','Joblife','Abyss'],['Pick 2','MDR','Corrode'],['Pick 3','Joblife','Bind'],['Pick 4','MDR','Pearl'],['Decider','-','Split']] },
  { date: '2026-03-19', opponent: 'MIR', tournament: 'VCL EMEA Stage 1 Group D', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','MDR','Bind'],['Ban 2','MIR','Corrode'],['Pick 1','MDR','Haven'],['Pick 2','MIR','Abyss'],['Ban 3','MDR','Split'],['Ban 4','MIR','Breeze'],['Decider','-','Pearl']] },
  { date: '2026-03-21', opponent: 'GnG Amazigh', tournament: 'VCL EMEA Stage 1 Group D', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','MDR','Bind'],['Ban 2','GnG Amazigh','Breeze'],['Pick 1','MDR','Haven'],['Pick 2','GnG Amazigh','Corrode'],['Ban 3','MDR','Pearl'],['Ban 4','GnG Amazigh','Abyss'],['Decider','-','Split']] },
  { date: '2026-03-22', opponent: 'S2G Esports', tournament: 'VCL EMEA Stage 1 Group D', score: '2-0', format: 'Bo3', vetoes: [['Ban 1','S2G Esports','Haven'],['Ban 2','MDR','Split'],['Pick 1','S2G Esports','Breeze'],['Pick 2','MDR','Pearl'],['Ban 3','S2G Esports','Abyss'],['Ban 4','MDR','Bind'],['Decider','-','Corrode']] },
  { date: '2026-03-26', opponent: 'UCAM Esports', tournament: 'VCL EMEA Stage 1 Playoffs', score: '1-2', format: 'Bo3', vetoes: [['Ban 1','MDR','Abyss'],['Ban 2','UCAM','Breeze'],['Pick 1','MDR','Corrode'],['Pick 2','UCAM','Bind'],['Ban 3','MDR','Split'],['Ban 4','UCAM','Haven'],['Decider','-','Pearl']] },
]

/** Map team tag to their veto match list */
const VETO_DATA: Record<string, VetoMatch[]> = {
  MISA: MISA_MATCHES,
  EP: EP_MATCHES,
  UCAM: UCAM_MATCHES,
  MDR: MDR_MATCHES,
}

/** Team tags used in veto data (may differ from opponent full names) */
const TEAM_TAGS_IN_VETOES = ['MISA', 'EP', 'UCAM', 'MDR']

/**
 * Compute the most common first ban and first pick for a team.
 * Returns { firstBan: mapName | null, firstPick: mapName | null }
 */
export function getFirstBanPick(teamTag: string): { firstBan: string | null; firstPick: string | null } {
  const matches = VETO_DATA[teamTag]
  if (!matches) return { firstBan: null, firstPick: null }

  const firstBans: Record<string, number> = {}
  const firstPicks: Record<string, number> = {}

  for (const m of matches) {
    // Find the team's first ban
    for (const [action, team, map] of m.vetoes) {
      if (action.startsWith('Ban') && TEAM_TAGS_IN_VETOES.includes(team) && team === teamTag) {
        firstBans[map] = (firstBans[map] || 0) + 1
        break
      }
    }
    // Find the team's first pick
    for (const [action, team, map] of m.vetoes) {
      if (action.startsWith('Pick') && TEAM_TAGS_IN_VETOES.includes(team) && team === teamTag) {
        firstPicks[map] = (firstPicks[map] || 0) + 1
        break
      }
    }
  }

  const topBan = Object.entries(firstBans).sort((a, b) => b[1] - a[1])[0]
  const topPick = Object.entries(firstPicks).sort((a, b) => b[1] - a[1])[0]

  return {
    firstBan: topBan ? topBan[0] : null,
    firstPick: topPick ? topPick[0] : null,
  }
}

export { VETO_DATA }
export type { VetoMatch }
