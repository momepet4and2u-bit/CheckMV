using MailVest.Entidades.Auth;
using MailVest.Entidades.Dominio;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Autenticacion
{
    public interface IAdministradorAutenticacion
    {
        Task<UserAuth> LoginWindowsAsync(string username);
    }
}
