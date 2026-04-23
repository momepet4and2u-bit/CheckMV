using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MailVest.Comun.Helpers.Config
{
    internal sealed class EncryptedJsonConfigProveedor : FileConfigurationProvider
    {

        private readonly EncryptedJsonConfigFuente fuente;

        public EncryptedJsonConfigProveedor(EncryptedJsonConfigFuente _fuente) : base(_fuente)
        {
            fuente = _fuente;
        }

        public override void Load(Stream stream)
        {

            using var doc = JsonDocument.Parse(stream);

            var data = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            VisitElement(doc.RootElement, parentPath: null, data);

            Data = data
                .Where(kvp => kvp.Value is not null)
                .ToDictionary(k => k.Key, v => v.Value!, StringComparer.OrdinalIgnoreCase);
        }

        private void VisitElement(JsonElement element, string? parentPath, IDictionary<string, string?> data)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    foreach (var prop in element.EnumerateObject())
                    {
                        var key = parentPath is null ? prop.Name : $"{parentPath}:{prop.Name}";

                        VisitElement(prop.Value, key, data);
                    }
                    break;
                case JsonValueKind.Array:
                    int index = 0;
                    foreach (var item in element.EnumerateArray())
                    {
                        var key = $"{parentPath}:{index}";
                        VisitElement(item, key, data);
                    }
                    break;
                case JsonValueKind.String:
                    var raw = element.GetString();
                    data[parentPath!] = TryDecrypt(raw);
                    break;
                case JsonValueKind.Number:
                case JsonValueKind.True:
                case JsonValueKind.False:
                    data[parentPath!] = null;
                    break;
            }
        }

        private string? TryDecrypt(string? raw)
        {
            var prefix = fuente.Prefix;
            var sufix = fuente.Suffix;

            if (!raw.StartsWith(prefix, StringComparison.Ordinal) || !raw.EndsWith(sufix, StringComparison.Ordinal) || raw.Length <= prefix.Length + sufix.Length)
            {
                return raw;
            }

            var payload = raw.Substring(prefix.Length, raw.Length - prefix.Length - sufix.Length);

            try
            {
                return fuente.Decrypt(payload);
            }
            catch (FormatException)
            {
                return payload;
            }
            catch (CryptographicException)
            {
                return payload;
            }
            catch (ArgumentException)
            {
                return payload;
            }
        }
    }
}
