using MailVest.Datos.Contexto;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Bitacoras
{
    public class RepositorioBitacoras : IRepositorioBitacoras
    {
        private readonly MailVestDbContext context;

        public RepositorioBitacoras(MailVestDbContext _context)
        {
            context = _context;
        }

        public async Task BitacoraAcceso(string usuario, string ip, string msj)
        {
            var date = DateTime.Now;
            var bitacora = new BitAcceso
            {
                Usuario = usuario,
                Fecha = date,
                IpRemota = ip,
                Mensaje = msj
            };
            await context.BitAcceso.AddAsync(bitacora);
            await context.SaveChangesAsync();
        }
        public async Task BitacoraMovimientos(string movimiento, string tabla, string registro, string usuario, string ip)
        {
            var date = DateTime.Now;
            var bitacoraMov = new BitMovimientos
            {
                Movimiento = movimiento,
                Tabla = tabla,
                Registro = registro,
                Usuario = usuario,
                Fecha = date,
                IPRemota = ip
            };
            await context.BitMovimientos.AddAsync(bitacoraMov);
            await context.SaveChangesAsync();
        }
    }
}
