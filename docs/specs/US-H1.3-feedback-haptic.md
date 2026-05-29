# US-H1.3 — Feedback Visual e Haptic ao Toglar Hábito

**Horizonte:** H1 — Retenção e Engajamento  
**Estimativa:** 3 story points | **Valor:** Médio  
**OKR relacionado:** OKR-1.1 (Retenção D7 — melhora engagement diário)

---

## User Story

**Como** usuário que usa Locked In diariamente,  
**Quero** sentir feedback imediato (visual + vibração) ao marcar/desmarcar um hábito,  
**Para que** a ação pareça mais responsiva e recompensadora.

---

## Critérios de Aceite (Gherkin)

### Cenário 1: Marcar hábito como completo exibe animação visual
```gherkin
Dado que o hábito está incompleto (checkbox vazio)
Quando o usuário clica no checkbox
Então o checkbox anima para estado "completo" (~300ms)
E a cor muda (cinza → verde/primary color)
E um ícone de checkmark aparece com scale-up suave
```

### Cenário 2: Haptic feedback vibra o device ao marcar (Android)
```gherkin
Dado que o device físico suporta vibração
Quando o usuário marca/desmarca o hábito
Então o device vibra levemente (~50ms)
E a vibração ocorre antes da animação terminar
```

### Cenário 3: Browser/emulador sem suporte haptic — apenas visual
```gherkin
Dado que está em browser ou emulador sem vibrator
Quando usuário togla hábito
Então animação visual funciona normalmente
E nenhum erro é lançado por falta de haptic
E experiência não é degradada
```

### Cenário 4: Desmarcar hábito anima em reverso
```gherkin
Dado que hábito está completo (checkbox checked)
Quando usuário clica para desmarcar
Então animação inversa ocorre (~300ms)
E checkbox volta a vazio com transição suave
E haptic feedback vibra (padrão mais leve)
```

---

## Tarefas Técnicas

- [ ] Estender `HabitCardComponent` com animações CSS/Angular:
  - Animação de ícone: ellipse-outline → checkmark-circle (scale-up + fade)
  - Flash de cor: card background cinza → verde por 500ms
  - Duração: ~300ms
- [ ] Integrar `@capacitor/haptics`:
  - Marcar: `Haptics.impact({ style: ImpactStyle.Light })` ou `Haptics.vibrate({ duration: 50 })`
  - Desmarcar: `Haptics.vibrate({ duration: 30 })`
  - Try-catch: falha silenciosa em browser/emulador
- [ ] Verificar que `@capacitor/haptics` está em `package.json` (instalar se ausente)
- [ ] Testes unitários: animação triggered, haptic mockado, graceful degradation

---

## Fora do Escopo

- Padrões haptic customizáveis pelo usuário
- Múltiplas vibrações por badge milestone (coberto em US-H1.2)
- Sons de feedback (apenas visual + haptic)
- Animações de partículas ou efeitos complexos

---

## Especificações Técnicas

### Animação Angular

```typescript
// @Component animations array
trigger('completionState', [
  state('incomplete', style({ transform: 'scale(1)', opacity: 1 })),
  state('complete', style({ transform: 'scale(1)', opacity: 1 })),
  transition('incomplete => complete', [
    animate('150ms ease-out', style({ transform: 'scale(1.2)' })),
    animate('150ms ease-in')
  ]),
  transition('complete => incomplete', [
    animate('150ms ease-out', style({ transform: 'scale(0.9)' })),
    animate('150ms ease-in')
  ])
])
```

### Haptic pattern

| Ação | Método | Duração |
|------|--------|---------|
| Marcar como completo | `Haptics.impact({ style: ImpactStyle.Light })` | ~50ms |
| Desmarcar | `Haptics.vibrate({ duration: 30 })` | 30ms |

### Flash de cor no card

```scss
.habit-card.flash-complete {
  background-color: rgba(var(--ion-color-success-rgb), 0.15);
  transition: background-color 0.1s ease-in;
}
```

```typescript
// No método de toggle, após atualização:
this.isFlashing.set(true);
setTimeout(() => this.isFlashing.set(false), 500);
```

---

## Prompts para Claude Code

### Desenvolvedor

