using MailVest.Aplicacion.Opciones_Permisos;
using MailVest.Aplicacion.RelSubModulosxRol;
using MailVest.Aplicacion.SubModulos;
using MailVest.Datos.Repositorios.RelPermisosxRol;
using MailVest.Datos.Repositorios.UnitOfWork;
using MailVest.Entidades.Modelo;

namespace MailVest.Aplicacion.RelPermisosxRol
{
    public class AdministradorRelPermisosxRol : IAdministradorRelPermisosxRol
    {
        private readonly IRepositorioRelPermisosxRol relPerRol;
        private readonly IAdministradorOpciones admOpc;
        private readonly IAdministradorRelSubModulosxRol admSubRol;
        private readonly IRepositorioUnitOfWork saveAll;

        public AdministradorRelPermisosxRol(IRepositorioRelPermisosxRol _relPerRol, IAdministradorOpciones _admOpc, IAdministradorRelSubModulosxRol _admSubRol, IRepositorioUnitOfWork _saveAll)
        {
            relPerRol = _relPerRol;
            admOpc = _admOpc;
            admSubRol = _admSubRol;
            saveAll = _saveAll;
        }
        public async Task UpdatePermisosxRolAsync(int idRol, List<string> newPermisos, string usuario)
        {
            var nuevosSet = new HashSet<string>(
                newPermisos
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => p.Trim()),
                StringComparer.OrdinalIgnoreCase);

            var ahora = DateTime.Now;


            var opcionesSeleccionadas = await admOpc.GetPermisoByNameAsync(nuevosSet);
            var selectedIds = new HashSet<int>(
                opcionesSeleccionadas.Select(o => o.Id));

            //Permisos

            var relaciones = await relPerRol.GetRelByRolAsync(idRol);

            foreach (var rel in relaciones)
            {
                var debeQuedarActivo = selectedIds.Contains(rel.IdCatOpcion);

                if (rel.Estatus != debeQuedarActivo)
                {
                    rel.Estatus = debeQuedarActivo;
                    rel.Fecha_Modificacion = ahora;
                    rel.UsuarioModifica = usuario;
                }
            }

            var existentes = new HashSet<int>(
                relaciones.Select(r => r.IdCatOpcion));

            var faltantes = selectedIds.Except(existentes).ToList();

            if (faltantes.Count > 0)
            {
                var nuevasOpciones = await admOpc.GetPermisoByIdAsync(faltantes);
                var nuevaRelList = nuevasOpciones.Select(op => new RelOpcionxRol
                {
                    IdCatRol = idRol,
                    IdCatOpcion = op.Id,
                    Estatus = true,
                    Fecha_CreacionRelacion = ahora,
                    Fecha_Modificacion = ahora,
                    UsuarioModifica = usuario
                }).ToList();

                if (nuevaRelList.Count > 0)
                {
                    await relPerRol.AgregarRelacionAsync(nuevaRelList);
                }
            }

            //Sub-modulos
            await admSubRol.SyncSubModulosRolAsync(idRol, newPermisos, usuario);

            await saveAll.SaveChangesAsync();
        }

        public async Task<List<string>> ObtenerPermisoxRolAsync(int idRol)
        {
            var rolxPer = relPerRol.ObtenerPermisoxRolAsync(idRol);

            return await rolxPer;
        }
    }
}
