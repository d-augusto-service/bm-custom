-- Torna uma conta administradora do painel.
-- 1) Primeiro crie a conta: Supabase > Authentication > Users > Add user > Create new user
--    (e-mail + palavra-passe, e marque "Auto Confirm User").
-- 2) Troque o e-mail abaixo pelo e-mail dessa conta e execute (Run).
insert into public.admins (user_id)
select id from auth.users where email = 'COLOQUE-AQUI-O-EMAIL-DO-ADMINISTRADOR'
on conflict do nothing;

-- Confirmação: deve aparecer 1 linha.
select a.user_id, u.email from public.admins a join auth.users u on u.id = a.user_id;
