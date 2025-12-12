using System.Text.Json.Serialization.Metadata;

namespace PeerShare.Utils;

public static class HttpClientExtension
{
    public static async Task<T?> GetFromJsonAsync<T>(this HttpClient httpClient, HttpRequestMessage request, JsonTypeInfo<T> jsonTypeInfo)
    {
        var response = await httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync(jsonTypeInfo);
    }
}