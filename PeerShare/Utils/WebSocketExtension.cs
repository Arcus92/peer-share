using System.Buffers;
using System.Diagnostics.CodeAnalysis;
using System.Net.WebSockets;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace PeerShare.Utils;

public static class WebSocketExtension
{
    [RequiresDynamicCode("")]
    [RequiresUnreferencedCode("")]
    public static void MapWebSocket(this IEndpointRouteBuilder routeBuilder, [StringSyntax("Route")] string pattern, Delegate requestDelegate)
    {
        var requestDelegateResult = RequestDelegateFactory.Create(requestDelegate);
        
        routeBuilder.Map(pattern, async (HttpContext context, CancellationToken cancellationToken) =>
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                context.Response.StatusCode = 400;
                return;
            }
            
            using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
            await requestDelegateResult.RequestDelegate(context);
        });
    }
    
    /// <summary>
    /// The internal buffer size.
    /// </summary>
    private const int BufferSize = 1024;
    
    extension(WebSocket webSocket)
    {
        /// <summary>
        /// Receives a binary message from the web-socket connection as memory stream.
        /// </summary>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>Returns the memory stream.</returns>
        private async Task<MemoryStream> ReceiveMemoryStreamAsync(CancellationToken cancellationToken = default)
        {
            var buffer = ArrayPool<byte>.Shared.Rent(BufferSize);
            try
            {
                var memoryStream = new MemoryStream();
                WebSocketReceiveResult result;

                do
                {
                    result = await webSocket.ReceiveAsync(buffer, cancellationToken);
                    await memoryStream.WriteAsync(buffer.AsMemory(0, result.Count), cancellationToken);
                } while (!result.EndOfMessage);

                memoryStream.Seek(0, SeekOrigin.Begin);
                return memoryStream;
            }
            finally
            {
                ArrayPool<byte>.Shared.Return(buffer);
            }
        }
        
        /// <summary>
        /// Receives a text message from a web-socket connection.
        /// </summary>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>Returns the text message.</returns>
        public async Task<string> ReceiveTextAsync(CancellationToken cancellationToken = default)
        {
            using var memoryStream = await webSocket.ReceiveMemoryStreamAsync(cancellationToken);
            using var reader = new StreamReader(memoryStream);
            return await reader.ReadToEndAsync(cancellationToken);
        }

        /// <summary>
        /// Receives a JSON message from a web-socket connection 
        /// </summary>
        /// <param name="jsonTypeInfo">The JSON type info used to deserialize the message.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <typeparam name="T">The serialize type.</typeparam>
        /// <returns>Returns the deserialized message object.</returns>
        public async Task<T?> ReceiveJsonAsync<T>(JsonTypeInfo<T> jsonTypeInfo,
            CancellationToken cancellationToken = default)
        {
            using var memoryStream = await webSocket.ReceiveMemoryStreamAsync(cancellationToken);
            if (memoryStream.Length == 0) return default;
            return await JsonSerializer.DeserializeAsync(memoryStream, jsonTypeInfo, cancellationToken);
        }


        /// <summary>
        /// Sends the given memory stream to the web-socket connection.
        /// </summary>
        /// <param name="memoryStream">The memory stream to send.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        private async Task SendMemoryStreamAsync(MemoryStream memoryStream,
            CancellationToken cancellationToken = default)
        {
            var buffer = memoryStream.ToArray();
            await webSocket.SendAsync(buffer, WebSocketMessageType.Text, endOfMessage: true, cancellationToken);
        }
        
        /// <summary>
        /// Sends a text message to the web-socket connection.
        /// </summary>
        /// <param name="text">The text to send.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        public async Task SendTextAsync(string text, CancellationToken cancellationToken = default)
        {
            using var memoryStream = new MemoryStream();
            await using var writer = new StreamWriter(memoryStream);
            await writer.WriteAsync(text);
            await writer.FlushAsync(cancellationToken);
            memoryStream.Seek(0, SeekOrigin.Begin);
            await webSocket.SendMemoryStreamAsync(memoryStream, cancellationToken);
        }

        /// <summary>
        /// Sets a JSON message to the web-socket connection.
        /// </summary>
        /// <param name="message">The message object.</param>
        /// <param name="jsonTypeInfo">The JSON type info to serialize the object.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <typeparam name="T">The serialize type.</typeparam>
        public async Task SendJsonAsync<T>(T message, JsonTypeInfo<T> jsonTypeInfo, CancellationToken cancellationToken = default)
        {
            using var memoryStream = new MemoryStream();
            await JsonSerializer.SerializeAsync(memoryStream, message, jsonTypeInfo, cancellationToken);
            memoryStream.Seek(0, SeekOrigin.Begin);
            await webSocket.SendMemoryStreamAsync(memoryStream, cancellationToken);
        }
    }
}