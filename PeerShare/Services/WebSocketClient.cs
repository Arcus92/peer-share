using System.Net.WebSockets;
using PeerShare.Models.WebSocketMessages;
using PeerShare.Utils;

namespace PeerShare.Services;

public class WebSocketClient : IDisposable
{
    /// <summary>
    /// The current open host id.
    /// </summary>
    private Guid? _hostId;
    
    /// <summary>
    /// The current RTC description.
    /// </summary>
    private string? _description;

    /// <summary>
    /// The list of ICE candidates.
    /// </summary>
    private readonly List<string> _iceCandidates = new();

    /// <summary>
    /// The connected server.
    /// </summary>
    private WebSocketClient? _partner;
    
    /// <summary>
    /// The web-socket service.
    /// </summary>
    private readonly WebSocketService _webSocketService;
    
    /// <summary>
    /// The web-socket connection.
    /// </summary>
    private readonly WebSocket _webSocket;

    public WebSocketClient(WebSocketService webSocketService, WebSocket webSocket)
    {
        _webSocketService = webSocketService;
        _webSocket = webSocket;
    }

    /// <summary>
    /// Sends a JSON message to this web-socket client.
    /// </summary>
    /// <param name="message">The message to send.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <typeparam name="T">The message type.</typeparam>
    private async Task SendAsync<T>(T message, CancellationToken cancellationToken = default) where T : IWebSocketMessage
    {
        var jsonTypeInfo = AppJsonSerializerContext.Default.IWebSocketMessage;
        await _webSocket.SendJsonAsync(message, jsonTypeInfo, cancellationToken);
    }

    /// <summary>
    /// Handles the client
    /// </summary>
    /// <param name="webSocketMessage"></param>
    /// <param name="cancellationToken"></param>
    public async Task HandleMessageAsync(IWebSocketMessage webSocketMessage, CancellationToken cancellationToken)
    {
        switch (webSocketMessage)
        {
            case OfferRequestMessage offerMessage:
                var hostId = _webSocketService.RegisterOffer(this);
                _hostId = hostId;
                _description = offerMessage.LocalDescription;
                await SendAsync(new OfferResponseMessage
                {
                    ConnectionId = hostId
                }, cancellationToken);
                break;
            
            case AddIceCandidateMessage addIceCandidateMessage:
                _iceCandidates.Add(addIceCandidateMessage.IceCandidate);
                break;
            
            case ConnectionRequestMessage connectionMessage:
                if (!_webSocketService.TryGetClientByHostId(connectionMessage.ConnectionId, out var host) ||
                    host._partner is not null || 
                    host._description is null || 
                    host._iceCandidates.Count == 0)
                {
                    await SendAsync(new ConnectionResponseMessage
                    {
                        Success = false
                    }, cancellationToken);
                    return;
                }

                _partner = host;
                host._partner = this;
                
                await SendAsync(new ConnectionResponseMessage
                {
                    Success = true,
                    RemoteDescription = host._description,
                    IceCandidates = host._iceCandidates.ToArray()
                }, cancellationToken);
                break;
            
            case AnswerRequestMessage answerMessage:
                if (_partner is null || _partner._webSocket.State != WebSocketState.Open)
                    return;
                
                await _partner.SendAsync(new AnswerResponseMessage
                {
                    RemoteDescription = answerMessage.LocalDescription,
                }, cancellationToken);
                break;
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_hostId.HasValue)
        {
            _webSocketService.RemoveOffer(_hostId.Value);
        }
    }
}