# Development stage - for hot-reload with dotnet watch
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy everything (source will be mounted as volume in dev mode)
COPY . .

# Expose port for development
EXPOSE 5000

# Default command for development (overridden by docker-compose)
CMD ["dotnet", "watch", "run", "--no-launch-profile"]

# Production stage
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
