using MailVest.Entidades.Dominio.Error;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Comun.Helpers
{
    public static class LoggHelper
    {
        public static ErrorLog FromException(
            Exception ex,
            string origen,
            HttpContext? ctx = null,
            string? usuario = "sistema",
            string? mensajeOverride = null,
            string? detalleExtra = null)
        {

            var mensaje = mensajeOverride ?? ex.Message;

            var detalle = ex.ToString();
            if (!string.IsNullOrWhiteSpace(detalleExtra))
            {
                detalle += Environment.NewLine + "Extra: " + detalleExtra;
            }

            return new ErrorLog
            {
                Fecha = DateTime.Now,
                Origen = origen,
                Mensaje = mensaje,
                Detalle = detalle,
                Usuario = usuario ?? ctx?.User?.Identity?.Name,
                EndPoint = ctx?.Request?.Path.Value,
                ClientInfo = ctx?.Request?.Headers["User-Agent"].ToString(),
                CorrelationId = ctx?.TraceIdentifier
            };
        }

        public static ErrorLog FromMessage(
            string origen,
            string mensaje,
            HttpContext? ctx = null,
            string? usuario = null,
            string? detalleExtra = null)
        {
            var detalle = detalleExtra ?? string.Empty;

            return new ErrorLog
            {
                Fecha = DateTime.Now,
                Origen = origen,
                Mensaje = mensaje,
                Detalle = detalle,
                Usuario = usuario ?? ctx?.User?.Identity?.Name,
                EndPoint = ctx?.Request?.Path.Value,
                ClientInfo = ctx?.Request?.Headers["User-Agent"].ToString(),
                CorrelationId = ctx?.TraceIdentifier,
            };
        }
    }
}
