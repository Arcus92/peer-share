FROM alpine AS base
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS dotnet
FROM node:24.0.0-alpine AS node

# Image for .NET AOT build tools
FROM mcr.microsoft.com/dotnet-buildtools/prereqs:alpine-3.22-amd64 AS build

# Copy .NET SDK binaries
COPY --from=dotnet /usr/share/dotnet /usr/share/dotnet
RUN ln -s /usr/share/dotnet/dotnet /usr/bin/dotnet
ENV DOTNET_NOLOGO=true

# Copy Node binaries
COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/bin /usr/local/bin
COPY --from=node /usr/local/include /usr/local/include

# Building AOT
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["PeerShare/PeerShare.csproj", "PeerShare/"]
RUN dotnet restore "PeerShare/PeerShare.csproj"
COPY . .
WORKDIR "/src/PeerShare"
RUN dotnet build "./PeerShare.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./PeerShare.csproj" -c $BUILD_CONFIGURATION -o /app/publish --self-contained true

# Building final image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_HTTP_PORTS=80
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["./PeerShare"]
