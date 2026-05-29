# US-H1.5 — Localização PT-BR Completa

**Horizonte:** H1 — Retenção e Engajamento  
**Estimativa:** 5 story points | **Valor:** Médio  
**OKR relacionado:** OKR-1.3 (Rating Play Store ≥ 4.0 — reduce friction para BR users), OKR-1.4

---

## User Story

**Como** usuário brasileiro,  
**Quero** usar o app completamente em português,  
**Para que** eu entenda 100% das mensagens e formatos de data sem confusão.

---

## Critérios de Aceite (Gherkin)

### Cenário 1: Todas as strings UI estão em português
```gherkin
Dado que o app está rodando em device/browser
Quando o usuário navega por todas as páginas
Então todos os textos visíveis estão em português brasileiro
E nenhuma string em inglês é visível (exceto nomes técnicos internos)
E botões, labels, placeholders, mensagens de erro estão em PT-BR
```

### Cenário 2: Datas formatadas em padrão brasileiro
```gherkin
Dado que o app exibe datas (em HabitDetail, analytics, notificações)
Quando usuário visualiza uma data
Então o formato é "28 de maio de 2026" ou "28/05/2026"
E nunca aparece formato americano (mm/dd/yyyy)
E meses têm nomes em português (Janeiro, Fevereiro, etc.)
```

### Cenário 3: Frequências em português
```gherkin
Dado que existem hábitos com diferentes frequências
Quando usuário visualiza frequência (em card, form, settings)
Então exibe: "Diário", "De segunda a sexta", "Finais de semana", "Customizado", "X vezes por semana"
E nunca exibe: "Daily", "Weekdays", "Custom"
```

### Cenário 4: Mensagens de feedback em português
```gherkin
Dado que ocorrem erros ou situações especiais
Quando app exibe mensagens (empty state, notificações, toasts)
Então textos estão em português
E tom é amigável e claro
```

---

## Tarefas Técnicas

- [ ] Instalar `@ngx-translate/core` e `@ngx-translate/http-loader`
- [ ] Criar `src/assets/i18n/pt-BR.json` com todas as strings do app
- [ ] Configurar `TranslateModule` no `app.config.ts` (provideTranslation)
- [ ] Substituir strings hardcoded por pipe `| translate` nos templates
- [ ] Injetar `TranslateService` nos componentes que precisam de tradução via código
- [ ] Adicionar função `formatDateBR(date: Date): string` em `src/app/core/utils/date.util.ts`
- [ ] Registrar locale pt-BR via `LOCALE_ID` e `DatePipe` no `app.config.ts`
- [ ] Criar helper `i18n.getFrequencyLabel(frequencyType: string): string`
- [ ] Audit completo: varrer todos os arquivos `.html` e `.ts` para strings inglesas

---

## Fora do Escopo

- Suporte a múltiplos idiomas (apenas PT-BR nesta US)
- RTL (Right-to-Left) para árabe/hebraico
- Tradução de documentação interna (CLAUDE.md, README.md permanecem em inglês)

---

## Glossário PT-BR

Traduções consistentes para termos técnicos do app:

| Inglês | PT-BR |
|--------|-------|
| Habit | Hábito |
| Completion | Conclusão |
| Streak | Sequência / Streak (manter termo) |
| Frequency | Frequência |
| Daily | Diário |
| Weekdays | De segunda a sexta |
| Weekends | Finais de semana |
| Custom | Customizado |
| X per week | X vezes por semana |
| Archive | Arquivar |
| Archived | Arquivado |
| Restore | Restaurar |
| Delete | Deletar |
| Settings | Configurações |
| Analytics | Estatísticas |
| Notification | Lembrete |
| Reminder | Lembrete |
| Today's rate | Taxa de hoje |
| Top streaks | Maiores sequências |
| Cancel | Cancelar |
| Save | Salvar |
| Edit | Editar |
| Create | Criar |
| New habit | Novo hábito |
| Empty state | (mensagem contextual) |
| No habits | Nenhum hábito criado ainda |
| No archived | Nenhum hábito arquivado |

