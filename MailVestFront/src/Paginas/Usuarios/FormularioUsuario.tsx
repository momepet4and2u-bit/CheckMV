/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import type UsuarioAlta from "./Modelos/Usuario.model";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import type RolCatalogo from "../Roles/Modelos/Rol.model";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { RoleChip } from "../../Componentes/Roles/RoleChip";
import { classNames } from "primereact/utils";

export default function FormularioUsuario({
    defaultValues,
    roles,
    onSubmit,
    onCancel,
}: FormularioUsuarioProps) {

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<UsuarioAlta>({
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: {
            Usuario: defaultValues.Usuario ?? "",
            Nombre: defaultValues.Nombre ?? "",
            Email: defaultValues.Email ?? "",
            Nomina: defaultValues.Nomina ?? "",
            Puesto: defaultValues.Puesto ?? "",
            Rol: defaultValues.Rol ?? "",
            Activo: defaultValues.Activo ?? true,
            IdRol: defaultValues.IdRol ?? 0,
        },
        resolver: yupResolver(schema) as any,
    });

    const handleFormSubmit: SubmitHandler<UsuarioAlta> = async (data) => {
        
        const rolCat = roles.find((r) => String(r.Id) === String(data.IdRol));

        const payload: UsuarioAlta = {
            ...data,
            Rol: rolCat?.Descripcion ?? "",
        }

        await onSubmit(payload);
    }

    return (
        <form
            className="p-fluid formulario-usuario"
            onSubmit={handleSubmit(handleFormSubmit)}
            noValidate>
            <div className="formgrid grid">
                <div className="field col-4 md:col-6">
                    <label htmlFor="Usuario"
                        className="fu-label">
                        Usuario</label>
                    <InputText
                        id="Usuario"
                        autoComplete="off"
                        placeholder="Ej. CGARZAJ"
                        {...register("Usuario")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Usuario })}
                    />
                    {errors.Usuario && (
                        <small className="p-error fu-error">{errors.Usuario.message}</small>
                    )}
                </div>

                <div className="field col-8 md:col-6">
                    <label htmlFor="Nombre" className="fu-label">
                        Nombre</label>
                    <InputText
                        id="Nombre"
                        autoComplete="off"
                        placeholder="Nombre completo"
                        {...register("Nombre")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Nombre })}
                    />
                    {errors.Nombre && (
                        <p className="p-error fu-error">{errors.Nombre.message}</p>
                    )}
                </div>
                <div className="field col-4 md:col-6">
                    <label htmlFor="Nomina" className="fu-label">Nomina</label>
                    <InputText
                        id="Nomina"
                        autoComplete="off"
                        placeholder="Ej. 22222"
                        {...register("Nomina")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Nomina })}
                    />
                    {errors.Nomina && (
                        <p className="p-error fu-error">{errors.Nomina.message}</p>
                    )}
                </div>
                <div className="field col-8 md:col-6">
                    <label htmlFor="Email" className="fu-label">Email</label>
                    <InputText
                        id="Email"
                        autoComplete="on"
                        placeholder="cgarzaj@bb.com.mx"
                        {...register("Email")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Email })}
                    />
                    {errors.Email && (
                        <p className="p-error fu-error">{errors.Email.message}</p>
                    )}
                </div>
                <div className="field col-4 md:col-6">
                    <label htmlFor="Puesto" className="fu-label">Puesto</label>
                    <InputText
                        id="Puesto"
                        autoComplete="on"
                        placeholder="Ej. Administrador de sistemas"
                        {...register("Puesto")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Puesto })}
                    />
                    {errors.Puesto && (
                        <p className="p-error fu-error">{errors.Puesto.message}</p>
                    )}
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="Rol" className="fu-label">Rol</label>
                    <Controller
                        name="IdRol"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id="Rol"
                                value={field.value}
                                onChange={(e) => field.onChange(Number(e.value))}
                                options={roles}
                                optionLabel="Descripcion"
                                optionValue="Id"
                                placeholder="Selecciona un rol"
                                className={classNames("fu-input", {
                                    "p-invalid": !!errors.Rol
                                })}
                                panelClassName="mv-role-dropdown-panel"
                                valueTemplate={(opt) => {
                                    if (!opt) {
                                        return <span className="text-slate-400">Selecciona un rol</span>;
                                    }
                                    return (
                                        <RoleChip
                                            nombre={opt.Descripcion}
                                            rolCatalogo={opt}
                                        />
                                    );
                                }}
                                itemTemplate={(opt) => (
                                    <RoleChip
                                        nombre={opt.Descripcion}
                                        rolCatalogo={opt}
                                    />
                                )}
                            />
                        )}
                    />
                    {errors.Rol && <p className="p-error fu-error">{errors.Rol.message}</p>}
                </div>
            </div>
            <div className="fu-botonera flex justify-content-center gap-2">
                <Button
                    type="button"
                    label="Cancelar"
                    className="p-button-text btn-cancelar"
                    onClick={onCancel}
                    disabled={isSubmitting}/>
                <Button type="submit"
                    label="Guardar"
                    loading={isSubmitting}
                    className="p-button-rounded btn-guardar"/>
            </div>
        </form>
    )
}

export interface FormularioUsuarioProps {
    defaultValues: UsuarioAlta;
    roles: RolCatalogo[];
    onSubmit: (payload: UsuarioAlta) => Promise<void> | void;
    onCancel: () => void;
}
    const emailDomainsEnv = ((import.meta as any).env.VITE_EMAIL_DOMAINS as string | undefined) ?? "";

    const allowedEmailDomains = emailDomainsEnv
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

    const allowedEmailDomainsMsg =
    allowedEmailDomains.length === 1 ? allowedEmailDomains[0]
    : allowedEmailDomains.join(" o ");

const schema = yup.object({
    Usuario: yup.string().required("Usuario es requerido")
    .max(10, "Maximo 10 caracteres")
    .matches(/^[A-Z0-9]+$/i, "Solo letras y numeros."),
    Nombre: yup.string().required("Nombre es requerido"),
    Email: yup.string()
    .email("Correo invalido")
    .required("Correo requerido")
    .test("dominio-valido",
        `El correo debe terminar en @${allowedEmailDomainsMsg}`,
        (value) => {
            if(!value){
                return false;
            }
            if(allowedEmailDomains.length === 0){
                return true;
            }
            const parts = value.split("@");
            if(parts.length !== 2){
                return false;
            }

            const domain = parts[1].toLowerCase();
            return allowedEmailDomains.some((d) => domain.endsWith(d));
        }
    ),
    Nomina: yup.string().required("Nomina es requerida")
    .matches(/^\d+$/, "La nómina debe de ser númerica."),
    Puesto: yup.string().required("Puesto es requerido"),
    IdRol: yup.string().required("Rol es requerido"),
    Activo: yup.boolean().optional(),
    Id: yup.number().optional(),
}).required();