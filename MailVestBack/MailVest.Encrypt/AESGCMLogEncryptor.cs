
using System.Security.Cryptography;
using System.Text;

namespace MailVest.Encrypt
{
    public interface ILogEncryptor
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherTextBase64);
    }

    public class AESGCMLogEncryptor : ILogEncryptor
    {
        private const int NonceSize = 12;
        private const int TagSize = 16;
        private readonly byte[] key;

        public AESGCMLogEncryptor( string keyBase64)
        {
            if (string.IsNullOrWhiteSpace(keyBase64))
            {
                throw new ArgumentException("Crypto:LogsKey no esta configurada", nameof(keyBase64));
            }

            key = Convert.FromBase64String(keyBase64);

            if (key.Length != 32)
            {
                throw new ArgumentException("La llave debe ser de 256 bits (32 bytes)", nameof(keyBase64));
            }
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
            {
                return plainText;
            }

            byte[] plaintextBytes = Encoding.UTF8.GetBytes(plainText);

            byte[] nonce = new byte[NonceSize];
            byte[] tag = new byte[TagSize];
            byte[] cipherBytes = new byte[plaintextBytes.Length];

            RandomNumberGenerator.Fill(nonce);

            using (var aes = new AesGcm(key))
            {
                aes.Encrypt(
                    nonce: nonce,
                    plaintext: plaintextBytes,
                    ciphertext: cipherBytes,
                    tag: tag
                    );
            }

            byte[] result = new byte[NonceSize + TagSize + cipherBytes.Length];
            Buffer.BlockCopy(nonce, 0, result, 0, NonceSize);
            Buffer.BlockCopy(tag, 0, result, NonceSize, TagSize);
            Buffer.BlockCopy(cipherBytes, 0, result, NonceSize + TagSize, cipherBytes.Length);

            return Convert.ToBase64String(result);
        }

        public string Decrypt(string cipherTextBase64)
        {
            if (string.IsNullOrEmpty(cipherTextBase64))
            {
                return cipherTextBase64;
            }

            byte[] fullCipher = Convert.FromBase64String(cipherTextBase64);

            if (fullCipher.Length < NonceSize + TagSize)
            {
                throw new CryptographicException("El texto cifrado es demasiado corto");
            }

            byte[] nonce = new byte[NonceSize];
            byte[] tag = new byte[TagSize];
            byte[] cipherBytes = new byte[fullCipher.Length - NonceSize - TagSize];

            Buffer.BlockCopy(fullCipher, 0, nonce, 0, NonceSize);
            Buffer.BlockCopy(fullCipher, NonceSize, tag, 0, TagSize);
            Buffer.BlockCopy(fullCipher, NonceSize + TagSize, cipherBytes, 0, cipherBytes.Length);

            byte[] plainBytes = new byte[cipherBytes.Length];

            using (var aesGcm = new AesGcm(key))
            {
                aesGcm.Decrypt(
                    nonce: nonce,
                    ciphertext: cipherBytes,
                    tag: tag,
                    plaintext: plainBytes
                    );
            }
                return Encoding.UTF8.GetString(plainBytes);
        }
    }
}
