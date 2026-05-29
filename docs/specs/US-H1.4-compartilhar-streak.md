# US-H1.4 — Compartilhar Streak (Geração Local)

**Horizonte:** H1 — Retenção e Engajamento  
**Estimativa:** 8 story points | **Valor:** Alto  
**OKR relacionado:** OKR-1.3 (Rating Play Store ≥ 4.0), OKR-1.4 (Avg hábitos ≥ 2.5)

---

## User Story

**Como** usuário com uma streak impressionante,  
**Quero** compartilhar uma imagem/card do meu progresso via WhatsApp, Instagram, etc.,  
**Para que** eu mostre meu comprometimento a amigos sem expor dados pessoais.

---

## Critérios de Aceite (Gherkin)

### Cenário 1: Botão "Compartilhar" ausente para streak < 7
```gherkin
Dado que um hábito tem streak < 7 dias
Quando usuário abre HabitDetail
Então nenhum botão "Compartilhar" é visível
```

### Cenário 2: Botão aparece para streak ≥ 7
```gherkin
Dado que um hábito tem streak ≥ 7 dias
Quando usuário abre HabitDetail
Então um botão "Compartilhar 🎯 X dias" aparece
E ao clicar, abre dialog de compartilhamento com preview da imagem
```

### Cenário 3: Imagem gerada localmente com design atrativo
```gherkin
Dado que usuário clica "Compartilhar"
Quando a imagem é gerada
Então uma preview é exibida com:
  - Ícone do hábito (grande, centralizado)
  - Nome do hábito
  - "X dias de streak 🔥"
  - Data de hoje formatada em PT-BR
  - Texto "Locked In — 100% privado, sem conta"
E a imagem é gerada em memória (Canvas API)
E nenhuma imagem é salva permanentemente no device
```

### Cenário 4: Share Intent nativo do Android
```gherkin
Dado que a imagem foi gerada e preview exibida
Quando usuário clica "Compartilhar"
Então abre Share Intent do Android (WhatsApp, Instagram, Email, etc.)
E a imagem é anexada automaticamente
E após compartilhamento, a imagem é descartada da memória
```

### Cenário 5: Streak zerado não é compartilhável
```gherkin
Dado que um hábito tem streak = 0 (ou < 7)
Quando usuário abre HabitDetail
Então nenhum botão "Compartilhar" aparece
```

---

## Tarefas Técnicas

- [ ] Criar `ShareService` em `src/app/core/services/share.service.ts`:
  - Método `generateStreakImage(habit: Habit, streakDays: number): Promise<Blob>`
  - Canvas API (1080x1080px, quadrado)
  - Retornar Blob PNG
- [ ] Modal de preview `SharePreviewModalComponent` (standalone):
  - Preview da imagem (responsiva)
  - Botão "Compartilhar" que chama Share Intent
  - Botão "Cancelar"
- [ ] Botão "Compartilhar 🎯 X dias" em `HabitDetailComponent`:
  - Visível apenas se `currentStreak >= 7`
  - Ao clicar: gerar imagem + abrir modal de preview
- [ ] Integrar `@capacitor/share`:
  - Converter Blob para file temporário e compartilhar
  - Limpar arquivo temporário após share
- [ ] Fallback browser: botão "Download PNG" em vez de Share Intent
- [ ] Testes unitários: image generation retorna Blob válido, Share Intent mockado

---

## Fora do Escopo

- Customização de design por usuário (template fixo)
- Histórico de compartilhamentos
- Integração direta com redes sociais (apenas Share Intent nativo)
- Backend ou analytics de shares

---

## Especificações de Design da Imagem

### Dimensões
- 1080 × 1080px (quadrado, otimizado para Instagram/WhatsApp)

