# Plano de melhoria de design: RAG Docs

Data: 2026-10-27 · Status: Todas as fases concluídas em 2026-10-27 (ver o resultado do QA no fim do documento) · Escopo: identidade visual, tema claro/escuro, linguagem e acessibilidade das telas atuais. Nenhum código foi alterado por este documento.

## 1. Resumo e objetivos

Hoje o app tem só a estrutura das telas. Não há cor de marca, a tipografia é a padrão do shadcn, o tema escuro existe no CSS mas ninguém consegue ligá-lo, e a interface fala a língua de quem constrói o sistema (chunk, overlap, tokens, top-k) para um público leigo.

Objetivos:

1. **Identidade acolhedora**: azul `#44A8FF`, Geist, muito respiro, cantos arredondados, sombras suaves.
2. **Tema claro e escuro** com um switcher visível, respeitando a preferência do sistema.
3. **Linguagem de gente**: sem jargão na interface principal; erros que dizem o que houve e o que fazer.
4. **Acessibilidade AA** nos dois temas, com alvos de toque confortáveis e foco bem visível.

### Decisões já tomadas

| Tema | Decisão |
| --- | --- |
| Público | Leigo |
| Estética | Limpa e acolhedora |
| Cor de marca | `#44A8FF` |
| Contraste | Dois tons de azul: `#44A8FF` como marca; azul mais escuro derivado dele para botões com texto branco e links |
| Fonte | Geist (já instalada) |
| Tema | Claro + escuro com switcher |
| Linguagem | Trocar jargão por palavras simples |
| Erros | Empáticos, com próximo passo; sem códigos nem texto cru da API |
| Referência visual | Google Drive (lista de arquivos clara, ícone por tipo, status visível) |

## 2. Diagnóstico do estado atual

**Tokens e tema** ([src/index.css](../src/index.css))
- Todos os tokens são cinzas puros (chroma 0). A única cor é `--destructive`.
- `--chart-*` não é usado. `--sidebar-primary` no escuro é azul/roxo e não combina com nada.
- Não há tokens de sucesso, aviso ou informação.
- `.dark` está completo, mas **nada aplica a classe**: sem provider, sem switcher, sem script anti-flash, sem `color-scheme`, sem `theme-color`. O `Toaster` ([src/app/providers.tsx](../src/app/providers.tsx)) também não recebe o tema.
- Fonte única (Geist); não há fonte mono declarada, mas o app usa `font-mono` em alguns números.

**Layout** ([src/components/layout/](../src/components/layout/))
- `AppShell`: sidebar a partir de `md`, barra superior no mobile; item ativo quase invisível (`bg-muted` sobre `bg-sidebar`); nome do usuário escondido no mobile; sem "pular para o conteúdo".
- `AuthLayout`: logo fora de landmark de cabeçalho.
- `FormField`: não liga o erro ao campo (sem `aria-invalid` nem `aria-describedby`).
- `RouteGuards`: "Carregando…" em texto puro, sem spinner nem `role="status"`.

**Telas** ([src/features/](../src/features/))
- Documentos: tabela de 8 colunas que rola na horizontal no celular; ícones de ação de 28 px; motivo da falha e motivo de "desabilitado" só em `title` (não funciona em toque nem teclado); "Pronto" em preto; lista atualiza a cada 2 s sem avisar leitores de tela.
- Upload: dropzone com `input` escondido e só um link pequeno focável; botões de preset sem foco forte; texto cheio de jargão.
- Busca: erro em texto vermelho simples; `aria-label` com "top-k"; nota do resultado como número cru (`0.87`); destaque amarelo por palavra (única cor fixa no código).
- Auth: a confirmação de e-mail aparece como erro vermelho, embora seja uma boa notícia; sem mostrar/ocultar senha.

**Componentes** ([src/components/ui/](../src/components/ui/)): 14 componentes shadcn base-nova, quatro sem uso (dialog, dropdown-menu, separator, textarea). Faltam Alert, Tooltip, Progress.

## 3. Identidade visual

### 3.1 Paleta

