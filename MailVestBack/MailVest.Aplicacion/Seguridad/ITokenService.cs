using MailVest.Entidades.Auth;
using MailVest.Entidades.Entidades;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Seguridad
{
    public interface ITokenService
    {
        string GenerateToken(UserAuth usuario);
    }
}
