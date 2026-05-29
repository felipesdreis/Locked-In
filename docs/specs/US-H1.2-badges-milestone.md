# US-H1.2 — Badges Discretos de Milestone

**Horizonte:** H1 — Retenção e Engajamento  
**Estimativa:** 5 story points | **Valor:** Alto  
**OKR relacionado:** OKR-1.1 (Retenção D7), OKR-1.2 (Retenção D30)

---

## User Story

**Como** usuário que está construindo um hábito,  
**Quero** receber celebrações visuais ao atingir 7, 30 e 100 dias,  
**Para que** minha motivação se reforce e eu veja o progresso concreto.

---

## Critérios de Aceite (Gherkin)

### Cenário 1: Badge é exibido ao atingir 7 dias de streak
```gherkin
Dado que um hábito tem streak de 6 dias
Quando o usuário marca a conclusão do 7º dia
Então uma modal de celebração aparece com ícone ⭐ (ou similar)
E o modal diz "Parabéns! 7 dias de streak"
E modal desaparece automaticamente em 3 segundos ou ao clicar "Fechar"
E a badge "7 dias" fica marcada visualmente na página do hábito
```

### Cenário 2: Badge de 30 dias exibida após 7 dias (não repete badge anterior)
```gherkin
Dado que um hábito tem streak de 29 dias
Quando o usuário marca a conclusão do 30º dia
Então uma modal de celebração diferente aparece com "Mês completo!"
E a badge "30 dias" fica visível no HabitDetail
E ao marcar os dias 31, 32, etc., a modal de 30 dias NÃO reaparece
```

### Cenário 3: Badge de 100 dias exibida uma única vez
```gherkin
Dado que um hábito tem streak de 99 dias
Quando o usuário marca a conclusão do 100º dia
Então uma modal de celebração especial aparece com "Século completo!"
E a badge "100 dias" fica marcada permanentemente
E não reaparece em acessos futuros
```

### Cenário 4: Badges independentes por hábito
```gherkin
Dado que existem 2 hábitos: um com streak 7 dias, outro com streak 3
Quando o usuário visualiza HabitDetail do hábito com 7 dias
Então vê badge "7 dias" nele
E ao visualizar o hábito com 3 dias, nenhuma badge é exibida
```

---

## Tarefas Técnicas

- [ ] Extensão do `Habit` model com campos de badges:
  - `badge7Days: boolean` (coluna SQLite ou JSON)
  - `badge30Days: boolean`
  - `badge100Days: boolean`
  - Migration SQLite se necessário
- [ ] Criar componente `BadgeCelebrationModalComponent` standalone
  - Input: `milestone: 7 | 30 | 100`
  - Auto-fecha em 3 segundos ou ao clicar "Fechar"
  - Animação de entrada: scale-up + fade-in 300ms
- [ ] Lógica em `HabitService.toggleCompletion()`:
  - Após calcular novo streak, verificar milestones
  - Se streak == 7 AND NOT badge7Days → exibir modal + setar badge7Days = true
  - Idem para 30, 100
  - Persistir flags em SQLite
- [ ] Badge visual em `HabitDetailComponent`:
  - Seção "Conquistas" com badges atingidas
  - Labels: "7 dias 🌟", "30 dias 🏆", "100 dias 💎"
  - Badges não atingidas não aparecem
- [ ] Testes unitários: primeiro badge, não-repetição, múltiplos hábitos

---

## Fora do Escopo

- Badges customizáveis por usuário
- Compartilhamento automático de badges (coberto em US-H1.4)
- Notificações push para badges (apenas modal visual)
- Animações super complexas (fade-in + scale simples)

---

## Especificações de UI

### Modal de celebração

