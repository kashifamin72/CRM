using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Threading.RateLimiting;
using CRM.Api.Data;
using CRM.Api.Models;
using CRM.Api.Services;
using CRM.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Database: auto-detect PostgreSQL vs SQLite
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
if (connectionString.Contains("Host=") || connectionString.Contains("Server="))
{
    builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
}
else
{
    builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connectionString));
}

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedAccount = false;
}).AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? builder.Configuration["Jwt__Key"]
    ?? throw new InvalidOperationException("JWT key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? builder.Configuration["Jwt__Issuer"]
    ?? "crm.visionplusapps.com";
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? builder.Configuration["Jwt__Audience"]
    ?? "crm.visionplusapps.com";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", p => p.RequireRole("Administrator"));
    options.AddPolicy("ManagerOrAdmin", p => p.RequireRole("Administrator", "Manager"));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CRM API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration["AllowedOrigins"]?.Split(',') ?? new[] { "*" };
        policy.WithOrigins(origins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddHttpClient<IWhatsAppService, WhatsAppService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddHealthChecks();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var app = builder.Build();

app.UseGlobalExceptionHandler();
app.UseRateLimiter();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.EnsureCreatedAsync();

    // Lightweight schema patch for existing databases that were created
    // before the Address/City columns (and the City table + FK) were added.
    // Safe to re-run: each statement is idempotent or wrapped in try/catch.
    var isPg = !string.IsNullOrEmpty(connectionString) && connectionString.Contains("Host=");
    if (isPg)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Leads\" ADD COLUMN IF NOT EXISTS \"Address\" text;");
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Leads\" ADD COLUMN IF NOT EXISTS \"City\" text;");
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Leads\" ADD COLUMN IF NOT EXISTS \"CityId\" integer;");
            await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS \"Cities\" (\"Id\" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY, \"Name\" text NOT NULL, \"IsActive\" boolean NOT NULL DEFAULT true, \"CreatedAt\" timestamp with time zone NOT NULL);");
            await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_Cities_Name\" ON \"Cities\" (\"Name\");");
            await db.Database.ExecuteSqlRawAsync("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Leads_Cities_CityId') THEN ALTER TABLE \"Leads\" ADD CONSTRAINT \"FK_Leads_Cities_CityId\" FOREIGN KEY (\"CityId\") REFERENCES \"Cities\"(\"Id\") ON DELETE SET NULL; END IF; END $$;");
        }
        catch { /* column/constraint already exists or not supported — ignore */ }

        // Backfill: ensure 40 Pakistani cities exist in the Cities table.
        // Uses ON CONFLICT DO NOTHING so it's a no-op if the data is already there.
        try
        {
            var cityNames = new[]
            {
                "Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta","Sialkot","Gujranwala",
                "Hyderabad","Bahawalpur","Sargodha","Sukkur","Larkana","Sheikhupura","Rahim Yar Khan","Jhang","Dera Ghazi Khan","Gujrat",
                "Sahiwal","Wah Cantonment","Mardan","Kasur","Mingora","Nawabshah","Chiniot","Kotri","Bannu","Abbottabad",
                "Muzaffargarh","Mirpur Khas","Turbat","Jacobabad","Shikarpur","Kohat","Khuzdar","Dera Ismail Khan","Charsadda","Nowshera"
            };
            foreach (var n in cityNames)
            {
                await db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO \"Cities\" (\"Name\", \"IsActive\", \"CreatedAt\") SELECT @n, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM \"Cities\" WHERE LOWER(\"Name\") = LOWER(@n));",
                    new Npgsql.NpgsqlParameter("@n", n));
            }
        }
        catch { /* ignore seed failures — data may already be present */ }

        // Status Reasons schema patch
        try
        {
            await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS \"StatusReasons\" (\"Id\" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY, \"Status\" integer NOT NULL, \"Reason\" character varying(100) NOT NULL, \"SortOrder\" integer NOT NULL DEFAULT 0, \"IsActive\" boolean NOT NULL DEFAULT true, \"CreatedAt\" timestamp with time zone NOT NULL);");
            await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_StatusReasons_Status_Reason\" ON \"StatusReasons\" (\"Status\", \"Reason\");");
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"LeadActivities\" ADD COLUMN IF NOT EXISTS \"Reason\" character varying(100);");
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"LeadActivities\" ADD COLUMN IF NOT EXISTS \"Remark\" text;");
        }
        catch { /* column/table already exists — ignore */ }

        // Seed Status Reasons
        try
        {
            // Closed Lost reasons (Status = 5)
            var lostReasons = new[] { "Price too high", "Chose competitor", "No budget/timing", "Product doesn't fit", "Decision maker unavailable", "Other" };
            for (int i = 0; i < lostReasons.Length; i++)
            {
                await db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO \"StatusReasons\" (\"Status\", \"Reason\", \"SortOrder\", \"IsActive\", \"CreatedAt\") SELECT 5, @reason, @sortOrder, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM \"StatusReasons\" WHERE \"Status\" = 5 AND LOWER(\"Reason\") = LOWER(@reason));",
                    new Npgsql.NpgsqlParameter("@reason", lostReasons[i]),
                    new Npgsql.NpgsqlParameter("@sortOrder", i + 1));
            }
            // Closed Won reasons (Status = 4)
            var wonReasons = new[] { "Good price/value", "Best solution fit", "Strong relationship", "Quick implementation", "Good reviews/referral", "Other" };
            for (int i = 0; i < wonReasons.Length; i++)
            {
                await db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO \"StatusReasons\" (\"Status\", \"Reason\", \"SortOrder\", \"IsActive\", \"CreatedAt\") SELECT 4, @reason, @sortOrder, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM \"StatusReasons\" WHERE \"Status\" = 4 AND LOWER(\"Reason\") = LOWER(@reason));",
                    new Npgsql.NpgsqlParameter("@reason", wonReasons[i]),
                    new Npgsql.NpgsqlParameter("@sortOrder", i + 1));
            }
        }
        catch { /* ignore seed failures — data may already be present */ }

        // TenantSettings schema patch (single-row table for tenant branding)
        try
        {
            await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS \"TenantSettings\" (\"Id\" integer NOT NULL PRIMARY KEY, \"CompanyName\" character varying(80) NOT NULL DEFAULT 'CRM System', \"Tagline\" character varying(150), \"LogoPath\" character varying(500), \"PrimaryColor\" character varying(20) DEFAULT '#2563eb', \"SupportEmail\" character varying(200), \"SupportPhone\" character varying(50), \"UpdatedAt\" timestamp with time zone NOT NULL, \"UpdatedById\" character varying(450), CONSTRAINT \"CK_TenantSettings_SingleRow\" CHECK (\"Id\" = 1));");
            await db.Database.ExecuteSqlRawAsync("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_TenantSettings_AspNetUsers_UpdatedById') THEN ALTER TABLE \"TenantSettings\" ADD CONSTRAINT \"FK_TenantSettings_AspNetUsers_UpdatedById\" FOREIGN KEY (\"UpdatedById\") REFERENCES \"AspNetUsers\"(\"Id\") ON DELETE SET NULL; END IF; END $$;");
            // Seed the singleton row (only if missing)
            await db.Database.ExecuteSqlRawAsync("INSERT INTO \"TenantSettings\" (\"Id\", \"CompanyName\", \"Tagline\", \"PrimaryColor\", \"UpdatedAt\") SELECT 1, 'CRM System', 'Customer Relationship Management', '#2563eb', NOW() WHERE NOT EXISTS (SELECT 1 FROM \"TenantSettings\" WHERE \"Id\" = 1);");
        }
        catch { /* table already exists — ignore */ }
    }
    else
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE Leads ADD COLUMN Address TEXT;");
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE Leads ADD COLUMN City TEXT;");
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE Leads ADD COLUMN CityId INTEGER;");
            await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS Cities (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, IsActive INTEGER NOT NULL DEFAULT 1, CreatedAt TEXT NOT NULL);");
            await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_Cities_Name ON Cities (Name);");
        }
        catch { /* column already exists or not supported — ignore */ }

        // Status Reasons schema patch (SQLite)
        try
        {
            await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS StatusReasons (Id INTEGER PRIMARY KEY AUTOINCREMENT, Status INTEGER NOT NULL, Reason TEXT NOT NULL, SortOrder INTEGER NOT NULL DEFAULT 0, IsActive INTEGER NOT NULL DEFAULT 1, CreatedAt TEXT NOT NULL);");
            await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_StatusReasons_Status_Reason ON StatusReasons (Status, Reason);");
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE LeadActivities ADD COLUMN Reason TEXT;");
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE LeadActivities ADD COLUMN Remark TEXT;");
        }
        catch { /* column/table already exists — ignore */ }

        // TenantSettings schema patch (SQLite)
        try
        {
            await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS TenantSettings (Id INTEGER NOT NULL PRIMARY KEY CHECK (Id = 1), CompanyName TEXT NOT NULL DEFAULT 'CRM System', Tagline TEXT, LogoPath TEXT, PrimaryColor TEXT DEFAULT '#2563eb', SupportEmail TEXT, SupportPhone TEXT, UpdatedAt TEXT NOT NULL, UpdatedById TEXT);");
            await db.Database.ExecuteSqlRawAsync("INSERT OR IGNORE INTO TenantSettings (Id, CompanyName, Tagline, PrimaryColor, UpdatedAt) VALUES (1, 'CRM System', 'Customer Relationship Management', '#2563eb', datetime('now'));");
        }
        catch { /* table already exists — ignore */ }
    }

    await SeedDataService.SeedAsync(scope.ServiceProvider);
}

var uploadsPath = Path.Combine(app.Environment.WebRootPath, "uploads", "profiles");
Directory.CreateDirectory(uploadsPath);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
