// Contracts agrupa os formatos de entrada e saída da API.
namespace SpotLight.Api.Contracts;

// "public" permite uso por controllers e testes.
// "sealed" impede herança e "record" representa dados imutáveis comparáveis por valor.
public sealed record HealthResponse(
    // Nome da aplicação que respondeu.
    string Service,

    // Situação informada pela aplicação.
    string Status,

    // Momento da resposta, incluindo o offset do fuso horário.
    DateTimeOffset Timestamp);