| Milestone | Título | Mensagem | Ícone |
|-----------|--------|---------|-------|
| 7 dias | "🌟 7 dias!" | "Parabéns! Você manteve o hábito por uma semana inteira." | `star` |
| 30 dias | "🏆 Mês completo!" | "Incrível! 30 dias consecutivos. Você está Locked In." | `trophy` |
| 100 dias | "💎 Século completo!" | "Lendário. 100 dias consecutivos. Você é uma máquina." | `diamond` |

### Seção "Conquistas" no HabitDetail

```
┌─────────────────────────────────────────┐
│  Conquistas                             │
│  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │  🌟   │  │  🏆   │  │  💎   │       │
│  │ 7 dias│  │30 dias│  │  100  │       │
│  └───────┘  └───────┘  └───────┘       │
│   (ativa)   (ativa)    (inativa)        │
└─────────────────────────────────────────┘
```

Badges inativas: ícone com opacidade 0.3, sem label

---

## Schema SQLite

### Opção A: 3 colunas boolean (recomendado, mais simples de query)
```sql
ALTER TABLE habits ADD COLUMN badge_7_days INTEGER DEFAULT 0;
ALTER TABLE habits ADD COLUMN badge_30_days INTEGER DEFAULT 0;
ALTER TABLE habits ADD COLUMN badge_100_days INTEGER DEFAULT 0;
```

### Opção B: JSON blob (menos migrations)
```sql
ALTER TABLE habits ADD COLUMN badges TEXT DEFAULT '{}';
-- badges JSON: {"sevenDays": false, "thirtyDays": false, "hundredDays": false}
```

**Recomendação:** Opção A — mais simples, nativa, sem parsing JSON.

---

## Prompts para Claude Code

### Desenvolvedor

```
Tarefa: Implementar sistema de badges de milestone (7, 30, 100 dias) com modais de celebração.

Contexto:
- Stack: Ionic 7 + Angular 17 + Capacitor 7 + SQLite
- Habit-tracker: usuários constroem streaks e queremos reforçar progresso
- Objetivo: aumentar motivação D7/D30 via celebrações discretas

Requisitos técnicos:

1. Modelo de dados:
   - Adicionar 3 colunas ao schema habits: badge_7_days, badge_30_days, badge_100_days (INTEGER DEFAULT 0)
   - Executar migration via DbService (verificar se coluna existe antes de adicionar)
   - Atualizar Habit type em src/app/core/models/habit.model.ts

2. BadgeCelebrationModalComponent standalone:
   - Localização: src/app/shared/components/badge-celebration-modal/
   - Input: milestone: 7 | 30 | 100
   - Ícone + título + mensagem baseado no milestone (ver tabela na spec)
   - Auto-fecha em 3 segundos (setTimeout)
   - Botão "Fechar" que fecha imediatamente
   - Animação de entrada: scale-up + fade-in 300ms via @angular/animations ou CSS transition

3. Lógica em HabitService.toggleCompletion(habitId, date):
   - Após toggle, recalcular streak via StreakService
   - Verificar milestones: se streak == 7 AND NOT badge_7_days → disparar modal + setar flag
   - Idem para 30, 100
   - Persistir flag: UPDATE habits SET badge_7_days=1 WHERE id=?
   - Emitir evento/signal para o componente pai exibir o modal

4. HabitDetailComponent:
   - Adicionar seção "Conquistas" mostrando badges atingidas
   - Apenas badges com flag=true aparecem
   - Ícone + label por badge

5. Testes:
   - toggleCompletion no 7º dia → badge modal dispara, flag setada
   - Toggle adicional (8º, 9º dia) → modal NÃO reaparece
   - Badge de 30 dias após 7 → modal diferente
   - Múltiplos hábitos: badge em A não afeta B

Critérios de sucesso:
- Badges disparam exatamente uma vez por milestone por hábito
- Flags persistidas em SQLite
- HabitDetail mostra conquistas
- Build sem erros
- Testes unitários passando

Comandos:
npm run test:single
npm run build
npm run build:android

Padrões:
- Signals via signal() e computed()
- IonModal para modais
- Standalone components
- Ionicons: star, trophy (importar via addIcons)
- Sem RxJS

Deliverables:
- src/app/shared/components/badge-celebration-modal/ (componente)
- src/app/core/models/habit.model.ts (atualizado)
- src/app/core/services/habit.service.ts (lógica de badges)
- src/app/features/habit-detail/ (seção conquistas)
- Migration SQLite (se nova coluna)
- Testes unitários
```

