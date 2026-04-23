namespace MailVest.LogTool.Gui
{
    partial class Form1
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            label1 = new Label();
            txtInput = new TextBox();
            label2 = new Label();
            txtOutPut = new TextBox();
            btnEncrypt = new Button();
            btnDecrypt = new Button();
            btnCopy = new Button();
            label3 = new Label();
            txtKeyPath = new TextBox();
            btnLoadKey = new Button();
            grpKeySource = new GroupBox();
            rbSourceFile = new RadioButton();
            rbSourceEnv = new RadioButton();
            btnLoadFromEnv = new Button();
            grpKeySource.SuspendLayout();
            SuspendLayout();
            // 
            // label1
            // 
            label1.AutoSize = true;
            label1.Location = new Point(16, 19);
            label1.Name = "label1";
            label1.Size = new Size(94, 15);
            label1.TabIndex = 0;
            label1.Text = "Texto de entrada";
            label1.Click += label1_Click;
            // 
            // txtInput
            // 
            txtInput.Location = new Point(21, 42);
            txtInput.Multiline = true;
            txtInput.Name = "txtInput";
            txtInput.ScrollBars = ScrollBars.Vertical;
            txtInput.Size = new Size(826, 101);
            txtInput.TabIndex = 1;
            // 
            // label2
            // 
            label2.AutoSize = true;
            label2.Location = new Point(21, 160);
            label2.Name = "label2";
            label2.Size = new Size(59, 15);
            label2.TabIndex = 2;
            label2.Text = "Resultado";
            // 
            // txtOutPut
            // 
            txtOutPut.Location = new Point(21, 178);
            txtOutPut.Multiline = true;
            txtOutPut.Name = "txtOutPut";
            txtOutPut.ScrollBars = ScrollBars.Vertical;
            txtOutPut.Size = new Size(826, 101);
            txtOutPut.TabIndex = 3;
            txtOutPut.Click += btnCopy_Click;
            // 
            // btnEncrypt
            // 
            btnEncrypt.Location = new Point(21, 285);
            btnEncrypt.Name = "btnEncrypt";
            btnEncrypt.Size = new Size(86, 30);
            btnEncrypt.TabIndex = 4;
            btnEncrypt.Text = "Encriptar";
            btnEncrypt.UseVisualStyleBackColor = true;
            btnEncrypt.Click += btnEncrypt_Click;
            // 
            // btnDecrypt
            // 
            btnDecrypt.Location = new Point(113, 285);
            btnDecrypt.Name = "btnDecrypt";
            btnDecrypt.Size = new Size(86, 30);
            btnDecrypt.TabIndex = 5;
            btnDecrypt.Text = "Desencriptar";
            btnDecrypt.UseVisualStyleBackColor = true;
            btnDecrypt.Click += btnDecrypt_Click;
            // 
            // btnCopy
            // 
            btnCopy.Location = new Point(761, 285);
            btnCopy.Name = "btnCopy";
            btnCopy.Size = new Size(86, 30);
            btnCopy.TabIndex = 6;
            btnCopy.Text = "Copiar resultado";
            btnCopy.UseVisualStyleBackColor = true;
            btnCopy.Click += btnCopy_Click;
            // 
            // label3
            // 
            label3.AutoSize = true;
            label3.Location = new Point(16, 464);
            label3.Name = "label3";
            label3.Size = new Size(97, 15);
            label3.TabIndex = 7;
            label3.Text = "Ruta archivo .key";
            // 
            // txtKeyPath
            // 
            txtKeyPath.Enabled = false;
            txtKeyPath.Location = new Point(16, 482);
            txtKeyPath.Name = "txtKeyPath";
            txtKeyPath.Size = new Size(429, 23);
            txtKeyPath.TabIndex = 8;
            // 
            // btnLoadKey
            // 
            btnLoadKey.Location = new Point(16, 421);
            btnLoadKey.Name = "btnLoadKey";
            btnLoadKey.Size = new Size(103, 40);
            btnLoadKey.TabIndex = 9;
            btnLoadKey.Text = "Cargar Llave";
            btnLoadKey.UseVisualStyleBackColor = true;
            btnLoadKey.Click += btnLoadKey_Click;
            // 
            // grpKeySource
            // 
            grpKeySource.Controls.Add(rbSourceFile);
            grpKeySource.Controls.Add(rbSourceEnv);
            grpKeySource.Location = new Point(16, 364);
            grpKeySource.Name = "grpKeySource";
            grpKeySource.Size = new Size(259, 51);
            grpKeySource.TabIndex = 10;
            grpKeySource.TabStop = false;
            grpKeySource.Text = "Origen de la Llave";
            // 
            // rbSourceFile
            // 
            rbSourceFile.AutoSize = true;
            rbSourceFile.Location = new Point(6, 22);
            rbSourceFile.Name = "rbSourceFile";
            rbSourceFile.Size = new Size(119, 19);
            rbSourceFile.TabIndex = 1;
            rbSourceFile.TabStop = true;
            rbSourceFile.Text = "Archivo .key (File)";
            rbSourceFile.UseVisualStyleBackColor = true;
            // 
            // rbSourceEnv
            // 
            rbSourceEnv.AutoSize = true;
            rbSourceEnv.Checked = true;
            rbSourceEnv.Location = new Point(133, 22);
            rbSourceEnv.Name = "rbSourceEnv";
            rbSourceEnv.Size = new Size(120, 19);
            rbSourceEnv.TabIndex = 0;
            rbSourceEnv.TabStop = true;
            rbSourceEnv.Text = "Archivo .key (Env)";
            rbSourceEnv.UseVisualStyleBackColor = true;
            // 
            // btnLoadFromEnv
            // 
            btnLoadFromEnv.Location = new Point(281, 372);
            btnLoadFromEnv.Name = "btnLoadFromEnv";
            btnLoadFromEnv.Size = new Size(107, 40);
            btnLoadFromEnv.TabIndex = 11;
            btnLoadFromEnv.Text = "Usar variable de entorno";
            btnLoadFromEnv.UseVisualStyleBackColor = true;
            btnLoadFromEnv.Click += btnLoadFromEnv_Click;
            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(876, 630);
            Controls.Add(btnLoadFromEnv);
            Controls.Add(grpKeySource);
            Controls.Add(btnLoadKey);
            Controls.Add(txtKeyPath);
            Controls.Add(label3);
            Controls.Add(btnCopy);
            Controls.Add(btnDecrypt);
            Controls.Add(btnEncrypt);
            Controls.Add(txtOutPut);
            Controls.Add(label2);
            Controls.Add(txtInput);
            Controls.Add(label1);
            Name = "Form1";
            Text = "Form1";
            Load += Form1_Load;
            grpKeySource.ResumeLayout(false);
            grpKeySource.PerformLayout();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private Label label1;
        private TextBox txtInput;
        private Label label2;
        private TextBox txtOutPut;
        private Button btnEncrypt;
        private Button btnDecrypt;
        private Button btnCopy;
        private Label label3;
        private TextBox txtKeyPath;
        private Button btnLoadKey;
        private GroupBox grpKeySource;
        private RadioButton rbSourceEnv;
        private RadioButton rbSourceFile;
        private Button btnLoadFromEnv;
    }
}
