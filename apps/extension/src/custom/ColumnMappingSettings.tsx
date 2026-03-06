import { useState, useEffect } from 'react'
import { useSheetColumns } from './hooks/useSheetColumns'
import { columnIndexToLetter, getSheetList, type ColumnMapping } from './services/sheets'
import { SettingSkeleton } from './shared/Skeleton'

const COLUMN_FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: 'phone', label: 'Телефоны' },
  { key: 'name', label: 'Имя контакта' },
  { key: 'status', label: 'Результат звонка' },
  { key: 'date', label: 'Дата звонка' },
  { key: 'duration', label: 'Длительность' },
  { key: 'note', label: 'Заметка' },
  { key: 'recording', label: 'Ссылка на запись' },
]

export default function ColumnMappingSettings() {
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)
  const [sheetName, setSheetName] = useState<string | null>(null)
  const [sheetList, setSheetList] = useState<string[]>([])
  const [sheetsLoading, setSheetsLoading] = useState(false)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_SHEET' }, (res) => {
      if (chrome.runtime.lastError) return
      if (res?.spreadsheetId) setSpreadsheetId(res.spreadsheetId)
    })
  }, [])

  useEffect(() => {
    if (!spreadsheetId) return
    setSheetsLoading(true)
    getSheetList(spreadsheetId).then(setSheetList).catch(() => setSheetList([])).finally(() => setSheetsLoading(false))
  }, [spreadsheetId])

  const { headers, columns, updateColumn } = useSheetColumns({ spreadsheetId, sheetName: sheetName || undefined })
  const columnOptions = headers.map((header, i) => ({ letter: columnIndexToLetter(i), label: `${columnIndexToLetter(i)} — ${header}` }))

  return (
    <>
      {/* Sheet selector */}
      {spreadsheetId && (
        <div className="bg-bg-secondary rounded-xl p-3">
          <div className="text-[10px] text-text-muted mb-2.5 uppercase tracking-wider">Лист таблицы</div>
          {sheetsLoading ? <SettingSkeleton /> : sheetList.length > 0 ? (
            <select value={sheetName || ''} onChange={(e) => setSheetName(e.target.value)}
              className="w-full bg-bg-primary border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-primary outline-none cursor-pointer focus:border-brand">
              {!sheetName && <option value="">Выберите лист</option>}
              {sheetList.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          ) : <div className="text-[11px] text-text-muted">Откройте Google Таблицу для выбора листа</div>}
        </div>
      )}

      {/* Column mapping */}
      <div className="bg-bg-secondary rounded-xl p-3">
        <div className="text-[10px] text-text-muted mb-2.5 uppercase tracking-wider">Колонки таблицы</div>
        <div className="text-[10px] text-text-muted mb-3">
          Укажите букву столбца (A, B, C...){columnOptions.length > 0 && ' или выберите из списка'}
        </div>
        {COLUMN_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex justify-between items-center mb-2 last:mb-0">
            <span className="text-xs text-text-secondary">{label}</span>
            <div className="flex items-center gap-1.5">
              <input type="text" placeholder="—" value={columns[key] || ''} maxLength={2}
                onChange={(e) => updateColumn(key, e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                className="w-10 bg-bg-primary border border-bg-tertiary rounded-md py-1 px-1.5 text-[11px] text-brand-light font-mono outline-none focus:border-brand text-center" />
              {columnOptions.length > 0 && (
                <select value={columns[key] || ''} onChange={(e) => updateColumn(key, e.target.value)}
                  className="bg-bg-primary border border-bg-tertiary rounded-md py-1 px-1 text-[11px] text-text-muted outline-none cursor-pointer">
                  <option value="">▾</option>
                  {columnOptions.map((opt) => <option key={opt.letter} value={opt.letter}>{opt.label}</option>)}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}