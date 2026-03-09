Загрузи и проанализируй контекст проекта MVPTemplate:

1. Прочитай `CLAUDE.md` в корне проекта — основные инструкции
2. Прочитай `~/.claude/projects/-Users-pavel-Documents-MVPTemplate/memory/MEMORY.md` — персистентная память
3. Выполни `git status` и `git log --oneline -10` — текущее состояние
4. Проверь `git branch --show-current` — текущая ветка
5. Выведи краткую сводку:
   - Текущая ветка и статус
   - Последние 5 коммитов
   - Незакоммиченные изменения
   - Ключевые напоминания из MEMORY.md

Если указаны аргументы: $ARGUMENTS — загрузи дополнительный контекст:
- `agents` — прочитай все файлы из `.claude/agents/`
- `commands` — прочитай все файлы из `.claude/commands/`
- `full` — загрузи всё: agents + commands + ORCHESTRATION_GUIDE.md
