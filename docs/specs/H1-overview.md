# Horizonte H1 — Retenção e Engajamento

**Período:** Jun–Jul 2026 (Meses 1–2 pós-MVP)  
**Status:** Pronto para desenvolvimento  
**Fonte:** roadmap-evolutivo.md §2

---

## OKRs

| OKR | Meta | Baseline |
|-----|------|---------|
| OKR-1.1 Retenção D7 | ≥ 55% | ~40% |
| OKR-1.2 Retenção D30 | ≥ 35% | ~15% |
| OKR-1.3 Rating Play Store | ≥ 4.0 ⭐ (20+ reviews) | — |
| OKR-1.4 Avg hábitos/usuário | ≥ 2.5 | — |

---

## User Stories

| ID | Título | Pontos | Valor |
|----|--------|--------|-------|
| [US-H1.1](US-H1.1-onboarding-interativo.md) | Onboarding Interativo para Novos Usuários | 8 | Alto |
| [US-H1.2](US-H1.2-badges-milestone.md) | Badges Discretos de Milestone | 5 | Alto |
| [US-H1.3](US-H1.3-feedback-haptic.md) | Feedback Visual e Haptic ao Toglar Hábito | 3 | Médio |
| [US-H1.4](US-H1.4-compartilhar-streak.md) | Compartilhar Streak (Geração Local) | 8 | Alto |
| [US-H1.5](US-H1.5-localizacao-ptbr.md) | Localização PT-BR Completa | 5 | Médio |

**Total estimado:** 29 story points (~2 semanas para dev + QA)

---

## Ordem sugerida de desenvolvimento

1. **US-H1.5** (Localização PT-BR) — base para todas as strings das outras stories  
2. **US-H1.1** (Onboarding) — maior impacto em D1/D7  
3. **US-H1.3** (Feedback haptic) — menor escopo, pode ser paralelo  
4. **US-H1.2** (Badges) — depende de streak logic existente  
5. **US-H1.4** (Compartilhar) — maior escopo, entregar por último  

---

## Dependências técnicas

- US-H1.2 depende de `HabitService.toggleCompletion()` refatorado (já existe)
- US-H1.3 requer `@capacitor/haptics` (instalar)
- US-H1.4 requer `@capacitor/share` (instalar) + Canvas API
- US-H1.5 requer `@ngx-translate/core` (instalar)

---

## Critérios de Pronto (Definition of Done) por story

Cada story considera-se pronta quando:

- [ ] Código implementado e commitado
- [ ] Testes unitários passando (`npm run test:single`)
- [ ] Build web sem erros (`npm run build`)
- [ ] Build Android sem erros (`npm run build:android`)
- [ ] QA checklist da story executado em emulador/device Android 11+
- [ ] Nenhum erro em logcat/console
- [ ] Code review aprovado via PR
