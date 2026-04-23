using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Auth
{
    public class AuthResponse
    {
        public string token { get; set; }
        public UserAuth user { get; set; }
    }
}
