namespace PeerShare.Models.WebSocketMessages;

[Serializable]
public class OfferRequestMessage : IWebSocketMessage
{
    /// <summary>
    /// Gets and sets the local RTC description.
    /// </summary>
    public required string LocalDescription { get; set; }
}