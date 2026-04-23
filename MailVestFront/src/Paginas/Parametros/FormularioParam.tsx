/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, type SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import type ParametrosCat from "./Modelos/ParametrosCat";

export default function FormularioParam({
    defaultValues,
    onSubmit,
    onCancel,
}: FormularioParamsProps) {

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ParametrosCat>({
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: {
            Id: defaultValues.Id ?? 0,
            Parametro: defaultValues.Parametro ?? "",
            Descripcion: defaultValues.Descripcion ?? "",
            Valor: defaultValues.Valor ?? "",
            Estatus: defaultValues.Estatus ?? true,
        },
        resolver: yupResolver(schema) as any,
    });

    const handleFormSubmit: SubmitHandler<ParametrosCat> = async (data) => {
        const payload: ParametrosCat = {
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
                        Parametro</label>
                    <InputText
                        id="Parametro"
                        autoComplete="off"
                        placeholder="Ej. Autorizadores maximos"
                        {...register("Parametro")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Parametro })}
                    />
                    {errors.Parametro && (
                        <small className="p-error fu-error">{errors.Parametro.message}</small>
                    )}
                </div>

                <div className="field col-8 md:col-6">
                    <label htmlFor="Descripcion" className="fu-label">
                        Descripcion</label>
                    <InputText
                        id="Descripcion"
                        autoComplete="off"
                        placeholder="Descripcion del parametro"
                        {...register("Descripcion")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Descripcion })}
                    />
                    {errors.Descripcion && (
                        <p className="p-error fu-error">{errors.Descripcion.message}</p>
                    )}
                </div>
                <div className="field col-4 md:col-6">
                    <label htmlFor="Valor" className="fu-label">Valor</label>
                    <InputText
                        id="Valor"
                        autoComplete="off"
                        placeholder="Ej. 22222"
                        {...register("Valor")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Valor })}
                    />
                    {errors.Valor && (
                        <p className="p-error fu-error">{errors.Valor.message}</p>
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

export interface FormularioParamsProps {
    defaultValues: ParametrosCat;
    onSubmit: (payload: ParametrosCat) => Promise<void> | void;
    onCancel: () => void;
}

const schema = yup.object({
    Parametro: yup.string().required("Parametro es requerido")
    .max(50, "Maximo 50 caracteres")
    .matches(/^[A-Z]+$/i, "Solo letras."),
    Descripcion: yup.string().required("Descripcion es requerido"),
    Valor: yup.string()
    .required("El valor el parametro es requerido"),
    Estatus: yup.boolean().optional(),
    Id: yup.number().optional(),
}).required();