### QA

```
Tarefa: QA para Badges de Milestone (US-H1.2).

Cenários de teste manual:

1. Badge de 7 dias — aparece exatamente uma vez
   - Criar hábito, toglar 6 dias (ajuste manualmente via DB se necessário)
   - No 7º dia, toglar conclusão
   - Verificar: modal celebração com "7 dias" aparece
   - Fechar modal
   - Abrir HabitDetail → badge "7 dias" visível na seção Conquistas
   - Toglar dia 8, 9, 10 → modal NÃO reaparece
   - Fechar e reabrir app → badge ainda visível, modal não reaparece

2. Badge de 30 dias
   - Simular hábito com 29 dias (usar debug/mock ou ajustar data no DB)
   - Toglar conclusão dia 30
   - Verificar: modal "Mês completo!" aparece
   - Badge "30 dias" visível no HabitDetail
   - Modal de 7 dias NÃO reaparece (só 30 dias)

3. Badge de 100 dias
   - Simular hábito com 99 dias
   - Toglar conclusão dia 100
   - Verificar: modal "Século completo!" aparece
   - Badge "100 dias" persistida
   - Próximos toggles (101, 102...) → modal não reaparece

4. Badges independentes entre hábitos
   - Criar hábito A (com badge 7 dias), hábito B (com 3 dias)
   - HabitDetail do A → exibe badge "7 dias"
   - HabitDetail do B → nenhuma badge
   - Completar B até 7 dias → badge aparece só em B (não afeta A)

5. Modal timing
   - Modal aparece ≤ 500ms após toggle
   - Auto-fecha em 2.5–3.5 segundos
   - Clique em "Fechar" → fecha imediatamente
   - Sem múltiplas modais simultâneas

6. Persistência entre sessões
   - Criar hábito, completar 7 dias, fechar app
   - Reabrir → badge "7 dias" ainda visível em HabitDetail
   - Sem duplicação

7. Edge cases
   - Hábito com frequência weekdays: streak conta apenas dias úteis
     → milestone 7 ainda funciona? (Sim, baseado em dias de streak)
   - Arquivar hábito com badges → badges persistidas no arquivo
   - Deletar hábito com badges → sem erros (cascade)

Relatório:
- [ ] Modais aparecem no timing correto
- [ ] Badges não repetidas após primeira exibição
- [ ] Badges visíveis em HabitDetail seção Conquistas
- [ ] Sem lag ou travamentos
- [ ] Sem erros em logcat/console
- [ ] Persistência entre sessões confirmada
```

---

## Checklist de PR

```markdown
## Linked Story
US-H1.2 — Badges Discretos de Milestone

## Changes
- Habit model: badge_7_days, badge_30_days, badge_100_days adicionados
- BadgeCelebrationModalComponent criado em src/app/shared/components/
- HabitService.toggleCompletion() com lógica de milestone
- HabitDetailComponent: seção "Conquistas"
- Migration SQLite: 3 novas colunas

## QA Checklist
- [ ] Badge 7 dias: aparece uma vez no 7º dia
- [ ] Badge 30 dias: aparece uma vez no 30º dia
- [ ] Badge 100 dias: aparece uma vez no 100º dia
- [ ] Badges não se repetem em toggles posteriores
- [ ] Conquistas visíveis em HabitDetail
- [ ] Badges independentes por hábito
- [ ] Sem erros em logcat/console

## Test Results
npm run test:single: __/__ specs passing
npm run build: SUCCESS / ERROR
npm run build:android: SUCCESS / ERROR
```
