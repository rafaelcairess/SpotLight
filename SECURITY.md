# Segurança

## Versão suportada

O branch `main` é a única versão atualmente mantida do SpotLight.

## Como relatar uma vulnerabilidade

Não abra uma issue pública e não inclua chaves, tokens, senhas ou dados pessoais.
Use **Security > Report a vulnerability** no repositório do GitHub para enviar um
relato privado com o impacto, os passos para reprodução e a correção sugerida, se
houver.

## Segredos e dados públicos

- O navegador recebe somente a URL e a chave publicável do Supabase.
- Chaves da Steam e credenciais de serviço ficam em Supabase Edge Function
  Secrets ou GitHub Actions Secrets.
- A chave `service_role` nunca deve ser prefixada com `VITE_`, incluída no
  repositório ou enviada ao navegador.
- As tabelas e o Storage usam Row Level Security (RLS); uma chave publicável não
  substitui essas políticas.

## Alerta conhecido do React Router

O SpotLight usa React Router como SPA Vite, sem React Server Components, Server
Actions ou Framework Mode. O alerta `GHSA-qwww-vcr4-c8h2`, restrito ao modo RSC,
não é alcançável nesta arquitetura. A versão 7.18.1 foi mantida porque o downgrade
sugerido automaticamente reintroduz vulnerabilidades aplicáveis a uma SPA.
