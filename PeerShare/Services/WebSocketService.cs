using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;
using System.Net.WebSockets;
using PeerShare.Models.WebSocketMessages;
using PeerShare.Utils;

namespace PeerShare.Services;

public class WebSocketService(ILogger<WebSocketService> logger)
{
    /// <summary>
    /// The current list of active clients.
    /// </summary>
    private readonly ConcurrentDictionary<Guid, WebSocketClient> _clientByHostId = new();

    /// <summary>
    /// Registers a new connection offer and returns the host-id.
    /// </summary>
    /// <param name="client">The client to register.</param>
    /// <returns>Returns the new host id.</returns>
    public Guid RegisterOffer(WebSocketClient client)
    {
        var hostId = Guid.NewGuid();
        _clientByHostId.TryAdd(hostId, client);
        return hostId;
    }

    /// <summary>
    /// Removes the client offer.
    /// </summary>
    /// <param name="hostId">The host id to remove.</param>
    public void RemoveOffer(Guid hostId)
    {
        _clientByHostId.TryRemove(hostId, out _);
    }
    
    /// <summary>
    /// Tries to get the client with the given id.
    /// </summary>
    /// <param name="clientId">The client id.</param>
    /// <param name="client">Returns the client.</param>
    /// <returns>Returns true, if the client was found.</returns>
    public bool TryGetClientByHostId(Guid clientId, [MaybeNullWhen(false)] out WebSocketClient client)
    {
        return _clientByHostId.TryGetValue(clientId, out client);
    }
    
    /// <summary>
    /// Handle an incoming web socket connection.
    /// </summary>
    /// <param name="context">The http context.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    public async Task HandleWebSocketConnection(HttpContext context, CancellationToken cancellationToken)
    {
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        using var client = new WebSocketClient(this, webSocket);
        
        logger.LogInformation("Starting WebSocket connection: {identifier}", context.TraceIdentifier);

        var typeInfo = AppJsonSerializerContext.Default.IWebSocketMessage;
        while (!cancellationToken.IsCancellationRequested)
        {
            var message = await webSocket.ReceiveJsonAsync<IWebSocketMessage>(typeInfo, cancellationToken);
            if (message is null) continue;

            logger.LogInformation("Received message: {type} from {identifier}", message.GetType().Name, context.TraceIdentifier);
            await client.HandleMessageAsync(message, cancellationToken);
        }

        if (webSocket.State == WebSocketState.CloseReceived)
        {
            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed", cancellationToken);
        }

        logger.LogInformation("Ending WebSocket connection: {identifier}", context.TraceIdentifier);
    }
    
}