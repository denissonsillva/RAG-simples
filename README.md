# RAG Docs

Sistema web de RAG: as pessoas enviam documentos (PDF, Word, Excel, PowerPoint, CSV, XML, TXT, MD), escolhem como o texto é fatiado, e depois fazem perguntas em linguagem natural que devolvem os trechos mais relevantes. Os documentos são compartilhados entre todos os usuários logados.

**Stack:** React 19 + Vite + TypeScript, shadcn/ui (base-nova) + Tailwind v4, TanStack Query, react-hook-form + zod. Backend em Supabase: Auth, Storage, Postgres com pgvector, Edge Functions e pg_cron. Embeddings pela OpenAI (`text-embedding-3-small`, 1536 dimensões).

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a publishable key do projeto Supabase
npm run dev                  # http://localhost:5173
npm run build                # tsc -b + vite build
npm run lint                 # oxlint
```

O `.env.local` fica fora do git. Variáveis do front:

| Variável | Onde achar |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | mesma tela (chave publishable/anon, nunca a service role) |

Segredo das Edge Functions (não vai no front): `OPENAI_API_KEY`, em Dashboard → Edge Functions → Secrets, ou `supabase secrets set OPENAI_API_KEY=...`.

## Arquitetura

```
src/
  services/            # única fronteira com o backend; as telas só conhecem estas interfaces
    index.ts           # escolhe a implementação (hoje: Supabase)
    types.ts           # User, Document, ChunkingConfig, SearchResult...
    supabase/          # auth, documents, search
    mock/              # implementação da fase 1 (localStorage), mantida como referência
  features/            # auth, documents (lista/upload/fatiamento), search
  components/          # ui (shadcn) e layout
supabase/functions/
  process-document/    # extrai, fatia, gera embeddings
  search-documents/    # embedding da pergunta + busca por similaridade
