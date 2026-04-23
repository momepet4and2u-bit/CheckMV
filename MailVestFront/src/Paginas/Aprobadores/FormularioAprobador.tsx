/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, type SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import type AprobadoresCat from "./Modelos/AprobadoresCat";
import { InputSwitch } from "primereact/inputswitch";
import { Checkbox } from "primereact/checkbox";

export default function FormularioAprobador({
    defaultValues,
    onSubmit,
    onCancel,
    defaultCount = 0,
    canEditDefaults = false,
    canEditEstatus = false,
    editOrNew = false,
}: FormularioAprobadorProps) {

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<AprobadoresCat>({
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: {
            Id: defaultValues.Id ?? 0,
            Usuario: defaultValues.Usuario ?? "",
            Email: defaultValues.Email ?? "",
            Estatus: defaultValues.Estatus ?? true,
            IsDefault: defaultValues.IsDefault ?? false,
        },
        resolver: yupResolver(schema) as any,
    });

    const maxDefaults = ((import.meta as any).env.VITE_MAX_DEFAULTS as number | undefined) ?? 0;

    const isEditingExistingDefault = Boolean(defaultValues?.IsDefault);

    const disableDefaultToggle = !canEditDefaults || (!isEditingExistingDefault && defaultCount >= maxDefaults);

    const disableEstatusToggle = !canEditEstatus;

    const handleFormSubmit: SubmitHandler<AprobadoresCat> = async (data) => {

        if(!isEditingExistingDefault && Boolean((data as any).IsDefault) && defaultCount >= maxDefaults){
            return;
        }

        const payload: AprobadoresCat = {
            ...data,
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
                    <label htmlFor="Parametro"
                        className="fu-label">
                        Aprobador</label>
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
                    <label htmlFor="Descripcion" className="fu-label">
                        Email</label>
                    <InputText
                        id="Email"
                        autoComplete="off"
                        placeholder="Email del aprobador"
                        {...register("Email")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Email })}
                    />
                    {errors.Email && (
                        <p className="p-error fu-error">{errors.Email.message}</p>
                    )}
                </div>

                <div className="field col-12 md:col-6">
                    <label className="fu-label" htmlFor="Estatus">
                        Estatus
                    </label>
                    <div className="flex align-items-center gap-2">
                        <InputSwitch
                        checked={Boolean(watch("Estatus"))}
                        disabled={disableEstatusToggle || editOrNew}
                        onChange={(e) => {
                            if(disableEstatusToggle) return;
                            setValue("Estatus", Boolean(e.value), { shouldDirty: true });
                        }}
                        />
                        <span className={classNames({ "p-disabled": disableEstatusToggle })}>{watch("Estatus") ? "Activo" : "Inactivo"}</span>
                    </div>
                </div>
                
                <div className="field col-12 md:col-6">
                    <label className="fu-label">Aprobador Default</label>
                    <div className="flex align-items-center gap-2">
                        <Checkbox
                        inputId="IsDefault"
                        checked={Boolean(watch("IsDefault"))}
                        disabled={disableDefaultToggle}
                        onChange={(e) => {
                            if(disableDefaultToggle) return;
                            setValue("IsDefault", Boolean(e.checked), { shouldDirty: true });
                        }}
                        />
                        <label htmlFor="IsDefault" className={classNames({ "p-disabled": disableDefaultToggle })}>
                            Marcar como Default
                        </label>
                    </div>
                    {disableDefaultToggle &&
                    defaultCount >= maxDefaults &&
                    !isEditingExistingDefault && (
                        <small className="p-error fu-error">Ya existen {maxDefaults} aprobadores por default.
                        </small>
                    )}
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

export interface FormularioAprobadorProps {
    defaultValues: AprobadoresCat;
    onSubmit: (payload: AprobadoresCat) => Promise<void> | void;
    onCancel: () => void;
    defaultCount?: number;
    canEditDefaults?: boolean;
    canEditEstatus?: boolean;
    editOrNew?: boolean;
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
    Usuario: yup.string().required("Parametro es requerido")
    .max(50, "Maximo 50 caracteres")
    .matches(/^[A-Z]+$/i, "Solo letras."),
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
    Estatus: yup.boolean().optional(),
    IsDefault: yup.boolean().optional(),
    Id: yup.number().optional(),
}).required();