---

## Arquivo i18n/pt-BR.json (estrutura base)

```json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "edit": "Editar",
    "delete": "Deletar",
    "archive": "Arquivar",
    "restore": "Restaurar",
    "confirm": "Confirmar",
    "close": "Fechar",
    "back": "Voltar"
  },
  "home": {
    "title": "Meus Hábitos",
    "empty": "Nenhum hábito criado ainda",
    "emptySubtitle": "Crie seu primeiro hábito para começar",
    "addButton": "Novo hábito",
    "howItWorks": "Como funciona?",
    "viewArchived": "Ver arquivados"
  },
  "habitForm": {
    "titleCreate": "Novo hábito",
    "titleEdit": "Editar hábito",
    "namePlaceholder": "Ex.: Meditação, Exercício...",
    "nameLabel": "Nome",
    "frequencyLabel": "Frequência",
    "reminderLabel": "Lembrete (opcional)",
    "iconLabel": "Ícone",
    "nameRequired": "Nome é obrigatório",
    "nameMaxLength": "Nome deve ter no máximo 50 caracteres",
    "frequencyRequired": "Selecione pelo menos um dia"
  },
  "frequency": {
    "daily": "Diário",
    "weekdays": "De segunda a sexta",
    "weekends": "Finais de semana",
    "custom": "Customizado",
    "x_per_week": "{{count}} vezes por semana"
  },
  "habitDetail": {
    "currentStreak": "{{count}} dias de sequência",
    "bestStreak": "Melhor: {{count}} dias",
    "completionRate": "{{rate}}% de conclusão",
    "history": "Histórico",
    "achievements": "Conquistas",
    "shareButton": "Compartilhar 🎯 {{count}} dias",
    "noAchievements": "Continue mantendo seu hábito para desbloquear conquistas"
  },
  "analytics": {
    "title": "Estatísticas",
    "todayRate": "{{rate}}% completos hoje",
    "topStreaks": "Maiores sequências",
    "totalHabits": "{{count}} hábitos",
    "totalCompletions": "{{count}} conclusões"
  },
  "archived": {
    "title": "Hábitos Arquivados",
    "empty": "Nenhum hábito arquivado",
    "emptySubtitle": "Hábitos arquivados aparecem aqui",
    "restoreButton": "Restaurar",
    "deleteButton": "Deletar permanentemente",
    "deleteConfirm": "Isso apagará permanentemente o hábito e todo o histórico. Não pode ser desfeito.",
    "deleteTitle": "Deletar hábito?"
  },
  "notifications": {
    "title": "Lembrete: {{habitName}}",
    "body": "Não se esqueça de completar seu hábito hoje!"
  },
  "onboarding": {
    "slide1Title": "Crie um hábito",
    "slide1Text": "Escolha uma atividade que quer manter — exercício, leitura, meditação. Dê um nome e defina a frequência.",
    "slide2Title": "Marque cada dia",
    "slide2Text": "Todo dia que você completa, marque no app. Simples assim. Um toque e está feito.",
    "slide3Title": "Seu streak cresce",
    "slide3Text": "Dias consecutivos formam um streak. Quanto mais você mantém, mais difícil fica de quebrar. Locked In.",
    "startButton": "Começar",
    "skipButton": "Pular"
  },
  "badges": {
    "7days": "7 dias 🌟",
    "30days": "30 dias 🏆",
    "100days": "100 dias 💎",
    "modal7Title": "🌟 7 dias!",
    "modal7Message": "Parabéns! Você manteve o hábito por uma semana inteira.",
    "modal30Title": "🏆 Mês completo!",
    "modal30Message": "Incrível! 30 dias consecutivos. Você está Locked In.",
    "modal100Title": "💎 Século completo!",
    "modal100Message": "Lendário. 100 dias consecutivos. Você é uma máquina."
  },
  "days": {
    "0": "Dom",
    "1": "Seg",
    "2": "Ter",
    "3": "Qua",
    "4": "Qui",
    "5": "Sex",
    "6": "Sáb",
    "fullDays": {
      "0": "Domingo",
      "1": "Segunda-feira",
      "2": "Terça-feira",
      "3": "Quarta-feira",
      "4": "Quinta-feira",
      "5": "Sexta-feira",
      "6": "Sábado"
    }
  },
  "months": {
    "0": "Janeiro",
    "1": "Fevereiro",
    "2": "Março",
    "3": "Abril",
    "4": "Maio",
    "5": "Junho",
    "6": "Julho",
    "7": "Agosto",
    "8": "Setembro",
    "9": "Outubro",
    "10": "Novembro",
    "11": "Dezembro"
  }
}
```