O azul `#44A8FF` sobre branco dá só **2,5:1**, abaixo dos 4,5:1 exigidos para texto. Por isso ele é a cor de **marca** (destaques, ícones, fundos suaves, foco no escuro) e nunca texto nem fundo de botão com texto branco no tema claro. Para ações e links usa-se um azul mais escuro da mesma família. Neutros levemente azulados combinam com a marca.

| Papel | Claro | Escuro |
| --- | --- | --- |
| Marca | `#44A8FF` | `#44A8FF` (7,3:1 sobre `#0E141B`) |
| Ação (botão com texto branco, links) | `#0A62B3` (6,2:1 com branco); hover `#084E8F` | botão `#44A8FF` com texto `#0E141B` (7,3:1) |
| Fundo da página | `#F6F9FC` | `#0E141B` |
| Cartão | `#FFFFFF` | `#151D27` |
| Texto | `#0B1B2B` | `#E8EEF5` |
| Texto secundário | `#5B6B7C` (5,5:1) | `#9AA9B9` (7,7:1) |
| Tinta de marca (fundo suave, item ativo) | `#E8F4FF`, com texto `#0A62B3` (5,5:1) | `#44A8FF` a 14% sobre o cartão |
| Sucesso | `#1B7F4B` (5,0:1) | `#4ADE80` (10,6:1) |
| Erro | `#C0362C` (5,5:1) | `#FF8A80` (8,1:1) |
| Aviso | `#8A5A00` (5,9:1) | `#FBBF24` (11,1:1) |
| Borda decorativa | `#D5DEE8` | `#263341` |
| Borda de campo (≥ 3:1) | `#7C8DA0` (3,4:1) | `#5C6E82` (3,2:1) |
| Destaque do termo buscado (`--highlight`) | `#FFE68A` com texto `#0B1B2B` (14,1:1) | `#5A4A10` com texto `#E8EEF5` (7,4:1) |

Texto escuro sobre `#44A8FF` dá 6,9:1, então a marca também funciona como fundo de selos pequenos com texto `#0B1B2B`. Todos os valores acima foram calculados e já estão em `src/index.css` (Fase 1).

### 3.2 Tipografia

- **Geist Variable** para tudo (já instalada via `@fontsource-variable/geist`).
- **Geist Mono** (novo, `@fontsource-variable/geist-mono`) só para números e pontuações.
- Base de **16 px**; nada abaixo de 13 px (hoje há `text-xs` de 12 px).
- Escala: h1 28/34 semibold · h2 20/28 · corpo 16/24 · secundário 14/20.
- Títulos com `text-wrap: balance`; `tabular-nums` em tamanhos, datas e contagens.

### 3.3 Forma e profundidade

- Raio base **12 px** (`--radius: 0.75rem`), campos 10 px, contêineres grandes 16 px.
- Sombras suaves de duas camadas no lugar do anel cinza (`ring-1 ring-foreground/10`) dos cartões.
- Botões de 40 px de altura; alvos de toque de **44 px**.
- Ícones lucide com traço 1,75; círculos de tinta de marca atrás dos ícones dos estados vazios.

### 3.4 Movimento

- 150 ms, apenas `transform` e `opacity`; nunca `transition: all`.
- Respeitar `prefers-reduced-motion`; nada em loop acima de 5 s sem controle.
- Spinner no lugar do texto "Carregando…".

## 4. Tema claro e escuro, com switcher

- **ThemeProvider** com `claro | escuro | sistema` (padrão: sistema). Aplica a classe `dark` em `<html>`; persiste em `localStorage` dentro de `try/catch` e funciona sem ele.
- **Sem flash**: script inline no [index.html](../index.html) lê a preferência antes da primeira pintura.
- `color-scheme` e `<meta name="theme-color">` acompanham o tema; selects nativos recebem fundo e texto explícitos.
- `Toaster` (sonner) recebe o tema atual.
- **Switcher**: no header do `AppShell`, entre o nome do usuário e "Sair", usando o `DropdownMenu` que já existe (sol, lua, monitor), com rótulo acessível e foco visível. Também no canto do `AuthLayout`, para quem ainda não entrou.
- Limpar `--sidebar-*` e `--chart-*` para a nova paleta; trocar `yellow-200` do `ResultCard` por `--highlight`.

