namespace PeerShare.Models.WebSocketMessages;

[Serializable]
public class ConnectionResponseMessage : IWebSocketMessage
{
    /// <summary>
    /// Gets and sets the remote RTC description for the requested connection.
    /// </summary>
    public required string RemoteDescription { get; set; }
    
    /// <summary>
    /// Gets and sets the list of ICE candidates.
    /// </summary>
    public required string[] IceCandidates { get; set; }
}