---

## Prompts para Claude Code

### Desenvolvedor

```
Tarefa: Implementar localização completa em português brasileiro (PT-BR).

Contexto:
- Habit-tracker Angular 17 + Ionic 7
- Objetivo: app 100% em português para usuários brasileiros
- Critério de sucesso: nenhuma string visível em inglês

Abordagem: @ngx-translate/core (Opção B — mais simples para MVP)

Requisitos:

1. Instalação e setup:
   npm install @ngx-translate/core @ngx-translate/http-loader
   - Configurar TranslateModule em app.config.ts com HttpLoaderFactory
   - TranslateLoader aponta para /assets/i18n/{{lang}}.json
   - Setar idioma padrão: TranslateService.use('pt-BR') em AppComponent.constructor

2. Arquivo i18n:
   - Criar src/assets/i18n/pt-BR.json com estrutura fornecida na spec
   - Incluir: common, home, habitForm, frequency, habitDetail, analytics, archived,
     notifications, onboarding, badges, days, months

3. Templates — substituir strings hardcoded:
   - Varrer todos os .html em src/app/
   - Substituir: "Novo hábito" → {{ 'home.addButton' | translate }}
   - Usar parametrização para strings dinâmicas:
     {{ 'habitDetail.currentStreak' | translate: { count: habit.currentStreak } }}

4. Componentes TypeScript — strings via TranslateService:
   - AlertController e ToastController recebem strings via:
     this.translate.instant('archived.deleteTitle')
   - Notificações: usar translate.instant para título e body

5. Datas em PT-BR:
   - Adicionar em src/app/core/utils/date.util.ts:
     export function formatDateBR(date: Date): string
     → Retorna "28 de maio de 2026"
     export function formatDateShortBR(date: Date): string
     → Retorna "28/05/2026"
   - Usar months array do i18n ou hardcode as constantes
   - Registrar locale LOCALE_ID em app.config.ts:
     { provide: LOCALE_ID, useValue: 'pt-BR' }

6. Helper de frequência:
   - Adicionar em HabitService ou utils:
     getFrequencyLabel(frequencyType: HabitFrequency, count?: number): string
   - Retorna string traduzida do frequency.* do i18n

Critérios de sucesso:
- src/assets/i18n/pt-BR.json criado e completo
- Todos os templates usam pipe translate
- Nenhuma string visível em inglês ao navegar no app
- Datas retornam formato PT-BR
- Build sem erros

Comandos:
npm run build
npm run build:android

Padrões:
- TranslateModule importado nos componentes standalone que usam pipe translate
- Pipe translate via import direto no component: TranslatePipe
- TranslateService injetado onde necessário

Deliverables:
- src/assets/i18n/pt-BR.json
- src/app/core/utils/date.util.ts (atualizado com formatDateBR)
- Todos os templates .html com pipe translate
- app.config.ts com LOCALE_ID e TranslateModule setup
```

### QA

