namespace PeerShare.Models.WebSocketMessages;

[Serializable]
public class ConnectionRequestMessage : IWebSocketMessage
{
    /// <summary>
    /// Gets and sets the connection id to connect.
    /// </summary>
    public required Guid ConnectionId { get; set; }
}