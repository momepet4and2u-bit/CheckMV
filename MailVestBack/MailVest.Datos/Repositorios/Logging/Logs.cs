using MailVest.Comun.Helpers;
using MailVest.Comun.Logger;
using MailVest.Datos.Contexto;
using MailVest.Encrypt;
using MailVest.Entidades.Dominio.Error;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Logging
{
    public class Logs : ILogs
    {
        private readonly MailVestDbContext db;
        private readonly ILogEncryptor encryptor;
        private readonly string baseDirectory;

        public Logs(MailVestDbContext _db, ILogEncryptor _encryptor)
        {
            db = _db;
            encryptor = _encryptor;
            baseDirectory = Path.Combine(AppContext.BaseDirectory, "Logs");
        }

        public async Task LogEncryptedAsync(ErrorLog e, string tipo)
        {
            var dbLog = new ErrorLog
            {
                Fecha = e.Fecha,
                Origen = e.Origen,
                Mensaje = encryptor.Encrypt(e.Mensaje),
                Detalle = encryptor.Encrypt(e.Detalle),
                Usuario = e.Usuario,
                EndPoint = e.EndPoint,
                ClientInfo = e.ClientInfo,
                CorrelationId = e.CorrelationId,
            };

            await AppendToFile.AppendToFileAsync(dbLog, baseDirectory, tipo);

            db.ErrorLogs.Add(dbLog);
            await db.SaveChangesAsync();
        }

        public async Task LogPlainAsync(ErrorLog log, string tipo)
        {
            var dbLog = new ErrorLog
            {
                Fecha = log.Fecha,
                Origen = log.Origen,
                Mensaje = log.Mensaje,
                Detalle = log.Detalle,
                Usuario = log.Usuario,
                EndPoint = log.EndPoint,
                ClientInfo = log.ClientInfo,
                CorrelationId = log.CorrelationId,
            };

            await AppendToFile.AppendToFileAsync(dbLog, baseDirectory, tipo);

            db.ErrorLogs.Add(dbLog);
            await db.SaveChangesAsync();

        }

        public async Task LogFileOnlyAsync(ErrorLog log, bool encrypt, string tipo)
        {
            var dbLog = new ErrorLog
            {
                Fecha = log.Fecha,
                Origen = log.Origen,
                Mensaje = encrypt ? encryptor.Encrypt(log.Mensaje) : "Mensaje no obtenido",
                Detalle = encrypt ? encryptor.Encrypt(log.Detalle) : "Destalle no obtenido",
                Usuario = log.Usuario,
                EndPoint = log.EndPoint,
                ClientInfo = log.ClientInfo,
                CorrelationId = log.CorrelationId,
            };

            await AppendToFile.AppendToFileAsync(dbLog, baseDirectory, tipo);
        }
    }
}