## 5. Linguagem para leigos

### 5.1 Glossário

| Hoje | Proposta |
| --- | --- |
| chunk / chunks | trecho / trechos |
| overlap / sobreposição | repetição entre trechos |
| tokens | esconder; mostrar "≈ N palavras" (1 token ≈ ¾ de palavra) e deixar "tokens" só em dica |
| top-k / "Quantidade de trechos (top-k)" | "Quantidade de resultados" |
| Fatiamento / Estratégia | "Como dividir o texto" |
| Tamanho fixo / Por parágrafo / Semântico | "Em partes iguais" / "Respeitando parágrafos" / "Agrupando frases" (o modo semântico hoje agrupa frases; o nome atual promete mais do que entrega) |
| Documento longo / Técnico / Conversacional | "Textos longos (relatórios, contratos)" / "Manuais e documentação" / "Perguntas e respostas (FAQs)" |
| Reprocessar | "Processar de novo", com dica do que faz |
| Processando / Pronto / Falhou | "Preparando…" / "Pronto para buscar" / "Não foi possível ler" |
| "Cada chunk vira um vetor…" | remover; explicar o efeito: "Trechos menores acham respostas mais precisas; trechos maiores guardam mais contexto." |
| Nota `0.87` | etiqueta "Muito relevante / Relevante / Pouco relevante" com barra. Faixas a calibrar com documentos reais (nos testes, bons resultados ficaram perto de 0,5 e o corte é 0,3) |
| "6 de 10 trechos" | "Mostrando 6 de até 10 resultados" |

### 5.2 Erros e avisos

Regra: **o que aconteceu + o que fazer**. Sem códigos, sem inglês, sem texto cru do Supabase ou do Postgres. O detalhe técnico vai para o console.

| Hoje | Proposta |
| --- | --- |
| "Nenhum texto encontrado no arquivo (PDF escaneado?)" | "Não conseguimos ler o texto deste PDF. Ele parece ser uma imagem escaneada. Envie uma versão em texto." |
| "Tempo esgotado no processamento. Reprocesse o documento." | "O processamento demorou mais que o esperado. Toque em Processar de novo." |
| "Arquivo enviado, mas o processamento não pôde ser iniciado." | "O arquivo foi salvo, mas ainda não começou a ser preparado. Tente Processar de novo." |
| "Conta criada. Confirme o e-mail…" (hoje em vermelho) | Aviso informativo: "Quase lá! Enviamos um link para o seu e-mail. Abra-o para entrar." |
| "E-mail ou senha inválidos." | "E-mail ou senha incorretos. Confira os dados ou crie uma conta." |
| "Só quem enviou o documento pode excluí-lo." | Botão desabilitado com explicação visível: "Só quem enviou pode excluir." |
| `e.message` cru nos toasts; erro de variável de ambiente em `client.ts` | Mensagem fixa e amigável; log técnico no console |
| Busca: texto vermelho simples | Alerta com ícone e botão "Tentar de novo" |

Estilo de texto: títulos e botões em Title Case com verbo específico ("Enviar documento", não "Enviar"), reticências `…` e aspas curvas, segunda pessoa e voz ativa. Centralizar todos os textos em um módulo único (por exemplo `src/lib/copy.ts`) para trocar o tom em um só lugar.

## 6. Plano por tela

### AppShell e navegação
- Item ativo com fundo de tinta de marca e barra lateral de 3 px; logo na cor da marca.
- Header com menu do usuário (o avatar abre um `DropdownMenu` com nome, tema e Sair).
- Link "Pular para o conteúdo" e nome do usuário visível no mobile.

### Login e Cadastro
- Marca no topo e `h1` correto; mostrar/ocultar senha; dica da regra da senha antes do erro.
- `autocomplete`, `name` e `inputmode` corretos; foco no primeiro erro; `aria-invalid` e `aria-describedby` (corrigindo o `FormField`).
- Confirmação de e-mail como `Alert` informativo, não como erro.

