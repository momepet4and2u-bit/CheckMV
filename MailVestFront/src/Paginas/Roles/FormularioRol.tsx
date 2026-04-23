/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import type { TreeNode } from "primereact/treenode";
import CheckboxTreeSelector from "../../Componentes/Shared/Tree/CheckboxTreeSelector";
import type { RolAlta } from "./Modelos/RolAlta.model";
import { ColorPicker } from "primereact/colorpicker";

type Props = {
    onSubmit: (payload: RolAlta) => Promise<void> | void;
    onCancel: () => void;
    permisosTree: TreeNode[];
    defaultValues?: Partial<RolAlta>;
}

const Defaults: RolAlta = {
    Nombre: "",
    Descripcion: "",
    ColorFondo: "#ffffff",
    ColorTexto: "#000000",
    ColorBorde: "#000000",
    Estatus: true,
    Permisos: [],
}

const schema: yup.ObjectSchema<RolAlta> =
    yup.object({
        Nombre: yup.string()
        .trim()
        .required("El nombre del rol es requerido.")
        .min(3, "Minimo 3 caracteres"),
        Descripcion: yup.string()
            .trim()
            .required("La descripcion del rol es requerido.")
            .min(3, "Minimo 3 caracteres"),
        Permisos: yup
            .array()
            .of(yup.string().required())
            .min(1, 'Selecciona al menos un permiso')
            .required("Debes seleccionar al menos un permiso"),
        ColorFondo: yup.string().optional(),
        ColorTexto: yup.string().optional(),
        ColorBorde: yup.string().optional(),
        Estatus: yup.boolean().required(),
    });

const toHex = (value: string) => {
    if (!value) {
        return value
    }
    return value.startsWith('#') ? value : `#${value}`;
}

export default function FormularioRol({
    onSubmit,
    onCancel,
    permisosTree,
    defaultValues,
}: Props) {

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RolAlta>({
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: { ...Defaults, ...defaultValues },
        resolver: yupResolver(schema) as any,
    });

    const submit: SubmitHandler<RolAlta> = async (data) => {

        const payload: RolAlta = {
            ...data,
            Descripcion: data.Descripcion.trim(),
            ColorFondo: data.ColorFondo?.trim() ? toHex(data.ColorFondo) : '#ffffff',
            ColorTexto: data.ColorTexto?.trim() ? toHex(data.ColorTexto) : '#000000',
            ColorBorde: data.ColorBorde?.trim() ? toHex(data.ColorBorde) : '#000000',
            Permisos: (data.Permisos ?? []).filter(Boolean),
        };

        await onSubmit(payload);
    };

    return (
        <form
            className="p-fluid formulario-usuario"
            onSubmit={handleSubmit(submit)}
            noValidate>
            <div className="formgrid grid">
                <div className="field col-4 md:col-6">
                    <label htmlFor="Nombre"
                        className="fu-label">
                        Nombre del Rol *</label>
                    <InputText
                        id="Nombre"
                        autoComplete="off"
                        placeholder="Ej. Administrador..."
                        {...register("Nombre")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Nombre })}
                    />
                    {errors.Nombre && (
                        <small className="p-error fu-error">{errors.Nombre.message}</small>
                    )}
                </div>
                <div className="field col-4 md:col-6">
                    <label htmlFor="Descripcion"
                        className="fu-label">
                        Descripcion del Rol *</label>
                    <InputText
                        id="Descripcion"
                        autoComplete="off"
                        placeholder="Ej. Administrador del sistema..."
                        {...register("Descripcion")}
                        className={classNames("fu-input", { "p-invalid": !!errors.Descripcion })}
                    />
                    {errors.Descripcion && (
                        <small className="p-error fu-error">{errors.Descripcion.message}</small>
                    )}
                </div>
                <div className="col-12">
                    <div className="mv-role-colors">
                        <div className="mv-role-color-row">
                            <label className="mv-role-color-label">
                                Color de Fondo
                            </label>
                            <div className="mv-role-color-picker">
                                <Controller
                                    name="ColorFondo"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <ColorPicker
                                                value={(field.value ?? "#ffffff").replace("#", "")}
                                                onChange={(e) => field.onChange(toHex(String(e.value)))}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="mv-role-color-input">
                                <Controller
                                    name="ColorFondo"
                                    control={control}
                                    render={({ field }) => (
                                        <InputText
                                            value={field.value ?? "#ffffff"}
                                            onChange={(e) => field.onChange(toHex(e.target.value))}
                                            placeholder="#ffffff"
                                            className="fu-input"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className="mv-role-color-row">
                            <label className="mv-role-color-label">
                                Color de Texto
                            </label>
                            <div className="mv-role-color-picker">
                                <Controller
                                    name="ColorTexto"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <ColorPicker
                                                value={(field.value ?? "#ffffff").replace("#", "")}
                                                onChange={(e) => field.onChange(toHex(String(e.value)))}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="mv-role-color-input">
                                <Controller
                                    name="ColorTexto"
                                    control={control}
                                    render={({ field }) => (
                                        <InputText
                                            value={field.value ?? "#ffffff"}
                                            onChange={(e) => field.onChange(toHex(e.target.value))}
                                            placeholder="#ffffff"
                                            className="fu-input"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className="mv-role-color-row">
                            <label className="mv-role-color-label">
                                Color de Borde
                            </label>
                            <div className="mv-role-color-picker">
                                <Controller
                                    name="ColorBorde"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <ColorPicker
                                                value={(field.value ?? "#ffffff").replace("#", "")}
                                                onChange={(e) => field.onChange(toHex(String(e.value)))}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="mv-role-color-input">
                                <Controller
                                    name="ColorBorde"
                                    control={control}
                                    render={({ field }) => (
                                        <InputText
                                            value={field.value ?? "#ffffff"}
                                            onChange={(e) => field.onChange(toHex(e.target.value))}
                                            placeholder="#ffffff"
                                            className="fu-input"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="field col-8 md:col-6">
                    <label className="fu-label">
                        Permisos</label>
                    <Controller
                        name="Permisos"
                        control={control}
                        render={({ field }) => (
                            <CheckboxTreeSelector
                                nodes={permisosTree}
                                selectedIds={field.value ?? []}
                                onChange={(ids) => field.onChange(ids)}
                                className="mv-perm-tree"
                            />
                        )}
                    />
                    {errors.Permisos && (
                        <small className="p-error fu-error">{errors.Permisos.message}</small>
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
                    disabled={isSubmitting}
                    className="p-button-rounded btn-guardar" />
            </div>
        </form>
    )
}