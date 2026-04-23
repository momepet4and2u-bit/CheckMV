using MailVest.Aplicacion.Autenticacion;
using MailVest.Core.Conventions;
using MailVest.Datos.Contexto;
using MailVest.Datos.Repositorios.Autonticacion;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MailVest.Aplicacion.Seguridad;
using MailVest.Aplicacion.Autenticacion.Permiso.Helper;
using MailVest.Aplicacion.Autenticacion.Permiso;
using MailVest.Encrypt;
using MailVest.Comun.Logger;
using MailVest.Datos.Repositorios.Logging;
using MailVest.Comun.MiddleWare;
using Microsoft.AspNetCore.Authorization;
using MailVest.Comun.Helpers.Config;
using Microsoft.Extensions.FileProviders;
using MailVest.RealTime.Hubs;

var builder = WebApplication.CreateBuilder(args);

//ENCRYPT
var keyEnvVarName = builder.Configuration["Crypto:LogsKeyEnVar"];
if (string.IsNullOrWhiteSpace(keyEnvVarName))
{
    throw new InvalidOperationException(
        "No se configuro 'Crypto:LogsKeyEnVar' en appsettings.json");
}
var keyFilePath = Environment.GetEnvironmentVariable(keyEnvVarName)
    ?? throw new Exception($"Falta variable de entorno {keyEnvVarName}");

if (!File.Exists(keyFilePath))
{
    throw new FileNotFoundException($"No se encontro el archivo de clave", keyFilePath);
}

var keyBase64 = File.ReadAllText(keyFilePath).Trim();

var encryptor = new AESGCMLogEncryptor(keyBase64);

builder.Configuration.Sources.Clear();

builder.Configuration
    .AddEncryptedJsonFile("appsettings.json", decrypt: encryptor.Decrypt, optional: false, reloadnOnChange: true, prefix: "Enc(", sufix: ")")
    .AddEnvironmentVariables()
    .AddCommandLine(args);

builder.Services.AddSingleton<ILogEncryptor>(_ =>
{
    return new AESGCMLogEncryptor(keyBase64);
});


// Add services to the container.

builder.Services.AddControllers().AddJsonOptions(o => {
    o.JsonSerializerOptions.PropertyNamingPolicy = null;
});

// Configuración para SignalR (Agrégala así para que coincidan)
builder.Services.AddSignalR()
    .AddJsonProtocol(options => {
        // Al ponerlo en null, SignalR enviará "Permisos" en lugar de "permisos"
        options.PayloadSerializerOptions.PropertyNamingPolicy = null;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var urlImg = builder.Configuration["UrlFiles"];
var imgFold = builder.Configuration["FolderImagenes"];
var icsFold = builder.Configuration["FolderICS"];

var key = builder.Configuration["Jwt:Key"];
var issuer = builder.Configuration["Jwt:Issuer"];
var audience = builder.Configuration["Jwt:Audience"];

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"[JWT FAIL] {ctx.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                Console.WriteLine($"[JWT OK] {ctx.Principal?.Identity?.Name}");
                return Task.CompletedTask;
            },
            OnMessageReceived = ctx =>
            {

                var path = ctx.HttpContext.Request.Path;

                if (path.StartsWithSegments("/MailVest/hubs/app"))
                {
                    var accessToken = ctx.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(accessToken))
                    {
                        ctx.Token = accessToken;
                        return Task.CompletedTask;
                    }

                    var authHeader = ctx.Request.Headers.Authorization.ToString();
                    if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        ctx.Token = authHeader["Bearer ".Length..].Trim();
                    }
                }
                return Task.CompletedTask;
            }
        };
    })
    .AddNegotiate();

builder.Services.AddAuthorization(options =>
{
    foreach (var (policyName, codigoPermiso) in HelperPermisosPolicies.Todas())
    {
        options.AddPolicy(policyName, policy =>
        {
            policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme);
            policy.RequireAuthenticatedUser();
            policy.Requirements.Add(new PermisoRequirement(codigoPermiso));
        });
    }
});

builder.Services.AddScoped<IAuthorizationHandler, PermisoHandler>();


var origenesPermitidos = builder.Configuration.GetValue<string>("conexionesPermitidas")!.Split(",");
const string CorsPolicyName = "AllowVite";

builder.Services.AddCors(opciones =>
{
    opciones.AddPolicy(name: CorsPolicyName, policy =>
    {
        policy
        .WithOrigins(origenesPermitidos)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

builder.Services.AddControllers(o =>
{
    o.Conventions.Add(new RoutePrefixConvention("MailVest"));
});

builder.Services.AddDbContext<MailVestDbContext>(o => 
o.UseSqlServer("name=DBConnection"));

builder.Services.Scan(scan =>
    scan

    //Registrar Repositorios
    .FromAssembliesOf(typeof(RepositorioUsuarios))
    .AddClasses(clases => clases.InNamespaces("MailVest.Datos.Repositorios")
    .Where(type =>
    type.Name.StartsWith("Repositorio") ||
    type.Name.EndsWith("Repositorio")))
    .AsImplementedInterfaces()
    .WithScopedLifetime()

    //Registrar Administradores

    .FromAssembliesOf(typeof(AdministradorAutenticacion))
    .AddClasses(admin => admin.InNamespaces("MailVest.Aplicacion")
    .Where(type => type.Name.StartsWith("Administrador") ||
    type.Name.EndsWith("Service")))
    .AsImplementedInterfaces()
    .WithScopedLifetime()
);

builder.Services.AddOutputCache(opciones =>
{
    opciones.DefaultExpirationTimeSpan = TimeSpan.FromHours(1.3);
});

builder.Services.AddMemoryCache();

builder.Services.AddScoped<ILogs, Logs>();

builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddScoped<HelperConfig>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRouting();

var imagenesRoot = urlImg + imgFold;
var icsRoot = urlImg + icsFold;
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(imagenesRoot),
    RequestPath = "/MailVest"
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(icsRoot),
    RequestPath = "/MailVest"
});


app.UseErrorHandling();

app.UseCors(CorsPolicyName);

app.UseOutputCache();

app.UseAuthentication();

app.UseAuthorization();

app.MapHub<AppHub>("/MailVest/hubs/app").RequireAuthorization(new AuthorizeAttribute
{
    AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme
});

app.MapControllers();

app.Run();
