# Painel do administrador — B'M Custom

O que muda: a loja continua igual, mas produtos, stock, preços, definições e dados de pagamento passam a ser geridos
no painel, em `…/bm-custom/admin/`. Cada encomenda fica guardada, com o stock a descer sozinho.
Se o Supabase falhar ou estiver pausado, a loja abre com os ficheiros antigos e as encomendas seguem por WhatsApp como antes.

## 1. Supabase (grátis, sem cartão)
1. supabase.com > **New project** (um projeto só para o B'M Custom). Guarde a palavra-passe da base de dados.
2. **SQL Editor > New query**: cole o ficheiro `supabase/1-setup.sql` > **Run**. Depois cole `supabase/2-dados-atuais.sql` > **Run**.
   (O segundo carrega os 3 produtos, as definições e os dados de pagamento que já tem hoje.)
3. **Authentication > Users > Add user > Create new user**: e-mail e palavra-passe do administrador, com **Auto Confirm User**.
4. **SQL Editor**: abra `supabase/3-criar-administrador.sql`, troque o e-mail e **Run**. Deve aparecer 1 linha.
5. Recomendado: **Authentication > Sign In / Providers** e desligue "Allow new users to sign up".
6. **Project Settings > API**: copie o **Project URL** e a chave **anon public** (a `service_role` NUNCA).

## 2. Ligar o site
1. Abra `js/config.js` e cole o endereço e a chave (são públicos, podem ficar no site):
   `window.SUPABASE = { url: 'https://xxxx.supabase.co', key: 'eyJ...' };`
2. No GitHub (repositório `bm-custom`): **Add file > Upload files** e arraste:
   a pasta `admin`, a pasta `js` (só `main.js` e `config.js` mudam) e os 6 ficheiros `.html`.
   **Commit changes**. Espere 1 a 2 minutos.

## 3. Testar
1. Abra `https://d-augusto-service.github.io/bm-custom/admin/` e entre.
2. Na loja, faça uma encomenda de teste. No painel: Encomendas > veja-a > mude o estado > **Cancelar** (o stock volta).
3. Em Produtos, confirme o stock de cada produto (os números atuais vieram dos ficheiros).

## Notas
- Os preços e o stock são sempre calculados no servidor. O cliente não consegue alterar o preço.
- Cada telefone só pode ter 3 encomendas por pagar na última hora (contra abuso). Quem esgota o stock sem pagar: cancele no painel e o stock volta.
- Os dados de pagamento aparecem no site público, como já decidiu. Os ficheiros antigos (`js/produtos.js`, `js/dados.js`, `js/pagamento.js`) ficam como cópia de segurança.
- O Supabase gratuito pode pausar o projeto sem atividade (cerca de 1 semana). Se acontecer, entre no Supabase e clique em **Restore**. Entretanto a loja continua a abrir.
- O painel é só para uma conta. Para trocar de administrador, crie outra conta e repita o passo 4.
