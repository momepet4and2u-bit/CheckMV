using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Bitacoras
{
    public interface IRepositorioBitacoras
    {
        Task BitacoraAcceso(string usuario, string ip, string msj);
        Task BitacoraMovimientos(string movimiento, string tabla, string registro, string usuario, string ip);
    }
}
