# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create directories for uploads and keys
RUN mkdir -p /app/wwwroot/uploads/profiles /app/keys

# Copy published app
COPY --from=build /app/publish .

# Expose port
EXPOSE 5000

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check (no curl in distroless, use docker-compose healthcheck instead)
HEALTHCHECK NONE

ENTRYPOINT ["dotnet", "CRM.Api.dll"]
