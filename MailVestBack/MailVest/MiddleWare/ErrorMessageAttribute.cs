using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Comun.MiddleWare
{
    public class ErrorMessageAttribute : Attribute
    {
        public string Message { get; set; }
        public int StatusCode { get; set; }
        public string? ErrorCode { get; set; }
        public ErrorMessageAttribute(
            string message, int statusCode = StatusCodes.Status500InternalServerError, string? errorCode = null)
        {
            Message = message;
            StatusCode = statusCode;
            ErrorCode = errorCode;
        }
    }
}
