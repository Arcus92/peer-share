namespace PeerShare.Router;

public static class Api
{ 
    public static void UseApi(this IEndpointRouteBuilder routeBuilder)
    {
        var api = routeBuilder.MapGroup("/api");
        
        api.MapFallback(() => Results.NotFound());
    }
}