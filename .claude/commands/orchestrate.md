Запусти мульти-агентный воркфлоу для комплексной задачи.

Задача: $ARGUMENTS

## Процесс оркестрации (вдохновлён BMad Framework):

### Фаза 1: ANALYZE (Product Owner)
Загрузи контекст из `.claude/agents/product-owner.md` и:
1. Определи ценность задачи (impact/effort)
2. Сформулируй user story + acceptance criteria
3. Определи scope (MVP vs full)
4. Обозначь метрики успеха

### Фаза 2: ARCHITECT (Senior Expo / Backend Architect)
Загрузи соответствующего агента и:
1. Определи затрагиваемые файлы и пакеты
2. Спроектируй архитектуру решения
3. Определи зависимости и порядок реализации
4. Создай blueprint (детальный план реализации)

### Фаза 3: TEST FIRST (TDD Engineer)
Загрузи `.claude/agents/tdd-engineer.md` и:
1. Напиши тесты на основе acceptance criteria
2. Убедись что тесты падают (RED)
3. Определи test coverage targets

### Фаза 4: IMPLEMENT (Architect + TDD)
1. Реализуй минимальный код для прохождения тестов (GREEN)
2. Рефактори при зелёных тестах (REFACTOR)
3. Проверь typecheck + lint

### Фаза 5: VERIFY (Playwright QA)
Загрузи `.claude/agents/playwright-qa-tester.md` и:
1. Напиши/обнови E2E тесты для нового функционала
2. Проверь visual regression
3. Проверь accessibility

### Фаза 6: DOCUMENT (Context Keeper)
Загрузи `.claude/agents/context-keeper.md` и:
1. Обнови MEMORY.md с новыми знаниями
2. Обнови CLAUDE.md если изменилась структура
3. Создай changelog-запись

## Выход:
После каждой фазы — краткая сводка пользователю. Спросить подтверждение перед переходом к следующей фазе.

## Ссылка на подробности: `.claude/ORCHESTRATION_GUIDE.md`