```

Trocar mock por Supabase foi só mudar o `services/index.ts`: as telas não mudaram.

---

# Guia de construção (etapas)

Cada etapa lista o que foi feito, as decisões e como conferir. O projeto Supabase é `rag-ibe-ia` (`xlgwxipitxpnsokiychq`, região `sa-east-1`). Tudo no banco foi aplicado como migração pelo MCP do Supabase, seguindo o skill `supabase-postgres-best-practices`.

## Etapa 1: telas com dados mockados

- Telas: Login, Cadastro, Upload com configuração de fatiamento, Lista de documentos e Busca.
- Tudo atrás de `AuthService`, `DocumentService` e `SearchService` (em `src/services`), com implementação mock em `localStorage`.
- Upload: presets de fatiamento (Documento longo 1000 tokens/15%, Técnico 500/20%, Conversacional 300/10%) mais campos avançados, com pré-visualização dos chunks. Limites: 20 MB, extensões pdf, docx, xlsx, pptx, csv, xml, txt e md (os formatos antigos .xls, .ppt e .doc são recusados com orientação para converter).
- Lista acompanha sozinha (polling de 2 s) enquanto houver documento em `processing`.

## Etapa 2: Auth no Supabase

- `supabaseAuthService` com e-mail e senha. Se o projeto exigir confirmação de e-mail, o cadastro avisa em vez de logar.
- Tabela `public.profiles` (`id` → `auth.users`, `name`), criada por trigger `handle_new_user` (`security definer`, `search_path = ''`) a partir do `name` enviado no cadastro.
- RLS: todo usuário logado lê `profiles`; só o dono atualiza (`(select auth.uid()) = id`).

## Etapa 3: documentos de verdade

**Banco** (`documents`, `document_chunks`, extensão `vector` no schema `extensions`):

- `documents`: nome, mime, tamanho, `uploaded_by` (→ `profiles`), `storage_path`, `status` (`processing`/`ready`/`failed`), `error`, a config de fatiamento escolhida (`chunk_strategy`, `chunk_size`, `chunk_overlap`) e `chunk_count`.
- `document_chunks`: `document_id` (cascade), `chunk_index`, `content`, `embedding vector(1536)`, índice HNSW com `vector_cosine_ops`.
- Padrão de dono: **todos leem**, só o dono insere e apaga (`(select auth.uid()) = uploaded_by`). O insert exige `status = 'processing'`, `chunk_count = 0` e `storage_path` começando com o uid.
- Índices nas colunas de FK e de ordenação usadas pela lista.

**Storage:** bucket privado `documents` (20 MB). Objeto em `<uid>/<document_id>/<arquivo>`; as policies de insert/select/delete exigem o uid na primeira pasta.

**Fluxo de upload** (`documents.supabase.ts`): sobe o arquivo → insere a linha → chama a função `process-document`. Se o insert falhar, o arquivo é removido. Excluir apaga a linha primeiro (RLS) e só então o arquivo, então quem não é dono não apaga nada.

**Edge Function `process-document`** (`verify_jwt`, CORS, confere que quem chamou é o dono):

1. Responde 202 e continua em segundo plano (`EdgeRuntime.waitUntil`).
2. Baixa o arquivo com a service role e extrai o texto: PDF com `unpdf`; DOCX, XLSX e PPTX lendo o XML interno do zip com `fflate`; CSV, XML, TXT e MD direto (o CSV aceita `,` `;` e tabulação, em UTF-8 ou Windows-1252). Planilhas e CSV viram "Coluna: valor; Coluna: valor" por linha, com o nome da aba; PPTX vira "Slide N" mais as notas; XML vira "elemento: valor". A extração fica em `supabase/functions/process-document/extract.ts`.
3. Fatia: tamanho e sobreposição em tokens (≈ 4 caracteres por token, a mesma conta do preview). `fixed` = janelas fixas; `paragraph` = junta parágrafos até o tamanho; `semantic` = agrupa frases (não há modelo de tópicos por trás). Limite de 2000 chunks por documento.
4. Gera embeddings em lotes de 100 e grava os chunks.
5. Marca `ready` com `chunk_count`, ou `failed` com a mensagem de erro (e apaga chunks parciais).

Falta de `OPENAI_API_KEY` vira `failed` com mensagem clara; o motivo aparece ao passar o mouse no selo de status.

**Como conferir:** envie um PDF em `/documentos/novo`; a linha deve ir de "Processando" a "Pronto" com a contagem de chunks.

## Etapa 4: reprocessar e timeout

- Policy de UPDATE só do dono, com **grant por coluna** (`update (status)`) e `with check (status = 'processing')`. O cliente só consegue reenfileirar; `ready`, `failed`, `error` e `chunk_count` são exclusivos da Edge Function.
- Botão de reprocessar (ícone de reciclar) à esquerda da lixeira. Reusa a configuração de fatiamento salva. Fica desabilitado para quem não enviou o arquivo e enquanto o documento está em processamento. A lixeira segue a mesma regra.
- Timeout: coluna `processing_started_at` (reiniciada por trigger ao voltar para `processing`) e um job pg_cron a cada minuto que marca como `failed` o que passou de 5 minutos em `processing`.

## Etapa 5: busca semântica

- Função SQL `public.match_chunks(query_embedding, match_count, min_similarity)`: similaridade de cosseno (`1 - (embedding <=> consulta)`), só documentos `ready`. `security invoker`, então respeita o RLS de quem chama. A subconsulta ordena só pela distância (usa o índice HNSW) e o filtro vem depois, com margem de 4x. Execução revogada de `public`/`anon`.
- Edge Function `search-documents` (`verify_jwt`, CORS): valida a pergunta (até 500 caracteres), gera o embedding com o mesmo modelo da indexação, chama `match_chunks` com o JWT do usuário e devolve `{ results: [{ chunkId, documentId, documentName, snippet, score }] }`.
- Corte de similaridade em **0,3**: nos testes, trechos relevantes ficaram perto de 0,5 e uma pergunta sem relação (receita de bolo) deu 0,21. Ajuste `min_similarity` se mudar de modelo ou de tipo de documento.
- **Top-k:** a tela de busca tem um seletor ao lado do campo (3, 5, 10 ou 20 trechos; padrão 5). O valor vai como `topK` para a função, que limita entre 1 e 20, e `match_chunks` aplica o mesmo teto (50 no SQL). Trocar o seletor depois de uma busca refaz a busca com o novo limite. Se houver menos trechos acima do corte de similaridade do que o top-k pedido, voltam menos resultados, e a tela mostra quantos vieram, por exemplo "6 de 10 trechos".
- Front: `supabaseSearchService` chama a função com `{ query, topK }`.

**Como conferir:** com um documento "Pronto", pergunte algo com outras palavras ("posso trabalhar de casa?" acha o trecho sobre trabalho remoto). Uma pergunta fora do assunto deve voltar vazia.

---

# Design

A identidade visual (azul `#44A8FF`, Geist, tema claro e escuro, linguagem para leigos) está descrita e justificada em [docs/plano-de-melhoria-de-design.md](docs/plano-de-melhoria-de-design.md). Em resumo:

- Cores e tema em `src/index.css` (tokens) e `src/app/theme/` (claro, escuro ou igual ao dispositivo, com script anti-flash no `index.html`).
- Textos que a pessoa lê, incluindo mensagens de erro, em `src/lib/copy.ts`.
- Componentes novos em `src/components/ui/`: `alert`, `tooltip`, `progress`, `spinner`, `password-input`, `file-type-icon`.

# Operação

**Deploy das funções** (qualquer um): pelo MCP do Supabase (`deploy_edge_function`) ou `supabase functions deploy process-document search-documents`. Ambas usam `verify_jwt = true`.

**Migrações:** já aplicadas no projeto (`list_migrations`); não há pasta `supabase/migrations` no repositório ainda.

**Conta de teste:** crie uma pela tela de cadastro em ambiente local. Não commite credenciais.

# Limitações conhecidas e próximos passos

- Não há OCR: PDF escaneado vira `failed` ("nenhum texto encontrado").
- Documentos grandes dependem do limite de tempo/memória da Edge Function; o limite de 2000 chunks evita estourar custo.
- A busca devolve trechos, não uma resposta gerada. Gerar a resposta com um LLM a partir dos trechos seria a próxima etapa.
- Versionar as migrações em `supabase/migrations` e habilitar a proteção contra senhas vazadas no Auth (aviso do advisor de segurança).
