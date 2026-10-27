-- Papéis: hoje só 'admin'. Quem não está na tabela é usuário comum.
create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin'))
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Admin inicial (Denisson Silva).
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'denisson.sillva@gmail.com'
on conflict (user_id) do nothing;

-- Preço por modelo (US$ por 1 milhão de tokens). Fonte: página do modelo na OpenAI, 2026-10-27.
create table public.model_pricing (
  model text primary key,
  usd_per_million_tokens numeric not null check (usd_per_million_tokens >= 0)
);
alter table public.model_pricing enable row level security;
revoke all on public.model_pricing from anon, authenticated;
insert into public.model_pricing (model, usd_per_million_tokens) values ('text-embedding-3-small', 0.02);

-- Uma linha por chamada à OpenAI. Só as Edge Functions (service role) gravam; ninguém lê direto.
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('indexing', 'search')),
  model text not null,
  tokens integer not null check (tokens >= 0),
  cost_usd numeric(18, 10) not null default 0,
  document_id uuid
);
alter table public.usage_events enable row level security;
revoke all on public.usage_events from anon, authenticated;
create index usage_events_created_at_idx on public.usage_events (created_at);
create index usage_events_user_created_idx on public.usage_events (user_id, created_at);

-- Congela o custo com o preço vigente no momento da chamada: mudar o preço depois não reescreve o histórico.
create function public.usage_events_set_cost()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.cost_usd := new.tokens * coalesce(
    (select p.usd_per_million_tokens from public.model_pricing p where p.model = new.model), 0
  ) / 1000000;
  return new;
end;
$$;
create trigger usage_events_set_cost before insert on public.usage_events
for each row execute function public.usage_events_set_cost();

-- Configurações editáveis pelo admin (hoje: orçamento mensal em US$, chave 'monthly_budget_usd').
create table public.app_settings (
  key text primary key,
  value numeric not null check (value >= 0)
);
alter table public.app_settings enable row level security;
create policy app_settings_read on public.app_settings for select to authenticated using (true);
create policy app_settings_admin_insert on public.app_settings for insert to authenticated with check ((select public.is_admin()));
create policy app_settings_admin_update on public.app_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
revoke all on public.app_settings from anon;

-- Série diária. scope 'all' = consumo geral (sem identificar quem gastou); 'mine' = só o do usuário logado.
create function public.usage_daily(p_from timestamptz, p_to timestamptz, p_scope text default 'all')
returns table (day date, kind text, tokens bigint, cost_usd numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select (e.created_at at time zone 'America/Sao_Paulo')::date as day,
         e.kind,
         sum(e.tokens)::bigint,
         sum(e.cost_usd)
  from public.usage_events e
  where e.created_at >= p_from and e.created_at < p_to
    and (p_scope = 'all' or e.user_id = (select auth.uid()))
    and (select auth.uid()) is not null
  group by 1, 2
  order by 1, 2;
$$;
revoke execute on function public.usage_daily(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.usage_daily(timestamptz, timestamptz, text) to authenticated;

-- Custo por usuário: só admin.
create function public.usage_by_user(p_from timestamptz, p_to timestamptz)
returns table (user_id uuid, name text, email text, tokens bigint, cost_usd numeric, indexing_cost_usd numeric, search_cost_usd numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores podem ver o custo por usuário.' using errcode = '42501';
  end if;
  return query
    select e.user_id,
           coalesce(p.name, split_part(u.email, '@', 1), 'Usuário removido'),
           u.email::text,
           sum(e.tokens)::bigint,
           sum(e.cost_usd),
           coalesce(sum(e.cost_usd) filter (where e.kind = 'indexing'), 0),
           coalesce(sum(e.cost_usd) filter (where e.kind = 'search'), 0)
    from public.usage_events e
    left join auth.users u on u.id = e.user_id
    left join public.profiles p on p.id = e.user_id
    where e.created_at >= p_from and e.created_at < p_to
    group by e.user_id, p.name, u.email
    order by sum(e.cost_usd) desc;
end;
$$;
revoke execute on function public.usage_by_user(timestamptz, timestamptz) from public, anon;
grant execute on function public.usage_by_user(timestamptz, timestamptz) to authenticated;
