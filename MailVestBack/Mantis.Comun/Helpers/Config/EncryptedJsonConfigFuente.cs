using Microsoft.Extensions.Configuration;

namespace MailVest.Comun.Helpers.Config
{

    public sealed class EncryptedJsonConfigFuente : FileConfigurationSource
    {
        public Func<string, string> Decrypt { get; init; } = _ => throw new InvalidOperationException("Desencriptacion no configurada");

        public string Prefix { get; set; } = "Enc(";
        public string Suffix { get; set; } = ")";

        public override IConfigurationProvider Build(IConfigurationBuilder builder)
        {
            EnsureDefaults(builder);
            return new EncryptedJsonConfigProveedor(this);
        }
    } 
}
