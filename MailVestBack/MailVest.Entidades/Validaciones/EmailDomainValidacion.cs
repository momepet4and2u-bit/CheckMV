using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.Extensions.Configuration;

namespace MailVest.Entidades.Validaciones
{
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
    public class EmailDomainValidacion : ValidationAttribute
    {
        public string ConfigKey { get; }

        public EmailDomainValidacion(string configKey)
        {
            ConfigKey = configKey;
            ErrorMessage = "El correo debe ser corporativo.";
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is not string email || string.IsNullOrWhiteSpace(email))
            {
                return ValidationResult.Success;
            }

            var config = (IConfiguration?)validationContext.GetService(typeof(IConfiguration));
            if (config == null)
            {
                throw new InvalidOperationException(
                    "No se pudo resolver IConfiguration desde ValidationContext." +
                    "Asegurate de usar ASP.NET Core y registrar los servicios correctamente.");
            }

            var domainsCsv = config[ConfigKey];

            var allowedDomains = (domainsCsv ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(d => d.ToLowerInvariant())
                .ToArray();

            if (allowedDomains.Length == 0)
            {
                return new ValidationResult("No se han definido dominios.");
            }

            var atIndex = email.IndexOf('@');
            if (atIndex < 0 || atIndex == email.Length - 1)
            {
                return new ValidationResult("Correo inválido.");
            }

            var domain = email[(atIndex + 1)..].ToLowerInvariant();

            var ok = allowedDomains.Any(d => domain.EndsWith(d, StringComparison.OrdinalIgnoreCase));

            if (ok)
            {
                return ValidationResult.Success;
            }

            return new ValidationResult(ErrorMessage);
        }
    }
}
