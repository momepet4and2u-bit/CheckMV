using MailVest.Entidades.Dominio.Error;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Comun.Helpers
{
    public static class AppendToFile
    {
        public static async Task AppendToFileAsync(ErrorLog log, string directorio, string tipo = "error")
        {
            var logsDirectory = Path.Combine(directorio, "Logs");

            Directory.CreateDirectory(logsDirectory);


            var fileName = $"{tipo}_{DateTime.Now:yyyyMMdd}.log";
            var filePath = Path.Combine(logsDirectory, fileName);

            var sb = new StringBuilder();
            sb.AppendLine("---------------------------------------");
            sb.AppendLine($"Fecha : {log.Fecha:O}");
            sb.AppendLine($"Origen : {log.Origen}");
            sb.AppendLine($"Mensaje : {log.Mensaje}");
            sb.AppendLine($"Detalle : {log.Detalle}");
            sb.AppendLine($"Usuario : {log.Usuario}");
            sb.AppendLine($"EndPoint : {log.EndPoint}");
            sb.AppendLine($"ClientInfo : {log.ClientInfo}");
            sb.AppendLine($"Correlation : {log.CorrelationId}");
            sb.AppendLine();

            await File.AppendAllTextAsync(filePath, sb.ToString(), Encoding.UTF8);
        }
    }
}
