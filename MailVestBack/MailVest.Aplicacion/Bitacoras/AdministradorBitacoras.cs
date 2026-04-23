using MailVest.Datos.Repositorios.Bitacoras;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Bitacoras
{
    public class AdministradorBitacoras : IAdministradorBitacoras
    {
        private readonly IRepositorioBitacoras bitacora;

        public AdministradorBitacoras(IRepositorioBitacoras _bitacora)
        {
            bitacora = _bitacora;
        }

        public async Task BitacoraAcceso(string username, string ip, string msj)
        {
            await bitacora.BitacoraAcceso(username, ip, msj);
        }
        public async Task BitacoraMovimientos(string movimiento, string tabla, string registro, string usuario, string ip)
        {
            await bitacora.BitacoraMovimientos(movimiento, tabla, registro, usuario, ip);
        }
    }
}
