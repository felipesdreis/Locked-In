# US-H1.1 — Onboarding Interativo para Novos Usuários

**Horizonte:** H1 — Retenção e Engajamento  
**Estimativa:** 8 story points | **Valor:** Alto  
**OKR relacionado:** OKR-1.1 (Retenção D7 ≥ 55%), OKR-1.4 (Avg hábitos ≥ 2.5)

---

## User Story

**Como** novo usuário,  
**Quero** entender como usar o Locked In em < 2 minutos,  
**Para que** eu não abandone o app no primeiro acesso por falta de clareza.

---

## Critérios de Aceite (Gherkin)

### Cenário 1: Novo usuário vê tutorial ao abrir o app pela primeira vez
```gherkin
Dado que a app é aberta pela primeira vez (sem hábitos existentes)
Quando o splash screen desaparece
Então uma modal de onboarding é exibida (não pode ser pulada sem clique)
E a modal tem 3 telas com setas de navegação (anterior/próxima)
E cada tela ocupa 100% da largura com conteúdo centralizado
```

### Cenário 2: Tutorial explica os 3 pilares em linguagem clara
```gherkin
Dado que o usuário está na tela 1 do tutorial
Quando lê o conteúdo
Então vê ícone + título + texto explicando "Crie um hábito"
E tela 2 explica "Marque cada dia que você completa"
E tela 3 explica "Seu streak cresce — vire uma máquina com Locked In"
E o tom é motivacional mas não hiperbólico
```

### Cenário 3: Usuário conclui o tutorial e acessa o app
```gherkin
Dado que o usuário está na tela 3 do tutorial
Quando clica botão "Começar"
Então o tutorial fecha e vai para Home (vazio ou com hábitos existentes)
E aparece um ícone de ajuda (?) no header da Home
E ao clicar no ícone, o mesmo tutorial reabre
```

### Cenário 4: Usuário que já tem hábitos não vê tutorial
```gherkin
Dado que existem ≥ 1 hábito no banco de dados
Quando a app abre
Então o tutorial não é mostrado (bypass automático)
E a Home exibe a lista normal
```

---

## Tarefas Técnicas

- [ ] Criar componente standalone `OnboardingTutorialComponent` com 3 slides (Angular)
  - Localização: `src/app/features/onboarding/onboarding-tutorial.component.ts`
- [ ] Adicionar signal em `HabitService` para rastrear `onboardingCompleted` (flag em localStorage)
  - Chave: `locked_in_onboarding_done`
- [ ] Integrar tutorial em `AppComponent` (verifica flag + ausência de hábitos antes de renderizar Home)
- [ ] Ícone de ajuda (?) em header da `HomePage` — ao clicar, reabre `OnboardingTutorialComponent`
- [ ] Telas do tutorial: ionicons padrão + textos em PT-BR
- [ ] Navegação com swipe horizontal ou botões anterior/próxima
- [ ] Testes unitários: novo usuário → tutorial exibido, com hábitos → bypass, reabre via ícone (?)

---

## Fora do Escopo

- Vídeos de demonstração (apenas estático)
- Animações complexas (fade-in simples é suficiente)
- Localização além de PT-BR (coberta em US-H1.5)
- Personalização do tutorial por idioma

---

## Especificações de UI

### Conteúdo das 3 telas

| Tela | Ícone (ionicon) | Título | Texto |
|------|----------------|--------|-------|
| 1 | `add-circle-outline` | Crie um hábito | Escolha uma atividade que quer manter — exercício, leitura, meditação. Dê um nome e defina a frequência. |
| 2 | `checkmark-circle-outline` | Marque cada dia | Todo dia que você completa, marque no app. Simples assim. Um toque e está feito. |
| 3 | `flame-outline` | Seu streak cresce | Dias consecutivos formam um streak. Quanto mais você mantém, mais difícil fica de quebrar. Locked In. |

### Layout geral
- Modal fullscreen (100% width, 100% height)
- Fundo: `--ion-background-color`
- Indicador de passo: 3 bolinhas (•) na parte inferior, bolinha ativa destacada
- Botão "Começar" visível apenas na tela 3
- Botão "Pular" (texto, sem destaque) nas telas 1 e 2

---

## Prompts para Claude Code

### Desenvolvedor

