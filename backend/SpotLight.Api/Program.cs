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

// Registra o relógio real como uma única instância durante a execução.
// TimeProvider pode ser substituído por um relógio falso nos testes.
builder.Services.AddSingleton(TimeProvider.System);

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

// Ativa a etapa que verificará autorização quando adicionarmos usuários e políticas.
app.UseAuthorization();

// Conecta [Route], [HttpGet] e outros atributos dos controllers às rotas HTTP.
app.MapControllers();

// Inicia o servidor e mantém o processo aguardando requisições.
app.Run();

// Program seria uma classe interna gerada por este estilo de arquivo.
// Torná-la pública permite que futuros testes iniciem toda a API em memória.
public partial class Program;
