# Como a autenticação funciona na API C#

Esta etapa ainda usa o Supabase Auth para login. Isso evita duplicar contas
enquanto migramos o restante do backend gradualmente. A diferença é que agora a
API C# consegue conferir sozinha se o usuário está autenticado.

## O caminho de uma requisição

```text
Usuário faz login
        |
        v
Supabase entrega um access token JWT
        |
        v
Frontend envia Authorization: Bearer <token>
        |
        v
Middleware JwtBearer valida assinatura, emissor, público e validade
        |
        v
Política SupabaseAuthenticatedUser verifica sub e role
        |
        v
MeController executa GET /api/me
```

## O que é JWT?

JWT significa JSON Web Token. Ele possui três partes:

```text
cabeçalho.dados.assinatura
```

- O cabeçalho informa o algoritmo e qual chave assinou o token.
- Os dados, chamados de claims, contêm informações como usuário e validade.
- A assinatura permite detectar qualquer alteração feita depois da emissão.

Um token não é uma senha criptografada. O conteúdo pode ser lido pelo navegador;
a segurança está na assinatura e no uso de HTTPS. Portanto, nunca devemos colocar
senhas ou segredos dentro das claims.

## Por que a API não precisa da chave secreta?

O projeto Supabase assina tokens com ES256. A chave privada permanece no
Supabase, enquanto uma chave pública fica disponível no endpoint JWKS:

```text
https://bqdrlvxijhlxtioikwhh.supabase.co/auth/v1/.well-known/jwks.json
```

A chave pública confirma assinaturas, mas não consegue criar tokens falsos.
Assim, o backend não precisa receber `service_role` nem o segredo JWT.

## Arquivos desta etapa

### `Authentication/SupabaseAuthSettings.cs`

Representa a configuração `SupabaseAuth` de forma tipada. Se o endereço não for
HTTPS ou o público estiver vazio, a API recusa iniciar.

### `Authentication/SupabaseAuthenticationExtensions.cs`

Configura o middleware `JwtBearer`. Ele verifica:

- assinatura usando o JWKS público;
- `iss`, que precisa apontar para o projeto correto;
- `aud`, que precisa ser `authenticated`;
- `exp`, impedindo tokens expirados;
- algoritmo, aceitando somente ES256 ou RS256;
- política que exige `sub` e `role=authenticated`.

Também transforma falhas em respostas `401` e `403` padronizadas, sem revelar
detalhes internos da validação.

### `Controllers/MeController.cs`

Só é executado depois da autenticação. Lê as claims já verificadas e devolve um
`CurrentUserResponse`. O controller não recebe `user_id` do corpo ou da URL;
usa sempre o `sub` assinado, evitando que alguém se passe por outro usuário.

### `Contracts/CurrentUserResponse.cs`

Define o JSON devolvido ao frontend. Esse contrato impede que o controller
retorne acidentalmente o token completo ou metadados desnecessários.

### `MeControllerTests.cs`

Possui dois tipos de teste:

1. teste unitário, que confere como claims confiáveis viram uma resposta;
2. teste de integração, que inicia a API em memória e confirma que `/api/me`
   devolve `401` quando não existe um Bearer token.

## Autenticação e autorização não são a mesma coisa

- Autenticação: comprova quem é o usuário.
- Autorização: decide o que esse usuário pode fazer.

O middleware autentica. A policy e futuramente as regras de cada serviço
autorizam. Um usuário autenticado, por exemplo, não deve poder editar o perfil
de outra pessoa.

## Próxima conexão do quebra-cabeça

Depois desta base, podemos adicionar PostgreSQL e Entity Framework Core. A rota
`/api/me/profile` usará o `sub` validado para buscar o perfil no banco, sem
aceitar um identificador escolhido pelo navegador.
