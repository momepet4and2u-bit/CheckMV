using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.Exceptions
{
    public class ExceptionsCustom
    {
        public sealed class BusinessRuleException : Exception
        {
            public string Code { get; }
            public BusinessRuleException(string code, string message) : base(message) => Code = code;
        }
    }
}
