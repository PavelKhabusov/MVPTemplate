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
  name: 'MyApp',               // отображаемое название
  slug: 'myapp',              // URL-safe идентификатор
  tagline: 'Your awesome app',
  copyright: 'MyApp',
  ctaUrl: 'https://example.com',
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
import { Home, Settings } from 'lucide-react'
import type { ExtensionConfig } from './config'

export const extensionConfig: ExtensionConfig = {
  // Кастомные вкладки (заменяют Home, добавляются перед Settings)
  tabs: [
    { id: 'dashboard', label: { en: 'Dashboard', ru: 'Главная' }, icon: Home,
      component: lazy(() => import('./custom/DashboardTab')) },
  ],

  // Секции в настройках (рендерятся перед Logout)
  settingsSections: [
    lazy(() => import('./custom/MySettings')),
  ],

  // Шаги онбординга (добавляются к базовым 3 шагам)
  onboardingSteps: [
    { icon: '🚀', title: { en: 'Feature', ru: 'Фича' }, desc: { en: '...', ru: '...' } },
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
│   ├── DashboardTab.tsx
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
- [ ] `README.md` — описание продукта (не шаблона!)
- [ ] `apps/extension/src/components/MainScreen.tsx` — название приложения в хедере (`span` со строкой)
- [ ] `apps/backend/src/modules/admin/admin.routes.ts` — ENV_GROUPS для API-ключей продукта
- [ ] `apps/mobile/src/admin/AdminApiSettings.tsx` — ENV_GROUP_META для отображения в админке
- [ ] `packages/template-config/src/brand.ts` — APP_BRAND.tagline (отображается на экране логина расширения!)
- [ ] `apps/extension/src/components/MainScreen.tsx` — строка названия в хедере (сейчас хардкод — заменить на APP_BRAND.name)

## 15. Ретроспектива — уроки из первого форка (CallSheet)

### Что работает хорошо

- **Config-driven расширение** — `extensionConfig` в `config.ts` — главный успех архитектуры. Бизнес-логика изолирована в `custom/`, шаблонные компоненты не трогаются
- **APP_BRAND** — единственное место для имени продукта в runtime (избавляет от рассыпанных строк)
- **Bento-features** — анимированная сетка в лендинге хорошо подходит для любого продукта при замене визуализаций
- **Платёжная система** — добавление нового продукта через seed.ts не требует изменения кода

---

### Недочёты шаблона (нужно исправить в MVPTemplate)

#### Захардкоженные строки продукта
| Файл | Проблема | Статус |
|------|----------|--------|
| `apps/extension/src/components/AuthScreen.tsx` | `"MVP Extension"` и `"Your app — right in the browser"` — не читается из APP_BRAND | ✅ Исправлено |
| `apps/extension/src/components/MainScreen.tsx` | Хедер содержит строку вместо `APP_BRAND.name` | ✅ Исправлено |
| `apps/extension/src/manifest.ts` | name/description — только комментарий `// BRAND`, нет автоматической подстановки | — |

**Исправление AuthScreen** (уже в шаблоне):
- `APP_BRAND.name` и `APP_BRAND.tagline` — читаются из `@mvp/template-config/src/brand`
- `APP_BRAND` импортируется **напрямую из `src/brand`**, НЕ из `@mvp/template-config` (index.ts тянет react-native через TemplateConfigSidebar → ломает Vite-бандл расширения)
- Все строки UI через `useTranslation()` из `@mvp/i18n/src/browser` — используется общая i18n система
- Контролы языка и темы в нижней части экрана (доступны до логина), `i18n.changeLanguage()` синхронизируется сразу

#### Расширение не могло использовать @mvp/i18n (expo-localization)
**Проблема**: `@mvp/i18n/src/index.ts` делает `import { getLocales } from 'expo-localization'` на уровне модуля — Expo-специфичный пакет, недоступный в browser extension. Расширение было вынуждено использовать inline `LABELS` объекты вместо общей i18n.

**Решение**: `packages/i18n/src/browser.ts` — browser-совместимый инит без expo-localization:
```ts
// packages/i18n/src/browser.ts
export function initBrowserI18n(savedLanguage?: string | null) { ... }
export { i18n, useTranslation, SUPPORTED_LANGUAGES, LANGUAGE_LABELS }
```
Использует `navigator.language` вместо `getLocales()`. Инициализируется в `main.tsx` расширения:
```ts
import { initBrowserI18n, i18n } from '@mvp/i18n/src/browser'
initBrowserI18n()
chrome.storage?.local?.get('lang').then(r => { if (r?.lang) i18n.changeLanguage(r.lang) })
```

#### Порядок секций в Settings расширения
**Проблема**: тема и язык отображаются ПЕРЕД бизнес-настройками. Для пользователя важнее сначала видеть настройки самого приложения.
**Решение**: `extensionConfig.settingsSections` должны рендериться первыми в `SettingsTab.tsx`.

#### Фиксированная ширина расширения
**Проблема**: `width: 380px` в `globals.css` вызывает горизонтальный скролл в sidebar-режиме, где Chrome сам задаёт ширину панели.
**Решение**: `width: 100%; min-width: 0` с `box-sizing: border-box`.

#### LandingFeatures — шаблонные визуализации
**Проблема**: bento-карточки содержат специфичные для MVPTemplate визуализации (устройства, dark/light toggle, cycling greetings, API routes). При форке нужно переписывать весь компонент.
**Решение**: сделать визуализации в bento-карточках параметризованными через конфиг, или документировать паттерн замены.

#### README остаётся шаблонным
**Проблема**: README содержит документацию по MVPTemplate, а не по продукту. Легко забыть.
**Решение**: добавить README в чеклист форка (уже добавлено), сделать README.md с явным TODO-плейсхолдером.

#### Нет авто-обнаружения Google Sheets в MainScreen
**Проблема**: `TAB_CONTEXT_CHANGED` обрабатывается в кастомной вкладке, но MainScreen не переключается автоматически на нужную вкладку при обнаружении контекста.
**Решение**: слушатель в MainScreen с переключением на первую кастомную вкладку при обнаружении контекста.

#### Home/Explore вкладки содержат шаблонный контент
**Проблема**: "Active Projects / Completed Tasks / Team Members" не подходит ни для одного реального продукта. Пользователь замечает это только после запуска.
**Решение**: добавить TODO-комментарии прямо в файлах `index.tsx` и `explore.tsx`, чтобы форкер видел что нужно заменить.

#### Документация (@mvp/docs) — шаблонная
**Проблема**: после форка в приложении видна документация MVPTemplate (Quick Start, Prerequisites, Docker, etc.) вместо документации продукта.
**Решение**: добавить в чеклист (уже есть), рассмотреть пустой docData.ts по умолчанию.

---

### Что нужно добавить в шаблон

1. ✅ **AuthScreen использует APP_BRAND** — `name` и `tagline`, плюс контролы языка/темы до логина
2. ✅ **`extensionConfig.settingsSections` рендерятся первыми** в SettingsTab
3. ✅ **`width: 100%`** вместо `width: 380px` в extension/globals.css
4. ✅ **`MainScreen` слушает `TAB_CONTEXT_CHANGED`** для auto-switch на первую кастомную вкладку
5. 🔧 **Пустые TODO-заглушки** в Home/Explore вкладках с комментарием `// TODO: customize for your product`
6. 🔧 **`APP_BRAND`** в хедере MainScreen (сейчас хардкод строки)
7. 🔧 **README.md** с явными `# TODO: replace this` секциями вместо описания шаблона
8. 🔧 **Пустой `docData.ts`** по умолчанию (или с одной группой "Getting Started" с заглушками)
9. 🔧 **Параметризованные bento-карточки** в LandingFeatures — принимать массив с `{title, desc, visual}` из конфига

---

### Порядок действий при форке (оптимальный)

1. `cp -R MVPTemplate myproject && cd myproject`
2. `packages/template-config/src/brand.ts` — APP_BRAND
3. `apps/backend/.env` — DB + цветовая тема
4. `npm run dev` — проверить что всё запускается
5. Пройти чеклист секции 14 сверху вниз
6. `apps/extension/src/config.ts` — добавить кастомные вкладки
7. `apps/extension/src/custom/` — бизнес-логика
8. Backend-модули: schema → routes → service → регистрация в app.ts
9. i18n: landing, home, explore, docs
10. Seed планов → `npm run db:seed`
11. Проверка: auth → main feature → payments → admin
