using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Comun.Helpers.Config
{
    public static class EncryptedJsonConfigExtension
    {

        public static IConfigurationBuilder AddEncryptedJsonFile (this IConfigurationBuilder builder, 
            string path,
            Func<string, string?> decrypt,
            bool optional = false,
            bool reloadnOnChange = true,
            string prefix = "Enc(",
            string sufix = ")"
            )
        {
            return builder.Add(new EncryptedJsonConfigFuente
            {
                Path = path,
                Optional = optional,
                ReloadOnChange = reloadnOnChange,
                Decrypt = decrypt,
                Prefix = prefix,
                Suffix = sufix
            });
        }
    }
}