### Documentos (referência: Google Drive)
- Lista com ícone por tipo (PDF vermelho, DOCX azul, TXT/MD neutro), nome e uma linha de metadados: tamanho · quem enviou · data.
- Menos colunas: nome, status, trechos, ações. **Cartões empilhados no celular** em vez de tabela com rolagem.
- Selo de status com cor e ícone: verde (pronto), azul girando (preparando), vermelho (não foi possível ler).
- Motivo da falha **visível na própria linha**, com o botão "Processar de novo".
- Ações com `Tooltip` e alvo de 44 px; região `aria-live` anunciando mudanças de status.
- Estado vazio com um ícone grande e um único botão.

### Upload
- Dropzone inteira clicável e focável; depois da escolha, chip do arquivo com ícone, nome, tamanho e opção de trocar ou remover.
- Presets como cartões com ícone e uma frase de uso; "Ajustes avançados" recolhido, com rótulos simples.
- Prévia "Como o texto será dividido" com exemplo legível; barra de progresso do envio; aviso ao sair com alterações não salvas.

### Busca
- Campo em destaque; na tela vazia, centralizado e com exemplos de perguntas.
- Seletor "Quantidade de resultados"; cartões com nome do documento, etiqueta de relevância e trecho com destaque por frase em vez de palavra a palavra.
- Estados de vazio, erro e carregamento seguindo o mesmo padrão visual da lista de documentos.

## 7. Componentes novos ou ajustados

- **Novos**: `Alert`, `Tooltip`, `Progress`, `Spinner`, `ThemeToggle`, `FileTypeIcon`, `RelevanceBadge`, `DocumentCard` (mobile).
- **Ajustes**: variantes sucesso/aviso/informação em `Badge`; `Button` com 40 px e foco forte; `FormField` ligando erro e campo.
- Os quatro componentes sem uso só saem se continuarem sem uso depois da implementação (o `dropdown-menu` passa a ser usado pelo switcher).

## 8. Metas de acessibilidade

- Contraste AA nos dois temas: 4,5:1 para texto, 3:1 para componentes e foco.
- Anel de foco de 2 px na cor de ação, com 2 px de recuo; nunca remover contorno sem substituto.
- Alvos de toque ≥ 44 px; nada que dependa só de `title`.
- `aria-live` em status e resultados; um `h1` por página; ordem de foco lógica.
- Zoom liberado e `prefers-reduced-motion` respeitado.

## 9. Apêndice: achados da revisão pelas Web Interface Guidelines

Revisão por arquivo (os números de linha são confirmados na implementação).

- [src/components/layout/FormField.tsx](../src/components/layout/FormField.tsx): erro sem `aria-invalid` e `aria-describedby`.
- [src/features/documents/FileDropzone.tsx](../src/features/documents/FileDropzone.tsx): `input` `sr-only` sem foco visível; área não clicável; erro não associado.
- [src/features/documents/ChunkingFields.tsx](../src/features/documents/ChunkingFields.tsx): botões de preset e "Avançado" sem `:focus-visible` próprio; jargão em `font-mono`.
- [src/features/documents/DocumentsPage.tsx](../src/features/documents/DocumentsPage.tsx): botões de ícone de 28 px; motivo de "desabilitado" só em `title`; sem `aria-live` para status.
- [src/features/documents/StatusBadge.tsx](../src/features/documents/StatusBadge.tsx): causa da falha só em `title`.
- [src/features/search/SearchPage.tsx](../src/features/search/SearchPage.tsx): `aria-label` com "top-k"; erro sem recuperação; placeholder sem reticências.
- [src/features/search/ResultCard.tsx](../src/features/search/ResultCard.tsx): `mark` por palavra; cor fixa no código; nota sem rótulo visível.
- [src/components/layout/RouteGuards.tsx](../src/components/layout/RouteGuards.tsx): "Carregando…" sem `role="status"` nem spinner.
- [src/components/layout/AppShell.tsx](../src/components/layout/AppShell.tsx): item ativo de baixo contraste; sem link para pular ao conteúdo; nome oculto no mobile.
- [src/app/providers.tsx](../src/app/providers.tsx) e [index.html](../index.html): `Toaster` sem tema; sem `color-scheme`, `theme-color` nem script anti-flash.
- [src/services/supabase/](../src/services/supabase/) e [src/features/auth/](../src/features/auth/): mensagens técnicas ou em inglês chegando ao usuário.

