using System.Text.Json.Serialization;
using PeerShare.Models.WebSocketMessages;

namespace PeerShare;


[JsonSourceGenerationOptions(
    PropertyNameCaseInsensitive = true,
    UseStringEnumConverter = true,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    NumberHandling = JsonNumberHandling.AllowReadingFromString
    )]
[JsonSerializable(typeof(IWebSocketMessage))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}
