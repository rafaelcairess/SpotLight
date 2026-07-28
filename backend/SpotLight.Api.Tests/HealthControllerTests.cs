// Importa OkObjectResult para conferir o resultado HTTP.
using Microsoft.AspNetCore.Mvc;

// Importa o contrato esperado no corpo da resposta.
using SpotLight.Api.Contracts;

// Importa o controller que será testado.
using SpotLight.Api.Controllers;

// Mantém o código de teste em um namespace separado da aplicação.
namespace SpotLight.Api.Tests;

// Agrupa os testes relacionados ao HealthController.
public sealed class HealthControllerTests
{
    // [Fact] informa ao xUnit que este método é um teste sem parâmetros.
    [Fact]

    // Nome no padrão Método_Cenário_ResultadoEsperado.
    public void Get_ReturnsHealthyServiceWithCurrentTime()
    {
        // Arrange: escolhe um horário fixo para o teste ser sempre reproduzível.
        var expectedTime = new DateTimeOffset(2026, 7, 23, 12, 0, 0, TimeSpan.Zero);

        // Arrange: cria o controller e injeta um relógio controlado.
        var controller = new HealthController(new FixedTimeProvider(expectedTime));

        // Act: executa o comportamento que queremos testar.
        var result = controller.Get();

        // Assert: confirma que o resultado HTTP é 200 OK.
        var ok = Assert.IsType<OkObjectResult>(result.Result);

        // Assert: confirma que o corpo possui o tipo esperado.
        var response = Assert.IsType<HealthResponse>(ok.Value);

        // Assert: confere cada informação importante da resposta.
        Assert.Equal("SpotLight.Api", response.Service);
        Assert.Equal("healthy", response.Status);
        Assert.Equal(expectedTime, response.Timestamp);
    }

    // Relógio falso disponível somente dentro desta classe de teste.
    // Recebe um valor no construtor primário e herda o contrato TimeProvider.
    private sealed class FixedTimeProvider(DateTimeOffset value) : TimeProvider
    {
        // "override" substitui o relógio real e sempre devolve o valor fixado.
        public override DateTimeOffset GetUtcNow() => value;
    }
}
