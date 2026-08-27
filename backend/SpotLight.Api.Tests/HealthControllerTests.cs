using Microsoft.AspNetCore.Mvc;
using SpotLight.Api.Contracts;
using SpotLight.Api.Controllers;
namespace SpotLight.Api.Tests;

public sealed class HealthControllerTests
{
    [Fact]
    public void Get_ReturnsHealthyServiceWithCurrentTime()
    {
        var expectedTime = new DateTimeOffset(2026, 7, 23, 12, 0, 0, TimeSpan.Zero);
        var controller = new HealthController(new FixedTimeProvider(expectedTime));
        var result = controller.Get();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<HealthResponse>(ok.Value);
        Assert.Equal("SpotLight.Api", response.Service);
        Assert.Equal("healthy", response.Status);
        Assert.Equal(expectedTime, response.Timestamp);
    }
    private sealed class FixedTimeProvider(DateTimeOffset value) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => value;
    }
}
