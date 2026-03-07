Создай новый backend-модуль по стандартному шаблону проекта.

Имя модуля: $ARGUMENTS

## Шаги:

### 1. Создай структуру директорий
```
apps/backend/src/modules/[name]/
├── [name].routes.ts
├── [name].service.ts
├── [name].repository.ts
├── [name].schema.ts
└── __tests__/
    └── [name].service.test.ts
```

### 2. Используй шаблоны из существующих модулей
Прочитай пример из `apps/backend/src/modules/auth/` для reference:
- `auth.routes.ts` — паттерн маршрутов
- `auth.service.ts` — паттерн сервиса
- `auth.repository.ts` — паттерн repository
- `auth.schema.ts` — паттерн Zod-валидации

### 3. Конвенции:
- Routes: `export default async function [name]Routes(fastify: FastifyInstance)`
- Service: функции с бизнес-логикой, принимающие данные из routes
- Repository: Drizzle queries, без бизнес-логики
- Schema: Zod-схемы для body, params, querystring, response
- Tests: Vitest с моком repository

### 4. Зарегистрируй маршруты
Добавь регистрацию в `apps/backend/src/app.ts`:
```typescript
fastify.register(import('./modules/[name]/[name].routes.js'), { prefix: '/api/[name]' });
```

### 5. TDD: сначала напиши тест
Создай `__tests__/[name].service.test.ts` с базовыми тестами ПЕРЕД реализацией.

### 6. Если нужна таблица в БД
Создай схему в `apps/backend/src/database/schema/[name].ts` и добавь экспорт в `schema/index.ts`.
После этого: `npm run db:push` для применения.
