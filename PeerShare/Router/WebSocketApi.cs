using PeerShare.Services;

namespace PeerShare.Router;

public static class WebSocketApi
{
    public static void UseWebSocketApi(this IEndpointRouteBuilder routeBuilder)
    {
        var webSocketService = routeBuilder.ServiceProvider.GetRequiredService<WebSocketService>();
        
        routeBuilder.Map("/ws", webSocketService.HandleWebSocketConnection);
    }
}