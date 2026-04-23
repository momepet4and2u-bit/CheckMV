using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Entidades;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Usuarios
{
    public interface IAdministradorUsuarios
    {
        Task<List<UsuariosDto>> GetAllUsers();

        Task ActualizarUsuarioAsync(int id, UsuarioUpdateDto updateUser, string userModifica, string ip, bool puedeCambiar = false);

        Task<CatUsuarios?> GetUsuarioByIdAsync(int id);
        Task<bool> ExisteUsuarioByUserAsync(string usuario);
        Task<bool> ExisteUsuarioByEmailAsync(string email);
        Task CrearUsuarioAsync(UsuarioCreateDto newUser);
    }
}
