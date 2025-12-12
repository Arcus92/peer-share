using System.Text.Json.Serialization;

namespace PeerShare.Models.WebSocketMessages;

[JsonDerivedType(typeof(OfferRequestMessage), "offerRequest")]
[JsonDerivedType(typeof(OfferResponseMessage), "offerResponse")]
[JsonDerivedType(typeof(AddIceCandidateMessage), "addIceCandidate")]
[JsonDerivedType(typeof(ConnectionRequestMessage), "connectionRequest")]
[JsonDerivedType(typeof(ConnectionResponseMessage), "connectionResponse")]
[JsonDerivedType(typeof(AnswerRequestMessage), "answerRequest")]
[JsonDerivedType(typeof(AnswerResponseMessage), "answerResponse")]
public interface IWebSocketMessage
{
}