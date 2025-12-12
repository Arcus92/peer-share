namespace PeerShare.Models.WebSocketMessages;

[Serializable]
public class AnswerResponseMessage : IWebSocketMessage
{
    /// <summary>
    /// Gets and sets the remote RTC description for an incoming connection.
    /// </summary>
    public required string RemoteDescription { get; set; }
}