```
Tarefa: Implementar feedback visual + haptic ao toglar conclusão de hábito.

Contexto:
- Habit-tracker Android (Ionic 7 + Angular 17 + Capacitor 7)
- Objetivo: melhorar responsividade e satisfação ao marcar hábito diariamente
- HabitCardComponent em src/app/shared/components/habit-card/

Requisitos:

1. Feedback visual (HabitCardComponent):
   - Animação de ícone: transição de ellipse-outline para checkmark-circle em ~300ms
   - Transição de cor do ícone: cinza → primary color do design system
   - Flash verde no card: adicionar classe CSS temporária por 500ms via signal + setTimeout
   - Reverso ao desmarcar: animação inversa ~300ms
   - Usar @angular/animations: trigger, state, style, animate, transition no decorator @Component

2. Haptic feedback:
   - Instalar @capacitor/haptics se não estiver em package.json
   - import { Haptics, ImpactStyle } from '@capacitor/haptics'
   - Ao marcar: Haptics.impact({ style: ImpactStyle.Light })
   - Ao desmarcar: Haptics.vibrate({ duration: 30 })
   - Envolver em try-catch: se falhar (browser, emulador), não lançar erro

3. Timing:
   - Click → animação start + haptic simultâneos
   - Não bloquear UI durante toggle
   - Atualizar service ANTES da animação (otimistic UI)

4. Acessibilidade:
   - Checkbox/botão de toggle com aria-label descritivo
   - Não depender apenas de cor para comunicar estado

Critérios de sucesso:
- Animação renderiza em ~300ms ±50ms
- Haptic funciona em Android 11+ (testes manuais)
- Graceful fallback em browser (sem erros)
- Testes cobrindo: marca, desmarca, sem suporte haptic (mock)
- Build sem erros
- 60 fps durante animação

Comandos:
npm run test:single
npm run build
npm run build:android

Padrões:
- Standalone component
- Signals para controlar estado da animação (isFlashing: Signal<boolean>)
- import @angular/animations no @Component decorator
- Sem RxJS

Deliverables:
- src/app/shared/components/habit-card/habit-card.component.ts (atualizado)
- src/app/shared/components/habit-card/habit-card.component.html (atualizado)
- src/app/shared/components/habit-card/habit-card.component.scss (atualizado)
- src/app/shared/components/habit-card/habit-card.component.spec.ts (atualizado)
```

### QA

```
Tarefa: QA para Feedback Visual e Haptic (US-H1.3).

Testes manuais:

1. Animação visual — marcar como completo
   - Abrir home, ver lista de hábitos
   - Clicar checkbox de um hábito incompleto
   - Verificar: ícone anima suavemente para checkmark (~300ms)
   - Cor do ícone muda para verde/primary
   - Card pisca levemente em verde por ~500ms
   - Sem travamentos ou glitches
   - 60 fps (visualmente fluido)

2. Animação visual — desmarcar
   - Clicar novamente no hábito completo
   - Verificar: animação reversa (~300ms)
   - Ícone volta a outline/vazio
   - Cor volta a cinza/neutral

3. Haptic feedback — device físico (Android 11+)
   - Usar dispositivo Android físico (emulador pode não ter vibrator)
   - Abrir app
   - Toglar hábito para completo
   - Verificar: device vibra levemente (~50ms)
   - Ao desmarcar: vibração mais curta (~30ms) ou similar
   - Vibração ocorre DURANTE ou logo após o toque

4. Haptic feedback — emulador/browser (sem vibrator)
   - Abrir no emulador ou browser Chrome
   - Toglar hábito
   - Verificar: NENHUM erro no console (DevTools)
   - Animação visual ainda funciona normalmente
   - Sem mensagem de erro sobre haptics

5. Performance
   - Toglar múltiplos hábitos rapidamente (5 toques em 2 segundos)
   - Verificar: app não trava, animações são suaves
   - Em logcat: nenhum erro de ANR

6. Acessibilidade
   - Toggle tem aria-label legível
   - Estado do checkbox comunicado além de cor

Relatório:
- [ ] Animação visual renderiza ~300ms ±50ms
- [ ] Haptic vibra em device físico Android
- [ ] Sem erros em browser/emulador (graceful fallback)
- [ ] Performance OK (60 fps, sem ANR)
- [ ] Flash de cor visível e não irritante
- [ ] Acessível
```

---

## Checklist de PR

```markdown
## Linked Story
US-H1.3 — Feedback Visual e Haptic ao Toglar Hábito

## Changes
- HabitCardComponent: animações Angular adicionadas
- HabitCardComponent: flash de cor ao completar (500ms)
- @capacitor/haptics integrado com graceful fallback

## QA Checklist
- [ ] Animação visual funciona ao marcar/desmarcar
- [ ] Flash de cor visível (verde, 500ms)
- [ ] Haptic vibra em device físico Android
- [ ] Sem erros em browser/emulador
- [ ] Performance 60 fps
- [ ] Sem regressão no toggle de dados

## Test Results
npm run test:single: __/__ specs passing
npm run build: SUCCESS / ERROR
npm run build:android: SUCCESS / ERROR
```
