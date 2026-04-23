using MailVest.Entidades.Dominio.Error;
using MailVest.Entidades.Entidades;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Contexto
{
    public class MailVestDbContext : DbContext
    {
        public MailVestDbContext(DbContextOptions options) : base(options)
        {
        }
        #region Catalogos
        public DbSet<CatUsuarios> CatUsuarios { get; set; }
        public DbSet<CatOpcion> CatOpcion { get; set; }
        public DbSet<CatRoles> CatRoles { get; set; }
        public DbSet<CatSubModulo> CatSubModulo { get; set; }
        public DbSet<CatConfiguracion> CatConfiguracion { get; set; }
        public DbSet<CatIdioma> CatIdiomas { get; set; }
        #endregion

        #region Relaciones
        public DbSet<RelOpcionxRol> RelOpcionxRol { get; set; }
        public DbSet<RelRolesxUsuario> RelRolesxUsuario { get; set; }
        public DbSet<RelSubModuloxRol> RelSubModuloxRol { get; set; }
        #endregion

        #region ErrorLogs
        public DbSet<ErrorLog> ErrorLogs { get; set; }
        #endregion

        #region EmailTemplates
        public DbSet<EmailTemplates> EmailTemplates { get; set; }
        #endregion

        #region EmailDraft
        public DbSet<EmailDrafts> EmailDraft { get; set; }
        public DbSet<EmailDraftAprobador> EmailDraftAprobador { get; set; }
        public DbSet<EmailDraftICS> EmailDraftICs { get; set; }
        public DbSet<EmailDraftAprobaciones> EmailDraftAprobaciones { get; set; }
        #endregion

        #region Aprobadores
        public DbSet<DirectorioAprobacion> DirectorioAprobacion { get; set; }
        #endregion

        #region Bitacoras
        public DbSet<BitAcceso> BitAcceso { get; set; }
        public DbSet<BitMovimientos> BitMovimientos { get; set; }
        #endregion

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RelSubModuloxRol>(enti =>
            {
                enti.ToTable("RelSubModuloxRol");
            });

            modelBuilder.Entity<EmailTemplates>(en =>
            {
                en.ToTable("EmailTemplates");

                en.HasKey(x => x.Id);

                en.HasIndex(x => new
                {
                    x.ValidoDesde,
                    x.ValidoHasta
                });

                en.HasQueryFilter(x => !x.EsBorrado);
            });

            modelBuilder.Entity<DirectorioAprobacion>()
                .ToTable(tb => tb.HasTrigger("TR_DirectorioAprobacion_Max2Defaults"));

            modelBuilder.Entity<BitAcceso>(e =>
            {
                e.HasKey(x => x.IdAcceso);
            });

            modelBuilder.Entity<BitMovimientos>(e =>
            {
                e.HasKey(x => x.Id);
            });

            base.OnModelCreating(modelBuilder);

        }
    }
}
