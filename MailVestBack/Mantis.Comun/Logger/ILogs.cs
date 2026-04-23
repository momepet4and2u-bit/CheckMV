using MailVest.Entidades.Dominio.Error;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Comun.Logger
{
    public interface ILogs
    {
        Task LogEncryptedAsync(ErrorLog log, string tipo);

        Task LogPlainAsync(ErrorLog log, string tipo);

        Task LogFileOnlyAsync(ErrorLog log, bool encrypt, string tipo);
    }
}
