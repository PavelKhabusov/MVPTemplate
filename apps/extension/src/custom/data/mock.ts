import type { Contact } from '../types'

export const mockContacts: Contact[] = [
  { id: 1, name: 'Алексей Петров', phone: '+7 916 234-56-78', company: 'ООО Ромашка', lastCall: '2 дня назад', status: 'answered' },
  { id: 2, name: 'Марина Соколова', phone: '+7 903 111-22-33', company: 'ИП Соколова', lastCall: 'вчера', status: 'missed' },
  { id: 3, name: 'Дмитрий Ким', phone: '+7 926 555-44-11', company: 'Стройгрупп', lastCall: '5 дней назад', status: 'answered' },
  { id: 4, name: 'Ольга Белова', phone: '+7 999 888-77-66', company: 'МедТех', lastCall: 'сегодня', status: 'answered' },
]

export const statusColors = {
  answered: { bg: '#e6f9f0', text: '#1a7a4a', dot: '#22c55e' },
  missed: { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
}