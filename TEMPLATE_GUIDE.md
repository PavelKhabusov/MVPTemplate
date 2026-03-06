# MVPTemplate — Гайд по созданию продукта

## 1. Клонирование

```bash
# Сохранить старый проект
mv /path/to/your-project /path/to/your-project-old

# Клонировать шаблон
cp -R /path/to/MVPTemplate /path/to/your-project
cd /path/to/your-project

# Сохранить связь с шаблоном для обновлений
git remote rename origin template
git remote add origin <your-repo-url>
```

## 2. Переименование проекта

| Файл | Что менять |
|------|-----------|
| `package.json` (корень) | `name` |
| `apps/backend/docker/docker-compose.yml` | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| `apps/backend/.env` | `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| `apps/mobile/app.json` | `name`, `slug`, `scheme` |
| `apps/extension/src/manifest.ts` | `name`, `description` |

## 3. Chrome-расширение (config-driven)

Расширение кастомизируется через единственный файл:

### `apps/extension/src/config.ts`

```ts
import { lazy } from 'react'
import { Phone, Clock } from 'lucide-react'
import type { ExtensionConfig } from './config'

export const extensionConfig: ExtensionConfig = {
  // Кастомные вкладки (заменяют Home, добавляются перед Settings)
  tabs: [
    { id: 'call', label: { en: 'Call', ru: 'Звонок' }, icon: Phone,
      component: lazy(() => import('./custom/CallTab')) },
    { id: 'history', label: { en: 'History', ru: 'История' }, icon: Clock,
      component: lazy(() => import('./custom/HistoryTab')) },
  ],

  // Секции в настройках (рендерятся перед Logout)
  settingsSections: [
    lazy(() => import('./custom/MySettings')),
  ],

  // Шаги онбординга (добавляются к базовым 3 шагам)
  onboardingSteps: [
    { icon: '📞', title: { en: 'Feature', ru: 'Фича' }, desc: { en: '...', ru: '...' } },
  ],

  // Content scripts (файл src/content.ts)
  contentScripts: true,

  // Background handlers (дополнительные обработчики сообщений)
  backgroundHandlers: () => import('./custom/backgroundHandlers'),

  // Дополнительные manifest permissions
  permissions: ['identity', 'tabs'],
  hostPermissions: ['*://docs.google.com/*'],
}
```

### Структура файлов продукта

```
apps/extension/src/
├── config.ts          ← единственная точка кастомизации
├── custom/            ← бизнес-логика продукта
│   ├── CallTab.tsx
│   ├── MySettings.tsx
│   ├── backgroundHandlers.ts
│   ├── hooks/
│   └── services/
├── content/           ← content scripts (если contentScripts: true)
│   └── detector.ts
└── content.ts         ← entry point для content scripts
```

### Пустой конфиг (шаблон по умолчанию)

Если `tabs: []` — показывается Home + Settings. Если `tabs` не пустой — кастомные вкладки + Settings (Home скрыт).

## 4. Backend-модули

### Добавление нового модуля

1. Создать директорию `apps/backend/src/modules/<name>/`
2. Файлы:
   - `<name>.routes.ts` — Fastify routes
   - `<name>.service.ts` — бизнес-логика
   - `<name>.repository.ts` — Drizzle-запросы
   - `<name>.schema.ts` — Zod-валидация
3. Drizzle-схема: `apps/backend/src/database/schema/<name>.ts`
4. Экспорт из `schema/index.ts`
5. Регистрация в `apps/backend/src/app.ts`:
```ts
import { myRoutes } from './modules/<name>/<name>.routes'
await app.register(myRoutes, { prefix: '/api/<name>' })
```

## 5. Админка — добавление env-группы

Когда продукт добавляет API-ключи, они должны появляться в API Settings:

### Backend: `apps/backend/src/modules/admin/admin.routes.ts`

```ts
const ENV_GROUPS = {
  // ... существующие группы ...
  myService: {
    keys: ['MY_API_KEY', 'MY_SECRET'],
    types: { MY_API_KEY: 'secret', MY_SECRET: 'secret' }
  },
}
```

### Frontend: `apps/mobile/src/admin/AdminApiSettings.tsx`

```ts
const ENV_GROUP_META = {
  // ... существующие ...
  myService: { icon: 'key-outline', labelKey: 'admin.apiMyService' },
}
```

### i18n: добавить ключ `admin.apiMyService` в 4 locale-файла

Для кастомной UI-карточки (табы, выпадающие списки) — добавить проверку в `renderEnvCard`:
```tsx
if (group === 'myService') return <MyServiceEnvCard ... />
```

## 6. Feature flags

### Включение/выключение

`packages/template-config/src/flags.ts` — массив `TEMPLATE_FLAGS`.
Каждый флаг: `key`, `labelKey`, `icon`, `defaultValue`, `scope`, `envVar`.

### Использование на фронте

```tsx
import { useTemplateFlag } from '@mvp/template-config'
const enabled = useTemplateFlag('myFeature', false)
if (!enabled) return null
```

### Добавление нового флага

1. Добавить в `TEMPLATE_FLAGS` массив
2. Добавить i18n ключ `templateConfig.<key>` в 4 locale-файла
3. Использовать `useTemplateFlag(key)` в компонентах

## 7. Лендинг

Контент лендинга — через i18n ключи. Заменить:

| Ключ | Описание |
|------|----------|
| `landing.heroTitle` | Заголовок герой-секции |
| `landing.heroSubtitle` | Подзаголовок |
| `landing.heroBadge` | Бейдж (напр. "Open Source") |
| `landing.heroCTA` | Текст кнопки CTA |
| `landing.feature*` | Фичи (title + desc) |
| `landing.ctaTitle` | Финальный CTA |

Файлы: `packages/i18n/src/locales/{en,ru,es,ja}.json`

## 8. Документация

Система `@mvp/docs` — структурированные группы и страницы.

1. Редактировать `packages/docs/src/docData.ts` — группы + страницы
2. Контент через i18n ключи: `docs.content<PageId>`
3. Добавить переводы в 4 locale-файла

## 9. Платежи

1. `PAYMENTS_ENABLED=true` в `.env`
2. Настроить нужные провайдеры: `STRIPE_ENABLED=true`, `YOOKASSA_ENABLED=true`, etc.
3. Сид планов: `npm run db:seed -w apps/backend`
4. Провайдеры: Stripe, YooKassa, Robokassa, PayPal, Polar

## 10. Bundle size

Выключенные фичи должны не влиять на размер:

- **Backend**: маршруты регистрируются условно через env — ок
- **Frontend**: использовать `React.lazy()` для опциональных пакетов
- **Extension**: `lazy(() => import('./custom/...'))` — Vite tree-shakes