## 10. Roadmap em fases

Cada fase é entregável e verificável por conta própria.

1. **Fundação (concluída)**: tokens e paleta nos dois temas, Geist Mono, `ThemeProvider`, script anti-flash, `theme-color`, `Toaster` com tema.
2. **Casca (concluída)**: `AppShell` e `AuthLayout` com switcher, menu do usuário, link para pular ao conteúdo, item ativo.
3. **Componentes (concluída)**: `Alert`, `Tooltip`, `Progress`, `Spinner` e correção do `FormField`.
4. **Telas (concluída)**, nesta ordem: Documentos (concluída) → Upload (concluída) → Busca (concluída) → Login e Cadastro (concluída).
5. **Texto (concluída)**: glossário e tabela de erros aplicados a partir de um módulo único de textos.
6. **QA (concluída)**: acessibilidade e visual.

## 11. Verificação

- Capturas nos dois temas em 375, 768 e 1280 px.
- Navegação apenas por teclado e teste com leitor de tela nos status.
- Auditoria de acessibilidade do Lighthouse ≥ 95.
- Reexecutar a skill `web-design-guidelines` nos arquivos do apêndice e zerar os achados.
- `tsc -b` e `oxlint` sem erros.
- Contrastes da paleta: todos calculados na Fase 1; recalcular se algum valor mudar.

## 12. Fora de escopo e decisões em aberto

- Tradução para outros idiomas; ilustrações personalizadas; logo definitivo.
- Paginação, ordenação e filtro da lista de documentos.
- "Esqueci a senha" e indicador de força de senha.
- Faixas finais da etiqueta de relevância (dependem de testar com documentos reais e variados).

## 13. Resultado do QA (Fase 6)

Verificado em 2026-10-27 no navegador, com a conta de teste local.

**Passou**
- Tema claro e escuro nas telas de Documentos, Upload, Busca, Login e Cadastro; troca pelo seletor e pelo padrão "sistema", sem piscar ao carregar.
- Largura de celular (390 px) em Documentos, Upload e Busca, sem rolagem horizontal.
- Navegação só por teclado: primeiro o link "Pular para o conteúdo", depois menu lateral, tema e conta, sempre com o anel de foco visível.
- Erros de formulário ligados ao campo (`aria-invalid` e `aria-describedby`); mensagens de erro e de aviso com próximo passo.
- Revisão pelas Web Interface Guidelines aplicada ao que o código permitia: `transition-all` removido do `Badge`, `touch-action: manipulation`, `overscroll-behavior` nos diálogos e listas, aspas curvas nas frases, espaço não separável entre número e unidade, `autocomplete="off"` nos campos numéricos.

**Não feito ou com ressalva**
- **Lighthouse**: não rodei a auditoria; a meta de 95 continua pendente.
- **Leitor de tela**: não testado de verdade; só conferi as regiões `aria-live` e os rótulos no código e no navegador.
- **Confirmação de e-mail no cadastro**: o aviso verde só foi verificado no código, porque o projeto de teste não exige confirmação.
- **Estado de erro da busca** ("Tentar de novo"): conferido no código, não provocado no navegador.
- **Desvios deliberados das diretrizes**: títulos e botões ficam em português com maiúscula só na primeira palavra (Title Case não se usa em pt-BR), e os exemplos de e-mail nos campos não terminam em reticências.
- **Barra de progresso do envio** é indeterminada; mostrar a porcentagem real exigiria trocar a forma de enviar o arquivo.
- As faixas da etiqueta de relevância continuam provisórias.