```
Tarefa: Implementar onboarding interativo em 3 telas para o Locked In.

Contexto:
- Stack: Ionic 7 + Angular 17 (standalone components) + Capacitor 7 + SQLite
- App é habit-tracker local-first, sem backend
- Objetivo: novo usuário entende em < 2 min como usar o app (reduzir churn D1)

Requisitos:
1. Componente standalone OnboardingTutorialComponent com 3 telas navegáveis
   - Tela 1: "Crie um hábito" (ícone add-circle-outline + texto motivacional)
   - Tela 2: "Marque cada dia" (ícone checkmark-circle-outline + explicação do toggle)
   - Tela 3: "Seu streak cresce" (ícone flame-outline + explicação de recompensa)
   - Navegação com botões anterior/próxima + swipe horizontal (IonSlides ou custom)
   - Botão "Começar" na tela 3 que fecha o tutorial
   - Botão "Pular" nas telas 1 e 2

2. Integração em fluxo de app:
   - Detectar "novo usuário": sem hábitos + flag onboardingCompleted=false em localStorage
   - Chave localStorage: locked_in_onboarding_done
   - Exibir tutorial em AppComponent após splash, antes de Home
   - Bypass automático se ≥ 1 hábito existir
   - Ícone (?) no header da HomePage que reabre tutorial

3. Estilos:
   - Modal ou page fullscreen
   - 100% width em cada tela, centralizado
   - Indicador de passo (3 bolinhas)
   - Textos em português brasileiro
   - Consistência com design system do app (cores, fontes, espaçamento)
   - Ionicons padrão (não ícones complexos)

Critérios de sucesso:
- Tutorial renderiza sem erros em browsers e Android 11+
- Navegação (anterior/próxima/swipe) funciona em ambos
- Flag é persistido e bypass funciona quando hábito existe
- Ícone (?) em Home reabre tutorial
- Todos os textos em português
- Testes unitários: happy path + edge cases (sem hábitos, com hábitos, pular tutorial)

Comandos de validação:
npm run test:single
npm run build
npm run build:android

Padrões do projeto:
- Componentes standalone com signals
- Ionicons registrados em constructor via addIcons()
- Ion components importados de @ionic/angular/standalone
- Sem RxJS observables (só signals)
- Sem arrow functions em templates Angular

Deliverables:
- src/app/features/onboarding/onboarding-tutorial.component.ts
- src/app/features/onboarding/onboarding-tutorial.component.html
- src/app/features/onboarding/onboarding-tutorial.component.scss
- src/app/features/onboarding/onboarding-tutorial.component.spec.ts
- Integração em AppComponent (condicional)
- Ícone (?) em HomePageComponent
```

### QA

```
Tarefa: QA para Onboarding Interativo (US-H1.1).

Cenários de teste manual (Android device/emulador e browser):

1. Novo usuário — tutorial exibido
   - Limpar dados da app (Settings → Apps → Locked In → Clear Storage) ou usar browser em aba anônima
   - Abrir app
   - Verificar: tutorial aparece imediatamente após splash
   - Clicar anterior/próxima: navegação funciona em ambas as direções
   - Verificar textos em português em todas as 3 telas
   - Indicador de passo (bolinhas) muda conforme navegação

2. Usuário com hábitos — tutorial não exibido
   - App com ≥ 1 hábito criado
   - Fechar e reabrir app
   - Verificar: Home aparece sem tutorial
   - Clicar ícone (?) no header → tutorial reabre
   - Fechar tutorial → volta para Home

3. Botão "Pular" e "Começar"
   - Tela 1 ou 2: clicar "Pular" → tutorial fecha
   - Tela 3: clicar "Começar" → tutorial fecha e exibe Home

4. Swipe navigation
   - Fazer swipe left (próxima tela)
   - Fazer swipe right (voltar para tela anterior)
   - Verificar: transição suave, sem travaras

5. Persistência (localStorage)
   - Completar tutorial no primeiro acesso
   - Fechar app completamente
   - Reabrir app → Home deve aparecer direto (sem tutorial repetido)

6. Edge case: badge de 1 hábito criado
   - Começar tutorial, pular/fechar
   - Criar um hábito na Home
   - Fechar app
   - Reabrir → Home com hábito (bypass tutorial automático)

7. Textos e formatação
   - Verificar se há truncamento de texto em telas pequenas (devices 4.5-5")
   - Verificar alinhamento centralizado nas 3 telas
   - Verificar cores contrastam bem (WCAG AA)

Relatório esperado:
- [ ] Tutorial exibido para novo usuário
- [ ] Bypass para usuário com hábitos
- [ ] Navegação (botões + swipe) funciona
- [ ] Flag persistida (não reaparece ao reabrir)
- [ ] Ícone (?) em Home reabre tutorial
- [ ] Textos 100% em PT-BR
- [ ] Sem erros no console (Chrome DevTools ou adb logcat)
```

---

## Checklist de PR

```markdown
## Linked Story
US-H1.1 — Onboarding Interativo para Novos Usuários

## Changes
- OnboardingTutorialComponent adicionado em src/app/features/onboarding/
- Flag onboardingCompleted em localStorage (locked_in_onboarding_done)
- Integração em AppComponent (conditionally rendered)
- Ícone (?) em HomePageComponent header

## QA Checklist
- [ ] Novo usuário vê tutorial ao abrir
- [ ] Tutorial pode ser pulado (botão "Pular")
- [ ] Botão "Começar" fecha corretamente
- [ ] Ícone (?) em Home reabre tutorial
- [ ] Com ≥ 1 hábito, tutorial não aparece
- [ ] Flag persiste entre sessões
- [ ] Sem erros em logcat/console

## Test Results
npm run test:single: __/__ specs passing
npm run build: SUCCESS / ERROR
npm run build:android: SUCCESS / ERROR
```
