/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, type SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import type IdiomaCat from "./Modelos/IdiomaCat";
import { Checkbox } from "primereact/checkbox";

export default function FormularioLeng({
    defaultValues,
    onSubmit,
    onCancel,
    defaultCount = 0,
    allOrder = [],
}: FormularioLeng) {

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<IdiomaCat>({
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: {
            Code: defaultValues.Code ?? "",
            Name: defaultValues.Name ?? "",
            IsDefault: defaultValues.IsDefault ?? false,
            Order: defaultValues.Order ?? 0,
        },
        resolver: yupResolver(schema) as any,
    });

    const isEditingExistingDefault = Boolean(defaultValues?.IsDefault);

    const disableDefaultToggle = !isEditingExistingDefault && defaultCount >= 1;

    const handleFormSubmit: SubmitHandler<IdiomaCat> = async (data) => {

        if (!isEditingExistingDefault && Boolean((data as any).IsDefault) && defaultCount >= 1) {
            return;
        }
        const payload: IdiomaCat = {
            ...data,
        }
        await onSubmit(payload);
    }

    const currentOrder = watch("Order");

    return (
        <form
            className="p-fluid formulario-usuario"
            onSubmit={handleSubmit(handleFormSubmit)}
            noValidate>
            <div className="formgrid grid">
                <div className="field col-4 md:col-6">
                    <label htmlFor="Code"
                        className="fu-label">
                        Codigo</label>
                    <InputText
                        id="Code"
                        autoComplete="off"
                        placeholder="Ej. Codigo del idioma"
                        {...register("Code")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Code })}
                    />
                    {errors.Code && (
                        <small className="p-error fu-error">{errors.Code.message}</small>
                    )}
                </div>

                <div className="field col-8 md:col-6">
                    <label htmlFor="Name" className="fu-label">
                        Nombre</label>
                    <InputText
                        id="Name"
                        autoComplete="off"
                        placeholder="Nombre del idioma"
                        {...register("Name")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Name })}
                    />
                    {errors.Name && (
                        <p className="p-error fu-error">{errors.Name.message}</p>
                    )}
                </div>
                <div className="field col-4 md:col-6">
                    <label className="fu-label">Idioma por default</label>
                    <div className="flex align-items-center gap-2">
                        <Checkbox
                            inputId="IsDefault"
                            checked={Boolean(watch("IsDefault"))}
                            disabled={disableDefaultToggle}
                            onChange={(e) => {
                                if (disableDefaultToggle) return;
                                setValue("IsDefault", Boolean(e.checked), { shouldDirty: true });
                            }}
                        />
                        <label htmlFor="IsDefault" className={classNames({ "p-disabled": disableDefaultToggle })}>
                            Marcar como Default
                        </label>
                    </div>
                    {disableDefaultToggle &&
                        !isEditingExistingDefault && (
                            <small className="p-error fu-error">Ya existe un idioma por default.
                            </small>
                        )}
                </div>
                <div className="field col-4 md:col-6">
                    <label className="fu-label">Orden</label>
                    <InputText
                        id="Orden"
                        autoComplete="off"
                        placeholder="Orden del idioma"
                        value={currentOrder?.toString() ?? ""}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue === "") {
                                setValue("Order", 0);
                                return;
                            }
                            const numVal = Number(newValue);

                            // 2. Validamos contra el array allOrder
                            const exists = allOrder.includes(numVal);

                            if (!exists) {
                                setValue("Order", numVal, { shouldDirty: true });
                            } else {
                                // Opcional: mostrar un toast o aviso de "Número ya ocupado"
                            }
                        }}
                        className={classNames("fu-input", { "p-invalid": !!errors.Order })}
                    />
                    {errors.Order && (
                        <p className="p-error fu-error">{errors.Order.message}</p>
                    )}
                </div>
            </div>
            <div className="fu-botonera flex justify-content-center gap-2">
                <Button
                    type="button"
                    label="Cancelar"
                    className="p-button-text btn-cancelar"
                    onClick={onCancel}
                    disabled={isSubmitting} />
                <Button type="submit"
                    label="Guardar"
                    loading={isSubmitting}
                    className="p-button-rounded btn-guardar" />
            </div>
        </form>
    )
}

export interface FormularioLeng {
    defaultValues: IdiomaCat;
    onSubmit: (payload: IdiomaCat) => Promise<void> | void;
    onCancel: () => void;
    defaultCount?: number;
    allOrder?: number[];
}

const schema = yup.object({
    Code: yup.string().required("Codigo es requerido")
        .max(4, "Maximo 4 caracteres")
        .matches(/^[A-Z]+$/i, "Solo letras."),
    Name: yup.string().required("Nombre del idioma es requerido"),
    IsDefault: yup.boolean().optional(),
    Order: yup.number().optional(),
}).required();