```
Tarefa: QA para Localização PT-BR Completa (US-H1.5).

Método: navegar por TODAS as páginas do app e verificar cada string.

1. Home / Lista de hábitos
   - [ ] Título "Meus Hábitos" em PT-BR
   - [ ] Empty state: "Nenhum hábito criado ainda"
   - [ ] Botão "+ Novo hábito"
   - [ ] Card: streak "X dias" (não "X days")
   - [ ] Frequência nos cards: "Diário", "De segunda a sexta", etc.

2. Criar/Editar hábito (HabitForm)
   - [ ] Título: "Novo hábito" ou "Editar [nome]"
   - [ ] Labels: "Nome", "Ícone", "Frequência", "Lembrete (opcional)"
   - [ ] Frequências no dropdown: "Diário", "De segunda a sexta", "Finais de semana", "Customizado", "X vezes por semana"
   - [ ] Botões "Salvar", "Cancelar"
   - [ ] Mensagens de validação em PT-BR: "Nome é obrigatório"

3. Detalhe do hábito (HabitDetail)
   - [ ] "X dias de sequência"
   - [ ] "Melhor: X dias"
   - [ ] "X% de conclusão"
   - [ ] "Histórico"
   - [ ] "Conquistas"
   - [ ] Botões: "Compartilhar", "Editar", "Arquivar"
   - [ ] Datas no calendário em PT-BR (ex.: "maio 2026", "Dom Seg Ter...")

4. Analytics (Estatísticas)
   - [ ] Título: "Estatísticas"
   - [ ] "X% completos hoje"
   - [ ] "Maiores sequências"
   - [ ] Dias da semana: "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"

5. Hábitos Arquivados
   - [ ] Título: "Hábitos Arquivados"
   - [ ] Empty: "Nenhum hábito arquivado"
   - [ ] Botões: "Restaurar", "Deletar permanentemente"
   - [ ] Modal de confirmação: texto em PT-BR

6. Notificações (se implementadas)
   - [ ] Título: "Lembrete: [nome do hábito]"
   - [ ] Corpo em PT-BR

7. Formatos de Data
   - [ ] Datas longas: "28 de maio de 2026"
   - [ ] Datas curtas: "28/05/2026" (se usadas)
   - [ ] Meses em PT-BR
   - [ ] NENHUMA data no formato americano (May 28, 2026 ou 05/28/2026)

8. Modais e dialogs
   - [ ] Badge celebration: "🌟 7 dias!", "Parabéns! ..."
   - [ ] Confirmação de delete
   - [ ] Onboarding tutorial (se implementado)

Busca por strings inglesas residuais:
- Inspecionar DOM via DevTools
- Procurar: "Daily", "Weekly", "Archive", "Settings", "Cancel", "Save", "Edit", "Delete"
- Qualquer string em inglês é um bug

Relatório:
- [ ] 100% das strings visíveis em PT-BR
- [ ] Nenhuma string em inglês encontrada
- [ ] Datas em formato PT-BR em todas as pages
- [ ] Frequências traduzidas nos cards e formulário
- [ ] Mensagens de erro em PT-BR
- [ ] Sem quebras de layout com textos mais longos
```

---

## Checklist de PR

```markdown
## Linked Story
US-H1.5 — Localização PT-BR Completa

## Changes
- src/assets/i18n/pt-BR.json criado (X keys)
- @ngx-translate/core e http-loader instalados
- app.config.ts: TranslateModule + LOCALE_ID configurados
- Todos os templates: pipe translate aplicado
- date.util.ts: formatDateBR() e formatDateShortBR() adicionados
- Helper getFrequencyLabel() criado

## QA Checklist
- [ ] Home em PT-BR (título, empty state, botões, cards)
- [ ] HabitForm em PT-BR (labels, frequências, validação)
- [ ] HabitDetail em PT-BR (stats, badges, botões)
- [ ] Analytics em PT-BR (título, métricas, dias da semana)
- [ ] Arquivados em PT-BR
- [ ] Datas em formato PT-BR (dd de mês de aaaa)
- [ ] Nenhuma string inglesa visível

## Test Results
npm run build: SUCCESS / ERROR
npm run build:android: SUCCESS / ERROR
```
