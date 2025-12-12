namespace PeerShare.Models.WebSocketMessages;

[Serializable]
public class OfferResponseMessage : IWebSocketMessage
{
    /// <summary>
    /// Gets and sets the connection id.
    /// </summary>
    public required Guid ConnectionId { get; set; }
}