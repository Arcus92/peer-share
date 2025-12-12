namespace PeerShare.Models.WebSocketMessages;

[Serializable]
public class AddIceCandidateMessage : IWebSocketMessage
{
    /// <summary>
    /// Gets and sets the ICE candidate.
    /// </summary>
    public required string IceCandidate { get; set; }
}