using MailVest.Encrypt;
using System.Threading;

namespace MailVest.LogTool.Gui
{
    public partial class Form1 : Form
    {
        private const string env_key_name = "logging_encryption";
        private ILogEncryptor? encryptor;
        public Form1()
        {
            InitializeComponent();
            rbSourceEnv.CheckedChanged += KeySource_CheckedChanged;
            rbSourceFile.CheckedChanged += KeySource_CheckedChanged;

            rbSourceEnv.Checked = true;
        }

        private void KeySource_CheckedChanged(object? sender, EventArgs e)
        {
            UpdateKeySourceUI();
        }

        private void UpdateKeySourceUI()
        {
            encryptor = null;
            txtKeyPath.Text = "[sin llave cargada]";

            if (rbSourceEnv.Checked)
            {
                btnLoadFromEnv.Enabled = true;
                btnLoadKey.Enabled = false;
            }
            else if (rbSourceFile.Checked)
            {
                btnLoadFromEnv.Enabled = false;
                btnLoadKey.Enabled = true;
            }
        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }

        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void btnLoadKey_Click(object sender, EventArgs e)
        {
            using var ofd = new OpenFileDialog();
            ofd.Filter = "Archivos de llave (*.key)|*.key";
            ofd.Title = "Selecciona el archivo de llave";

            if (ofd.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    txtKeyPath.Text = ofd.FileName;

                    var keyBase64 = File.ReadAllText(ofd.FileName).Trim();

                    if (string.IsNullOrWhiteSpace(keyBase64))
                    {
                        MessageBox.Show("El archivo de llave está vacio.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }

                    encryptor = new AESGCMLogEncryptor(keyBase64);

                    MessageBox.Show("Llave cargada correctamente.", "Ok", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error cargando la llave:\n" + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void btnLoadFromEnv_Click(object sender, EventArgs e)
        {
            try
            {
                var keyPath = Environment.GetEnvironmentVariable(env_key_name);
                var keyBase64 = File.ReadAllText(keyPath).Trim();

                if (string.IsNullOrWhiteSpace(keyBase64))
                {
                    MessageBox.Show(
                        $"La variable de entorno '{env_key_name}' no está definida o viene vacía.",
                        "Variable no encontrada",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning
                        );
                    return;
                }

                encryptor = new AESGCMLogEncryptor(keyBase64);
                txtKeyPath.Text = $"[Variable de entorno: {env_key_name}]";

                MessageBox.Show("Llave cargada desde variable de entorno.", "Ok",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error cargando la llave desde variable de entorno:\n" + ex.Message,
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                    );
            }
        }

        private void btnEncrypt_Click(object sender, EventArgs e)
        {
            try
            {
                if (encryptor == null)
                {
                    MessageBox.Show("Primero carga la llave (.key)", "Sin llave", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                var plainText = txtInput.Text;
                if (string.IsNullOrEmpty(plainText))
                {
                    MessageBox.Show("No hay texto para encriptar", "Aviso", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                var cipherText = encryptor.Encrypt(plainText);
                txtOutPut.Text = cipherText;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al encriptar: \n" + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnDecrypt_Click(object sender, EventArgs e)
        {
            try
            {
                if (encryptor == null)
                {
                    MessageBox.Show("Primero carga la llave (.key)", "Sin llave", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                var rawInput = txtInput.Text;
                if (string.IsNullOrEmpty(rawInput))
                {
                    MessageBox.Show("No hay texto para desencriptar", "Aviso", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                string base64;
                try
                {
                    base64 = NormalizeCipherInput(rawInput);
                }
                catch (FormatException fmtEx)
                {
                    MessageBox.Show("Lo que pegaste no es una cadena válida en Base64 ni en formato Hex. \n\n" + 
                        "Detalle: " + fmtEx.Message + "\n\n" + "Tip: copia solo el valor encriptado tal como lo guarda el sistema (sin JSON completo, sin prefijos, etc.).", "Formato Invalido", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                string plainText;

                try
                {
                    plainText = encryptor.Decrypt(base64);
                }
                catch (Exception exCrypt)
                {
                    MessageBox.Show("Lo que pegaste no es una cadena válida en Base64 ni en formato Hex. \n\n" +
                        "Detalle: " + exCrypt.Message + "\n\n" + "Tip: copia solo el valor encriptado tal como lo guarda el sistema (sin JSON completo, sin prefijos, etc.).", "Formato Invalido", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                txtOutPut.Text = plainText;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al desencriptar: \n" + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnCopy_Click(object sender, EventArgs e)
        {
            if (!string.IsNullOrEmpty(txtOutPut.Text))
            {
                Clipboard.SetText(txtOutPut.Text);
                MessageBox.Show("Resultado copiado al portapapeles.", "Ok", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private static bool LooksLikeHex(string s)
        {
            s = s.Trim();

            if (s.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
            {
                s = s.Substring(2);
            }

            if (s.Length == 0 || s.Length % 2 != 0)
            {
                return false;
            }

            foreach (char c in s)
            {
                bool isHex =
                    (c >= '0' && c <= '9') ||
                    (c >= 'a' && c <= 'f') ||
                    (c >= 'A' && c <= 'F');
                
                if (!isHex)
                {
                    return false;
                }
            }
            return true;
        }

        private static byte[] HexToBytes (string hex)
        {
            hex = hex.Trim();

            if (hex.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
            {
                hex = hex.Substring(2);
            }

            int bytesCount = hex.Length / 2;
            byte[] bytes = new byte[bytesCount];

            for (int i = 0; i < bytesCount; i++)
            {
                string byteValue = hex.Substring(i * 2, 2);
                bytes[i] = Convert.ToByte(byteValue, 16);
            }

            return bytes;
        }

        private static string FixBase64Url(string s)
        {
            s = s.Replace('-', '+').Replace('_', '/');

            int mod4 = s.Length % 4;
            if (mod4 > 0)
            {
                s = s.PadRight(s.Length + (4 - mod4), '=');
            }

            return s;
        }

        private static string NormalizeCipherInput(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
            {
                throw new FormatException("La cadena esta vacía.");
            }

            var s = raw.Trim();

            if (s.StartsWith("\"") && s.EndsWith("\"") && s.Length > 2)
            {
                s = s.Substring(1, s.Length - 2);
            }

            if (LooksLikeHex(s))
            {
                var bytes = HexToBytes(s);
                return Convert.ToBase64String(bytes);
            }

            var candidate = FixBase64Url(s);

            foreach (char c in candidate)
            {
                bool ok =
                    (c >= '0' && c <= '9') ||
                    (c >= 'A' && c <= 'Z') ||
                    (c >= 'a' && c <= 'z') ||
                    c == '+' || c == '/' || c == '=';

                if (!ok)
                {
                    throw new FormatException("La cadena contiene caracteres no v+alidos para Base64.");
                }
            }

            try
            {
                _ = Convert.FromBase64String(candidate);
            }
            catch (FormatException fe)
            {
                throw new FormatException("La cadena no es Base64 válido.", fe);
            }

            return candidate;
        }
    }
}
