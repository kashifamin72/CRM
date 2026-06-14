# Development stage - for hot-reload with dotnet watch
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS dev
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

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY *.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# Production stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN mkdir -p /app/wwwroot/uploads/profiles /app/keys

COPY --from=build /app/publish .

EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

HEALTHCHECK NONE

ENTRYPOINT ["dotnet", "CRM.Api.dll"]
