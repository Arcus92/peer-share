namespace PeerShare.Models.WebSocketMessages;

[Serializable]
public class AnswerRequestMessage : IWebSocketMessage
{
    /// <summary>
    /// Gets and sets the answer RTC description.
    /// </summary>
    public required string LocalDescription { get; set; }
}