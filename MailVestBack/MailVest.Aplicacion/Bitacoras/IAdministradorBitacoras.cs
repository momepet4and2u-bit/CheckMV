using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Bitacoras
{
    public interface IAdministradorBitacoras
    {
        Task BitacoraAcceso(string username, string ip, string msj);
        Task BitacoraMovimientos(string movimiento, string tabla, string registro, string usuario, string ip);
    }
}
