using MailVest.Comun.Logger;
using MailVest.Encrypt;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;

namespace MailVest.Comun.Helpers.Config
{
    public class HelperConfig
    {
        private static IConfigurationRoot cfgBuilder;
        private readonly ILogs logs;
        private readonly ILogEncryptor encryptor;

        public HelperConfig(ILogs _logs, ILogEncryptor _encryptor)
        {
            logs = _logs;
            encryptor = _encryptor;
        }
        public string ObtenerParametroConfig(string Parametro)
        {
            try
            {
                string envPath = Environment.CurrentDirectory;
                cfgBuilder = new ConfigurationBuilder().AddJsonFile(Path.Combine(envPath, "appsettings.json")).Build();
                var param = cfgBuilder.GetSection(Parametro);
                try
                {
                    var paramStr = param.Value.Replace("Enc(", "").Replace(")", "");
                    var paramdesc = encryptor.Decrypt(paramStr);
                    return paramdesc;
                }
                catch
                {
                    return param.Value;
                }
            } catch (Exception ex)
            {
                logs.LogErrorEncrypt(ex, origen: "Obtener parametros config");
                return "";
            }
        }
    }
}
