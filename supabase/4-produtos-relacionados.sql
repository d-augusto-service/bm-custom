-- B'M Custom · Etapa 4 · «Ver mais modelos» (produtos relacionados)
-- Seguro: só CRIA uma tabela nova. Não apaga nem altera produtos, variantes, encomendas ou definições.
-- Pode ser executado mais do que uma vez sem problema.
-- Execute DEPOIS de 1-setup.sql (e 2-dados-atuais.sql).

create table if not exists public.produtos_relacionados (
  produto_id     bigint not null references public.produtos(id) on delete cascade,
  relacionado_id bigint not null references public.produtos(id) on delete cascade,
  ordem          integer not null default 0,
  criado_em      timestamptz not null default now(),
  primary key (produto_id, relacionado_id),            -- impede relações duplicadas
  constraint relacionado_diferente check (produto_id <> relacionado_id)  -- impede relação consigo próprio
);
create index if not exists produtos_relacionados_ordem_idx on public.produtos_relacionados (produto_id, ordem);

alter table public.produtos_relacionados enable row level security;

drop policy if exists rel_ler on public.produtos_relacionados;
drop policy if exists rel_admin on public.produtos_relacionados;

-- Visitantes: só veem relações em que AMBOS os produtos estão publicados. O administrador vê tudo.
create policy rel_ler on public.produtos_relacionados for select to anon, authenticated
  using (
    (select public.is_admin())
    or (exists (select 1 from public.produtos a where a.id = produto_id     and a.publicado)
    and exists (select 1 from public.produtos b where b.id = relacionado_id and b.publicado))
  );

-- Só o administrador autenticado cria, altera ou remove.
create policy rel_admin on public.produtos_relacionados for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.produtos_relacionados from anon;
grant select on public.produtos_relacionados to anon;
grant select, insert, update, delete on public.produtos_relacionados to authenticated;

-- Guarda a lista completa de relacionados de um produto, de uma só vez (tudo ou nada).
-- p_ids = ids pela ordem de apresentação. p_reciproco = true → cada relacionado também passa a sugerir este produto (sem apagar nada nos outros).
create or replace function public.admin_guardar_relacionados(p_produto bigint, p_ids bigint[], p_reciproco boolean default false)
returns integer language plpgsql security definer set search_path = public as $$
declare ids bigint[] := '{}'; x bigint; n integer := 0;
begin
  if not public.is_admin() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if not exists (select 1 from produtos where id = p_produto) then raise exception 'Produto não encontrado.'; end if;
  foreach x in array coalesce(p_ids, '{}') loop
    if x is null or x = p_produto or x = any(ids) then continue; end if;      -- ignora vazio, o próprio e repetidos
    if not exists (select 1 from produtos where id = x) then raise exception 'Produto relacionado inexistente.'; end if;
    ids := ids || x;
  end loop;
  if array_length(ids, 1) > 24 then raise exception 'Máximo de 24 produtos relacionados.'; end if;
  delete from produtos_relacionados where produto_id = p_produto;
  for i in 1 .. coalesce(array_length(ids, 1), 0) loop
    insert into produtos_relacionados (produto_id, relacionado_id, ordem) values (p_produto, ids[i], i);
    n := n + 1;
    if p_reciproco then
      insert into produtos_relacionados (produto_id, relacionado_id, ordem)
      values (ids[i], p_produto, coalesce((select max(ordem) from produtos_relacionados where produto_id = ids[i]), 0) + 1)
      on conflict do nothing;
    end if;
  end loop;
  return n;
end $$;

revoke all on function public.admin_guardar_relacionados(bigint, bigint[], boolean) from public, anon;
grant execute on function public.admin_guardar_relacionados(bigint, bigint[], boolean) to authenticated;
