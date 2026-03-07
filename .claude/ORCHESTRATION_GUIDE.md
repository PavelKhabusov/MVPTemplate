# Руководство по оркестрации агентов — MVPTemplate

## Цепочка ролей (BMad-inspired)

```
Product Owner → Architect → TDD Engineer → QA Tester → Context Keeper
   (ЧТО)        (КАК)      (ТЕСТЫ+КОД)   (ПРОВЕРКА)   (ДОКУМЕНТАЦИЯ)
```

## Когда какого агента использовать

| Задача | Агент | Файл |
|--------|-------|------|
| Оценить идею фичи | Product Owner | `agents/product-owner.md` |
| Спроектировать frontend | Senior Expo Architect | `agents/senior-expo-architect.md` |
| Спроектировать backend API | Backend Architect | `agents/backend-architect.md` |
| Оптимизировать лендинг | Landing UX Expert | `agents/landing-ux-expert.md` |
| Написать тесты + код (TDD) | TDD Engineer | `agents/tdd-engineer.md` |
| E2E тестирование в браузере | Playwright QA Tester | `agents/playwright-qa-tester.md` |
| Обновить документацию | Context Keeper | `agents/context-keeper.md` |

## Типичные воркфлоу

### 1. Новая фича (полный цикл)
```
1. Product Owner    → user story + acceptance criteria
2. Architect        → технический дизайн + blueprint
3. TDD Engineer     → тесты (RED) → реализация (GREEN) → рефакторинг
4. Playwright QA    → E2E тесты + visual regression
5. Context Keeper   → обновить MEMORY.md + CLAUDE.md
```

### 2. Баг-фикс
```
1. TDD Engineer     → написать тест воспроизводящий баг (RED)
2. TDD Engineer     → исправить баг (GREEN)
3. Playwright QA    → убедиться что fix работает в браузере
4. Context Keeper   → записать gotcha если нетривиальный баг
```

### 3. Оптимизация лендинга
```
1. Product Owner       → определить метрики и цели
2. Landing UX Expert   → анализ + рекомендации
3. Senior Expo Arch    → реализация UI-изменений
4. Playwright QA       → visual regression + адаптивность
```

### 4. Новый backend-модуль
```
1. Backend Architect   → проектирование API + схема БД
2. TDD Engineer        → тесты + реализация (используй /project:new-module)
3. Context Keeper      → обновить API documentation
```

### 5. Рефакторинг
```
1. TDD Engineer     → убедиться что тесты покрывают текущее поведение
2. Architect        → определить целевую архитектуру
3. TDD Engineer     → рефакторинг при зелёных тестах
4. Playwright QA    → регрессия
```

### 6. Code Review
```
1. Используй промпт: .claude/prompts/code-review.md
2. Playwright QA    → проверить изменения визуально
```

## Быстрые команды

| Команда | Что делает |
|---------|------------|
| `/project:load-context` | Загрузить контекст проекта |
| `/project:save-context` | Сохранить находки сессии |
| `/project:test-app` | Запустить все проверки |
| `/project:new-module [name]` | Создать backend-модуль |
| `/project:quick-task [задача]` | Быстрая задача |
| `/project:visual-qa [компонент]` | Визуальная проверка |
| `/project:orchestrate [задача]` | Полный мульти-агентный воркфлоу |

## Принципы оркестрации

1. **Blueprint перед кодом**: всегда планируй перед реализацией
2. **Test first**: тесты пишутся ДО реализации (TDD)
3. **Фазовые gates**: переход к следующей фазе после подтверждения предыдущей
4. **Контекст актуален**: после каждого значимого изменения → context-keeper
5. **Минимальный scope**: MVP сначала, итерации потом
6. **Верификация**: каждая фича проходит через QA перед merge

## Context7 (MCP)
Для получения документации библиотек без гугления — используй Context7 MCP tools.
Это полезно когда нужна актуальная документация по:
- Expo SDK, Expo Router
- Tamagui
- Fastify, Drizzle ORM
- Playwright
- Zustand, TanStack Query
- Любой другой библиотеке из проекта
