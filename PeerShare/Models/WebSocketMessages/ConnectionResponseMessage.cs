namespace PeerShare.Models.WebSocketMessages;

[Serializable]
public class ConnectionResponseMessage : IWebSocketMessage
{
    /// <summary>
    /// Gets and sets if the connection request was successful.
    /// </summary>
    public required bool Success { get; set; }

    /// <summary>
    /// Gets and sets the remote RTC description for the requested connection.
    /// </summary>
    public string RemoteDescription { get; set; } = "";

    /// <summary>
    /// Gets and sets the list of ICE candidates.
    /// </summary>
    public string[] IceCandidates { get; set; } = [];
}