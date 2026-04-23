using MailVest.Comun.Logger;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Comun.Helpers
{
    public static class LoggExtensions
    {

        public static Task LogErrorEncrypt(
            this ILogs logs,
            Exception ex,
            string origen,
            HttpContext? context = null,
            string? usuario = null,
            string? mensajeOverride = null,
            string tipo = "Error")
        {
            var log = LoggHelper.FromException(
                ex,
                origen,
                context,
                usuario,
                mensajeOverride
                );

            return logs.LogEncryptedAsync(log, tipo);
        }

        public static Task LogInfoEncrypt(
            this ILogs logs,
            string origen,
            string mensaje,
            HttpContext? ctx = null,
            string? usuario = null,
            string? detalleExtra = null,
            string tipo = "Info")
        {
            var log = LoggHelper.FromMessage(origen, mensaje, ctx, usuario, detalleExtra);

            return logs.LogEncryptedAsync(log, tipo);
        }

        public static Task LogInfo(
            this ILogs logs,
            string origen,
            string mensaje,
            HttpContext? ctx = null,
            string? usuario = null,
            string? detalleExtra = null,
            string tipo = "Info")
        {
            var log = LoggHelper.FromMessage(origen, mensaje, ctx, usuario, detalleExtra);

            return logs.LogPlainAsync(log, tipo);
        }

        public static Task LogInfoOnlyText(
            this ILogs logs,
            string origen,
            string mensaje,
            HttpContext? ctx = null,
            string? usuario = null,
            string? detalleExtra = null,
            string tipo = "Info")
        {
            var log = LoggHelper.FromMessage(origen, mensaje, ctx, usuario, detalleExtra);

            return logs.LogFileOnlyAsync(log, false, tipo);
        }

        public static Task LogInfoOnlyTextEncrypt(
            this ILogs logs,
            string origen,
            string mensaje,
            HttpContext? ctx = null,
            string? usuario = null,
            string? detalleExtra = null,
            string tipo = "Info")
        {
            var log = LoggHelper.FromMessage(origen, mensaje, ctx, usuario, detalleExtra);

            return logs.LogFileOnlyAsync(log, true, tipo);
        }
    }
}
