export interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
  mask: string
}

export const countries: Country[] = [
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '\u{1F1F7}\u{1F1FA}', mask: '(###) ###-##-##' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '\u{1F1FA}\u{1F1F8}', mask: '(###) ###-####' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '\u{1F1EC}\u{1F1E7}', mask: '#### ######' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '\u{1F1E9}\u{1F1EA}', mask: '#### #######' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '\u{1F1EB}\u{1F1F7}', mask: '# ## ## ## ##' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '\u{1F1EE}\u{1F1F9}', mask: '### ### ####' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '\u{1F1EA}\u{1F1F8}', mask: '### ### ###' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '\u{1F1FA}\u{1F1E6}', mask: '(##) ###-##-##' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '\u{1F1F5}\u{1F1F1}', mask: '### ### ###' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '\u{1F1E7}\u{1F1F7}', mask: '(##) #####-####' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '\u{1F1EE}\u{1F1F3}', mask: '##### #####' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '\u{1F1E8}\u{1F1F3}', mask: '### #### ####' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '\u{1F1EF}\u{1F1F5}', mask: '##-####-####' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '\u{1F1F0}\u{1F1F7}', mask: '##-####-####' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '\u{1F1F9}\u{1F1F7}', mask: '(###) ###-####' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '\u{1F1E8}\u{1F1E6}', mask: '(###) ###-####' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '\u{1F1E6}\u{1F1FA}', mask: '#### ### ###' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '\u{1F1F2}\u{1F1FD}', mask: '## #### ####' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '\u{1F1E6}\u{1F1F7}', mask: '## ####-####' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '\u{1F1F8}\u{1F1E6}', mask: '## ### ####' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '\u{1F1E6}\u{1F1EA}', mask: '## ### ####' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '\u{1F1EE}\u{1F1F1}', mask: '##-###-####' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '\u{1F1F9}\u{1F1ED}', mask: '## ### ####' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '\u{1F1EE}\u{1F1E9}', mask: '###-####-####' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '\u{1F1F0}\u{1F1FF}', mask: '(###) ###-##-##' },
  { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '\u{1F1E7}\u{1F1FE}', mask: '(##) ###-##-##' },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '\u{1F1EC}\u{1F1EA}', mask: '### ## ## ##' },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '\u{1F1FA}\u{1F1FF}', mask: '## ### ## ##' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '\u{1F1F5}\u{1F1F9}', mask: '### ### ###' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '\u{1F1F3}\u{1F1F1}', mask: '# ########' },
]

export function applyMask(digits: string, mask: string): string {
  let result = ''
  let digitIdx = 0
  for (let i = 0; i < mask.length && digitIdx < digits.length; i++) {
    if (mask[i] === '#') {
      result += digits[digitIdx++]
    } else {
      result += mask[i]
    }
  }
  return result
}

export function extractDigits(text: string): string {
  return text.replace(/\D/g, '')
}
