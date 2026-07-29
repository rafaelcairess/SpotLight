// Importa o método AddSupabaseAuthentication criado dentro do projeto.
using SpotLight.Api.Authentication;

// WebApplication é a classe central do ASP.NET Core.
// CreateBuilder lê argumentos do terminal, appsettings.json e variáveis de ambiente.
// O builder configura tudo que a API precisa antes de ser iniciada.
var builder = WebApplication.CreateBuilder(args);

// Registra suporte a Controllers na injeção de dependência.
// Sem isso, classes marcadas com [ApiController] não seriam encontradas.
builder.Services.AddControllers();

// Permite que o ASP.NET encontre e descreva as rotas da aplicação.
builder.Services.AddEndpointsApiExplorer();

// Registra o Swagger/OpenAPI, usado para documentar e testar as rotas.
builder.Services.AddSwaggerGen();

// Registra respostas no formato Problem Details para erros inesperados.
// Esse é um formato HTTP padronizado, em vez de devolver stack traces ao cliente.
builder.Services.AddProblemDetails();

// Registra o relógio real como uma única instância durante a execução.
// TimeProvider pode ser substituído por um relógio falso nos testes.
builder.Services.AddSingleton(TimeProvider.System);

// Configura a validação dos tokens do Supabase e a política de usuário autenticado.
// A API usa somente as chaves públicas do JWKS; nenhum segredo entra no código.
builder.Services.AddSupabaseAuthentication(builder.Configuration);

// Lê Cors:AllowedOrigins do appsettings.json e converte o valor para string[].
// Se a configuração não existir, "?? []" fornece uma lista vazia em vez de null.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

// Registra o serviço de CORS, que controla quais sites podem chamar a API no navegador.
builder.Services.AddCors(options =>
{
    // Cria uma política chamada "Frontend"; esse nome será usado mais abaixo.
    options.AddPolicy("Frontend", policy =>
    {
        // WithOrigins exige pelo menos um endereço, portanto verificamos a lista.
        if (allowedOrigins.Length > 0)
        {
            // Autoriza somente os domínios configurados.
            // Os domínios poderão enviar qualquer cabeçalho e verbo HTTP.
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
        }
    });
});

// Constrói a aplicação depois que todos os serviços foram registrados.
var app = builder.Build();

// Converte exceções não tratadas em uma resposta Problem Details genérica.
// Detalhes internos ficam nos logs do servidor e não são vazados para o navegador.
app.UseExceptionHandler();

// Habilita a documentação interativa somente no ambiente de desenvolvimento.
if (app.Environment.IsDevelopment())
{
    // Gera o documento OpenAPI que descreve as rotas.
    app.UseSwagger();

    // Cria a página visual do Swagger no navegador.
    app.UseSwaggerUI();
}

// Aplica a política CORS "Frontend" a cada requisição.
app.UseCors("Frontend");

// Lê e valida o Bearer token antes de executar os controllers protegidos.
app.UseAuthentication();

// Verifica se o usuário autenticado cumpre a política exigida pela rota.
app.UseAuthorization();

// Conecta [Route], [HttpGet] e outros atributos dos controllers às rotas HTTP.
app.MapControllers();

// Inicia o servidor e mantém o processo aguardando requisições.
app.Run();

// Program seria uma classe interna gerada por este estilo de arquivo.
// Torná-la pública permite que futuros testes iniciem toda a API em memória.
public partial class Program;