### Layout (Canvas)
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    [Ícone do hábito]                     │
│                       (120x120px)                        │
│                                                          │
│                   [Nome do hábito]                       │
│                  (max 20 chars, bold)                    │
│                                                          │
│               "42 dias de streak 🔥"                     │
│                  (destaque, grande)                      │
│                                                          │
│              "28 de maio de 2026"                        │
│                                                          │
│          "Locked In — 100% privado, sem conta"           │
│                  (pequeno, rodapé)                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Paleta de cores
- Fundo: gradiente `--ion-color-primary` → `--ion-color-primary-shade`
- Texto principal: branco (#FFFFFF)
- Texto secundário: rgba(255, 255, 255, 0.8)
- Rodapé: rgba(255, 255, 255, 0.6)

### Fontes
- Usar fontes padrão disponíveis no Canvas: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Não depender de fontes customizadas (podem não estar disponíveis)

---

## Prompts para Claude Code

### Desenvolvedor

```
Tarefa: Implementar compartilhamento local de streak via image generation + Share Intent.

Contexto:
- Habit-tracker local-first (sem backend)
- Objetivo: gerar imagem PNG em memória + compartilhar via Share nativo do Android
- Sem salvar imagem permanentemente no device

Requisitos:

1. ShareService (src/app/core/services/share.service.ts):
   - Método async generateStreakImage(habit: Habit, streakDays: number): Promise<Blob>
   - Criar canvas 1080x1080 via document.createElement('canvas')
   - Desenhar:
     * Fundo: gradiente vertical com primary color do app
     * Ícone do hábito: renderizar ionicon como texto Unicode ou usar emoji equivalente (64px)
     * Nome do hábito: centralizado, bold, branco, 48px (truncar com "..." se > 20 chars)
     * "X dias de streak 🔥": destaque, 72px, branco
     * Data: format PT-BR "28 de maio de 2026", 32px
     * Rodapé: "Locked In — 100% privado, sem conta", 24px, semitransparente
   - Retornar canvas.toBlob('image/png') como Promise<Blob>

2. SharePreviewModalComponent (src/app/shared/components/share-preview-modal/):
   - Standalone
   - Input: imageBlob: Blob, habitName: string, streakDays: number
   - Exibir preview: <img [src]="imageUrl"> (createObjectURL do Blob)
   - Botão "Compartilhar" → chama shareImage()
   - Botão "Cancelar" → fecha modal
   - Limpar URL.revokeObjectURL ao fechar

3. shareImage() logic:
   Android:
   - Usar @capacitor/share: instalar se não existir
   - Converter Blob para arquivo temporário no filesystem via @capacitor/filesystem
   - Compartilhar via Capacitor.Plugins.Share.share({ files: [...] })
   - Deletar arquivo temporário após share

   Browser fallback:
   - Criar <a href="blob:..." download="locked-in-[habitId].png">
   - Trigger click para download

4. HabitDetailComponent:
   - Botão "Compartilhar 🎯 X dias" condicional: visível se currentStreak >= 7
   - Ao clicar: chamar ShareService.generateStreakImage() + abrir SharePreviewModal

5. Testes:
   - generateStreakImage retorna Blob com type='image/png'
   - Share Intent é chamado com file
   - Blob é descartado após share

Critérios de sucesso:
- Imagem 1080x1080px, PNG válido
- Preview exibida antes de compartilhamento
- Share Intent abre em Android com imagem anexada
- Download funciona em browser
- Sem memory leaks (Blob e ObjectURL descartados)
- Botão só aparece para streak >= 7

Comandos:
npm run test:single
npm run build
npm run build:android

Padrões:
- Signals para estado do modal (isShareModalOpen, generatedBlob)
- async/await para image generation
- Canvas API nativa (sem bibliotecas externas)
- @capacitor/share e @capacitor/filesystem

Deliverables:
- src/app/core/services/share.service.ts
- src/app/shared/components/share-preview-modal/ (componente)
- src/app/features/habit-detail/ (botão Compartilhar + lógica)
- Testes unitários para ShareService
```

### QA

```
Tarefa: QA para Compartilhar Streak (US-H1.4).

Testes manuais:

1. Botão "Compartilhar" — condicional por streak
   - Criar hábito, completar 6 dias
   - Abrir HabitDetail → NENHUM botão "Compartilhar"
   - Completar 7º dia
   - Reabrir HabitDetail → botão "Compartilhar 🎯 7 dias" APARECE
   - Streak 0 ou resetado → botão desaparece

2. Preview de imagem
   - Clicar "Compartilhar"
   - Modal de preview abre com imagem
   - Imagem contém:
     * Ícone do hábito visível (não pixelado)
     * Nome do hábito
     * "7 dias de streak 🔥"
     * Data de hoje em PT-BR (ex.: "28 de maio de 2026")
     * "Locked In — 100% privado, sem conta"
   - Imagem é quadrada (~1080x1080 ou scaled down)
   - Legível, sem truncamentos

3. Compartilhamento via Share Intent (Android)
   - Na preview, clicar "Compartilhar"
   - Android Share Intent abre (WhatsApp, Gmail, etc.)
   - Verificar: imagem está anexada à share
   - Enviar via WhatsApp → imagem recebida é nítida, layout correto
   - Fechar app e reabrir → sem memory leak

4. Download em browser
   - Abrir app em browser Chrome
   - Clicar "Compartilhar" no HabitDetail
   - Verificar: preview aparece
   - Clicar "Compartilhar/Download" → arquivo PNG baixado
   - Abrir arquivo → imagem válida com conteúdo correto

5. Streak zerado
   - Criar hábito sem completar nenhum dia
   - HabitDetail → nenhum botão "Compartilhar"
   - Completar 1 dia, desmarcar → streak = 0 → sem botão

6. Múltiplos hábitos
   - Hábito A: 7 dias → preview mostra nome A, 7 dias
   - Hábito B: 15 dias → preview mostra nome B, 15 dias
   - Sem confusão entre hábitos

7. Performance e cleanup
   - Gerar imagem não trava UI (< 500ms)
   - Preview carrega rapidamente
   - Após share, app não consome mais memória

Relatório:
- [ ] Botão aparece apenas para streak >= 7
- [ ] Preview com design correto (todos os campos)
- [ ] Share Intent funciona em Android (imagem anexada)
- [ ] Download funciona em browser
- [ ] Sem erros em logcat/console
- [ ] Sem memory leaks
```

---

## Checklist de PR

```markdown
## Linked Story
US-H1.4 — Compartilhar Streak (Geração Local)

## Changes
- ShareService criado em src/app/core/services/
- SharePreviewModalComponent criado em src/app/shared/components/
- HabitDetailComponent: botão "Compartilhar" condicional (streak >= 7)
- @capacitor/share e @capacitor/filesystem integrados

## QA Checklist
- [ ] Botão visível apenas para streak >= 7
- [ ] Preview com imagem correta (todos os campos)
- [ ] Share Intent abre em Android com imagem
- [ ] Download funciona em browser
- [ ] Sem memory leaks (URL.revokeObjectURL, Blob descartado)
- [ ] Performance: imagem gerada em < 500ms

## Test Results
npm run test:single: __/__ specs passing
npm run build: SUCCESS / ERROR
npm run build:android: SUCCESS / ERROR
```
