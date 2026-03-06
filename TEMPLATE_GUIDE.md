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

## 2. Брендинг — APP_BRAND (единая точка)

**Шаг 1 — изменить `packages/template-config/src/brand.ts`:**

```ts
export const APP_BRAND = {
  name: 'CallSheet',           // отображаемое название
  slug: 'callsheet',          // URL-safe идентификатор
  tagline: 'Call from Google Sheets',
  copyright: 'CallSheet',
  ctaUrl: 'https://chromewebstore.google.com',
}
```

`APP_BRAND` импортируется в runtime-файлы (`APP_CONFIG`, компоненты, i18n-fallbacks).

**Шаг 2 — статические файлы (не могут импортировать пакеты, менять вручную):**

Все помечены комментарием `// BRAND: change when forking`:

| Файл | Что менять |
|------|-----------|
| `apps/mobile/app.config.ts` | `name`, `slug`, `scheme`, `bundleIdentifier`, `package` |
| `apps/extension/src/manifest.ts` | `name`, `description`, `default_title` |
| `apps/extension/src/sidebar/index.html` | `<title>` |
| `apps/extension/src/popup/index.html` | `<title>` |
| `apps/mobile/app/+html.tsx` | `<title>`, og:title, og:description |
| `apps/backend/src/database/schema/company-info.ts` | `.default('...')` |
| `apps/backend/src/modules/config/config.routes.ts` | `appName: '...'` |
| `apps/backend/src/app.ts` | Swagger title/description |
| `app.json` | android.package, ios.bundleIdentifier |
| `apps/backend/.env` | `POSTGRES_DB`, `POSTGRES_USER`, `DATABASE_URL` |
| `package.json` (корень) | `name` |

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
| `landing.showcase*` | Шаги "Как это работает" |
| `landing.ctaTitle` | Финальный CTA |

Файлы: `packages/i18n/src/locales/{en,ru,es,ja}.json`

**Важно:** блок `LandingTerminal` (терминал с технологиями) — шаблонный, убрать из `LandingPage.tsx` при форке, если не нужен. Найти в `packages/ui/src/landing/LandingPage.tsx` и удалить импорт + JSX.

Вторичная CTA в Hero по умолчанию ведёт на GitHub. Обновить в `LandingHero.tsx` — `onSecondaryPress` URL.

## 8. Иконки

**Extension:** заменить `apps/extension/icons/icon-16.png`, `icon-48.png`, `icon-128.png`.

**Mobile:** заменить `apps/mobile/assets/images/icon.png`, `splash-icon.png`, `adaptive-icon.png`.

Не забыть обновить ссылки в `apps/mobile/app.config.ts` если меняется структура папок.

## 9. Цветовая тема

Выбрать схему в `apps/backend/.env`:
```
EXPO_PUBLIC_COLOR_SCHEME=indigo   # indigo | violet | blue | green | slate | ...
```

Доступные схемы: `packages/template-config/src/colorSchemes.ts`.

## 10. Home и Explore вкладки

`apps/mobile/app/(tabs)/index.tsx` — Home (дашборд).
`apps/mobile/app/(tabs)/explore.tsx` — Explore/Analytics.

**Оба файла нужно кастомизировать под продукт.** Шаблонные версии показывают:
- Home: "Active Projects / Completed Tasks / Team Members" (не имеют смысла для большинства продуктов)
- Explore: категории Design/Dev/Marketing, featured items — шаблонный контент

**Как обновить:**
1. Изменить i18n ключи `home.*` и `explore.*` в 4 locale-файлах
2. Переписать компоненты в соответствии с продуктом
3. Если вкладка полностью не нужна — переименовать (например, `explore` → `history`)

Название вкладки: `apps/mobile/app/(tabs)/_layout.tsx` — массив `TABS`.

## 11. Документация

Система `@mvp/docs` — структурированные группы и страницы.

**Структура:**
1. Редактировать `packages/docs/src/docData.ts` — группы + страницы (массив `DOC_GROUPS`)
2. Контент через i18n ключи: `docs.content<PageId>` (markdown-строка)
3. Добавить переводы в 4 locale-файла

**Важно:** шаблонные docs содержат документацию MVPTemplate. При форке обязательно заменить на документацию продукта. Как минимум — группа "Getting Started" с Install + Setup + FAQ.

## 12. Платежи

1. `PAYMENTS_ENABLED=true` в `.env`
2. Настроить нужные провайдеры: `STRIPE_ENABLED=true`, `YOOKASSA_ENABLED=true`, etc.
3. Сид планов: `npm run db:seed -w apps/backend`
4. Провайдеры: Stripe, YooKassa, Robokassa, PayPal, Polar

## 13. Bundle size

Выключенные фичи должны не влиять на размер:

- **Backend**: маршруты регистрируются условно через env — ок
- **Frontend**: использовать `React.lazy()` для опциональных пакетов
- **Extension**: `lazy(() => import('./custom/...'))` — Vite tree-shakes

## 14. Чеклист при форке

Полный список действий при создании нового продукта:

- [ ] `packages/template-config/src/brand.ts` — APP_BRAND
- [ ] `apps/mobile/app.config.ts` — name, slug, scheme, bundleIdentifier, package
- [ ] `apps/extension/src/manifest.ts` — name, description, default_title
- [ ] `apps/extension/src/sidebar/index.html` — `<title>`
- [ ] `apps/extension/src/popup/index.html` — `<title>`
- [ ] `apps/mobile/app/+html.tsx` — title, og:title, og:description
- [ ] `apps/backend/src/database/schema/company-info.ts` — default name
- [ ] `apps/backend/src/modules/config/config.routes.ts` — appName
- [ ] `apps/backend/src/app.ts` — Swagger title/description
- [ ] `app.json` — android.package, ios.bundleIdentifier
- [ ] `apps/backend/.env` — POSTGRES_DB, POSTGRES_USER, DATABASE_URL
- [ ] `package.json` — name
- [ ] `apps/backend/.env` — EXPO_PUBLIC_COLOR_SCHEME (цветовая тема)
- [ ] `apps/extension/icons/` — icon-16.png, icon-48.png, icon-128.png
- [ ] `apps/mobile/assets/images/` — icon.png, splash-icon.png, adaptive-icon.png
- [ ] `apps/extension/src/config.ts` — extensionConfig (вкладки, permissions)
- [ ] i18n `landing.*` — контент лендинга (4 файла)
- [ ] i18n `home.*`, `explore.*` — контент мобильного дашборда (4 файла)
- [ ] `apps/mobile/app/(tabs)/index.tsx` — Home tab под продукт
- [ ] `apps/mobile/app/(tabs)/explore.tsx` — Explore tab под продукт
- [ ] `packages/docs/src/docData.ts` + i18n `docs.*` — документация продукта
- [ ] `apps/backend/src/database/seed.ts` — планы и цены
