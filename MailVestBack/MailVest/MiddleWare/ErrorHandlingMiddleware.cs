using MailVest.Comun.Helpers;
using MailVest.Comun.Logger;
using System.Text.Json;

namespace MailVest.Comun.MiddleWare
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate next;

        public ErrorHandlingMiddleware(RequestDelegate _next)
        {
            next = _next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch(Exception ex)
            {
                var logs = context.RequestServices.GetRequiredService<ILogs>();

                await logs.LogErrorEncrypt(
                        ex,
                        origen: "Middleware",
                        context,
                        usuario: context.User?.Identity?.Name
                        );

                var endpoint = context.GetEndpoint();
                var meta = endpoint?.Metadata.GetMetadata<ErrorMessageAttribute>();

                var statusCode = meta?.StatusCode ?? StatusCodes.Status500InternalServerError;

                var message = meta?.Message ?? "Ocurrio un error inesperado. Contactar al administrador";

                var errorCode = meta?.ErrorCode ?? "UNEXPECTED_ERROR";

                context.Response.StatusCode = statusCode;
                context.Response.ContentType = "application/json charset=utf-8";

                var body = new
                {
                    code = errorCode,
                    message,
                    correlationId = context.TraceIdentifier
                };

                var json = JsonSerializer.Serialize(body);

                await context.Response.WriteAsync(json);
            }
        }
    }
}
