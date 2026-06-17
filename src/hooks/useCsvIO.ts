import { useCallback } from 'react'
import Papa from 'papaparse'
import type { Insurance, MortgageParams, ScheduleRow } from '../types'

interface ExportData {
  params: MortgageParams
  insurances: Insurance[]
  schedule: ScheduleRow[]
}

interface ImportResult {
  params: MortgageParams
  insurances: Insurance[]
}

const splitSections = (content: string): Record<string, string> => {
  const sections: Record<string, string[]> = {}
  let current = ''
  for (const line of content.split('\n')) {
    if (line.startsWith('# ')) {
      current = line.slice(2).trim().toUpperCase()
      sections[current] = []
    } else if (current && line.trim()) {
      sections[current].push(line)
    }
  }
  return Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.join('\n')]))
}

export const parseCsvContent = (content: string): ImportResult => {
  const sections = splitSections(content)

  if (!sections['PARAMETERS']) throw new Error('Missing PARAMETERS section')

  const paramsResult = Papa.parse<MortgageParams>(sections['PARAMETERS'], {
    header: true,
    dynamicTyping: true,
  })
  const params = paramsResult.data[0]
  if (!params?.principal) throw new Error('Invalid PARAMETERS data')

  const insurancesRaw = sections['INSURANCES']
    ? Papa.parse<Record<string, string>>(sections['INSURANCES'], {
        header: true,
        dynamicTyping: true,
      }).data
    : []

  const insurances: Insurance[] = insurancesRaw
    .filter(row => row.name)
    .map(row => ({
      id: crypto.randomUUID(),
      name: String(row.name ?? ''),
      amount: Number(row.amount ?? 0),
      isTemporary: String(row.isTemporary) === 'true',
      endDate: row.endDate ? String(row.endDate) : undefined,
    }))

  return { params, insurances }
}

export const useCsvIO = () => {
  const exportCsv = useCallback(({ params, insurances, schedule }: ExportData) => {
    const paramsSection = ['# PARAMETERS', Papa.unparse([params], { header: true })]
    const insSection = [
      '# INSURANCES',
      Papa.unparse(
        insurances.map(({ id: _id, ...rest }) => rest),
        { header: true },
      ),
    ]
    const schedSection = ['# SCHEDULE', Papa.unparse(schedule, { header: true })]

    const content = [...paramsSection, '', ...insSection, '', ...schedSection].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mortgage-${params.startDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const importCsv = useCallback(
    (file: File): Promise<ImportResult> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
          try {
            resolve(parseCsvContent(e.target?.result as string))
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
      }),
    [],
  )

  return { exportCsv, importCsv }
}
