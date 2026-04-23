using MailVest.Datos.Repositorios.Draft.EmailDraftAprobadores;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Draft.EmailDraftAprobadores
{
    public class AdministradorEmailDraftAprobador : IAdministradorEmailDraftAprobador
    {
        private readonly IRepositorioEmailDraftAprobadores edA;

        public AdministradorEmailDraftAprobador(IRepositorioEmailDraftAprobadores _edA)
        {
            edA = _edA;
        }

        public async Task<IEnumerable<EmailDraftAprobador>?> AgregarAprobadoresAsync(IEnumerable<EmailDraftAprobador> newAprobadores, CancellationToken ct)
        {
            return await edA.CreateDraftAsync(newAprobadores, ct);
        }
    }
}
