using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Entidades;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Autonticacion
{
    public interface IRepositorioUsuarios
    {
        Task<List<UsuariosDto>> ObtenerTodosUsuarios();

        Task ActualizarUserAsync(UsuarioUpdateDto updateUser, string userModifica);

        Task<CatUsuarios?> GetUsuarioByIdAsync(int id);

        Task<bool> ExisteUsuarioByUserAsync(string usuario);
        Task<bool> ExisteUsuarioByEmailAsync(string email);
        Task<CatUsuarios> CrearUsuarioAsync(UsuarioCreateDto newUser);
    }
}
