/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Toast } from "primereact/toast";
import EmailTemplateStore from "./Templates/emailTemplates.store";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { classNames } from "primereact/utils";
import { FileUpload, type FileUploadSelectEvent } from "primereact/fileupload";
import { Button } from "primereact/button";
import DOMPurify from "dompurify";
import React from "react";
import { resolveFileIcon } from "../../../Helpers/iconsAttachment";
import TemplateHybridPreviewIFrame from "../../../Componentes/Text/TemplateHybridPreviewIFrame";
import { createEmptyTempalteUIModel } from "../../../Helpers/Mails/emailTemplate.mappers";
import type { PortalLanguageDto } from "../../../Utils/Language/portalLanguages.type";
import { getPortalLanguages } from "../../../Utils/Language/portalLanguages.api";
import { type EmailTemplateFormValues, emailTemplateSchema } from "./Templates/emailTemplate.schema";
import { TabPanel, TabView, type TabViewTabChangeEvent } from "primereact/tabview";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";

type Props = {
    onCreated?: () => void;
}

type PendingTemplateImage = {
    TempId: string;
    File: File;
    PreviewUrl: string;
    AssignedLanguageCode: string | null;
    SelectedLanguageCode: string | null;
}

type TemplateOption = {
    label: string;
    value: number;
}
export default function PlantillasNuevaTab({ onCreated }: Props) {

    const toastRef = useRef<Toast>(null!);
    const imageUploadRef = useRef<FileUpload>(null);
    const fileUploadRef = useRef<FileUpload>(null);

    // const [imagePreviewUrlByLang, setImagePreviewUrlByLang] = useState<Record<LangKey, string>>({ ES: "", EN: "" });
    // const [emailImageSrcByLang, setEmailImageSrcByLang] = useState<Record<LangKey, string>>({ ES: "", EN: "" });

    // const [lang, setLang] = useState<LangKey>("ES");
    // const [langFieldsRef] = useAutoAnimate<HTMLDivElement>({ duration: 180 });

    const [portalLanguages, setPortalLanguages] = useState<PortalLanguageDto[]>([]);
    // const [languagesLoading, setLanguagesLoading] = useState(true);

    const [pendingImages, setPendingImages] = useState<PendingTemplateImage[]>([]);
    const [activeLanguageIndex, setActiveLanguageIndex] = useState(0);

    const form = useForm<EmailTemplateFormValues>({
        resolver: yupResolver(emailTemplateSchema) as any,
        defaultValues: createEmptyTempalteUIModel([]) as any,
    });

    const {
        control,
        reset,
        watch,
        setValue,
        getValues,
        formState: { errors, isSubmitting },
        handleSubmit,
        register,
        trigger,
    } = form;



    const loadPortalLanguages = useCallback(async () => {
        try {
            // setLanguagesLoading(true);
            const languages = await getPortalLanguages();
            setPortalLanguages(languages);
            const emptyModel = createEmptyTempalteUIModel(languages);
            reset(emptyModel as any);
        } finally {
            // setLanguagesLoading(false);
        }
    }, [reset]);

    const onImageFilesSelected = useCallback((files: File[]) => {
        const next: PendingTemplateImage[] = files.map((file) => ({
            TempId:
                typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${file.name}-${Date.now()}-${Math.random()}`,
            File: file,
            PreviewUrl: URL.createObjectURL(file),
            AssignedLanguageCode: null,
            SelectedLanguageCode: null,
        }));

        setPendingImages((prev) => [...prev, ...next]);
    }, []);

    const setPendingImageSelectedLanguage = useCallback(
        (tempId: string, languageCode: string | null) => {
            setPendingImages((prev) => prev.map((img) => img.TempId === tempId ? { ...img, SelectedLanguageCode: languageCode } : img)
            );
        }, []
    );

    const assignImageToLanguage = useCallback(
        (tempId: string) => {
            const image = pendingImages.find((x) => x.TempId === tempId);
            if (!image || !image.SelectedLanguageCode) return;

            const languages = getValues("Languages");
            const langIndex = languages.findIndex((x) => x.Code === image.SelectedLanguageCode);
            if (langIndex < 0) return;

            const langIndexAct = languages.findIndex((x) => x.Code === image.AssignedLanguageCode);
            if (image.AssignedLanguageCode && langIndexAct >= 0) {
                setValue(`Languages.${langIndexAct}.ImageFile`, null, {
                    shouldDirty: true,
                    shouldValidate: true,
                });

                setValue(`Languages.${langIndexAct}.ImageUrl`, null, {
                    shouldDirty: true,
                    shouldValidate: true,
                });
            }


            setPendingImages((pr) => pr.map((img) => {
                if (img.AssignedLanguageCode === image.SelectedLanguageCode) {
                    return { ...img, AssignedLanguageCode: null };
                }
                if (img.TempId === tempId) {
                    return { ...img, AssignedLanguageCode: image.SelectedLanguageCode };
                }
                return img;
            }));
            setValue(`Languages.${langIndex}.ImageFile`, image.File, {
                shouldDirty: true,
                shouldValidate: true,
            });

            setValue(`Languages.${langIndex}.ImageUrl`, URL.createObjectURL(image.File), {
                shouldDirty: true,
                shouldValidate: true,
            });
        }, [pendingImages, getValues, setValue]
    );

    const removePendingImage = useCallback((tempId: string) => {
        const image = pendingImages.find((x) => x.TempId === tempId);
        if (!image) return;

        const languages = getValues("Languages");
        const langIndex = languages.findIndex((x) => x.Code === image.SelectedLanguageCode);
        if (!(langIndex < 0)) {
            setValue(`Languages.${langIndex}.ImageFile`, null, {
                shouldDirty: true,
                shouldValidate: true,
            });

            setValue(`Languages.${langIndex}.ImageUrl`, null, {
                shouldDirty: true,
                shouldValidate: true,
            });
        }

        setPendingImages((prev) => {
            const found = prev.find((x) => x.TempId === tempId);
            if (found?.PreviewUrl) URL.revokeObjectURL(found.PreviewUrl);
            return prev.filter((x) => x.TempId !== tempId);
        });

    }, [getValues, pendingImages, setValue]);

    const onSelectImage = (e: FileUploadSelectEvent) => {
        const inputFiles = (e.originalEvent as unknown as InputEvent)
            ?.target as HTMLInputElement;

        const files = Array.from(inputFiles.files ?? []);

        onImageFilesSelected(files);
    };

    // const htmlPreview = useMemo(() => {
    //     debugger;
    //     const raw = activeLanguage?.Html ?? "";

    //     const sanitized = DOMPurify.sanitize(raw, {
    //         USE_PROFILES: { html: true },
    //     }).trim();

    //     const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(sanitized);

    //     if (!looksLikeHtml) {
    //         return sanitized.replace(/\n/g, "<br />");
    //     }

    //     return sanitized;
    // }, [activeLanguage]);

    const sanitizeHtml = (raw: string) => {
        const sanitized = DOMPurify.sanitize(raw || "", {
            USE_PROFILES: { html: true },
        }).trim();

        const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(sanitized);
        return looksLikeHtml ? sanitized : sanitized.replace(/\n/g, "<br />");
    };

    useEffect(() => {
        void loadPortalLanguages();
    }, [loadPortalLanguages]);

    useEffect(() => {
        return () => {
            pendingImages.forEach((img) => {
                if (img.PreviewUrl) URL.revokeObjectURL(img.PreviewUrl);
            });
        };
    }, [pendingImages]);

    const languageOptions = useMemo(
        () => portalLanguages.map((lang) => ({
            label: lang.Name,
            value: lang.Code,
        })),
        [portalLanguages]
    );

    const uploadChoice = watch("UploadChoice");
    const languages = watch("Languages");

    const isImageMode = uploadChoice === "IMAGE";

    // const blockStyle = (blocked: boolean) => ({
    //     opacity: blocked ? 0.5 : 1,
    //     pointerEvents: blocked ? ("none" as const) : ("auto" as const),
    //     filter: blocked ? "grayscale(0.15)" : "none",
    // });

    const setMode = async (mode: "IMAGE" | "FILE") => {
        setValue("UploadChoice", mode, {
            shouldDirty: true,
            shouldValidate: true,
        });

        if (mode === "IMAGE") {
            // Limpia archivos (estado RHF + UI)
            setValue("Attachments", [], { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            fileUploadRef.current?.clear?.();
            return;
        }

        const currenLanguages = getValues("Languages") ?? [];

        currenLanguages.forEach((_, index) => {
            setValue(`Languages.${index}.ImageFile`, null, {
                shouldDirty: true,
                shouldValidate: true,
            });

            setValue(`Languages.${index}.ImageUrl`, null, {
                shouldDirty: true,
                shouldValidate: true,
            });
        });

        setPendingImages((prev) => {
            prev.forEach((img) => {
                if (img.PreviewUrl) URL.revokeObjectURL(img.PreviewUrl);
            });
            return [];
        });

        imageUploadRef.current?.clear?.();
    };

    const onSelectFile = async (e: any) => {

        const files = (e.files ?? []) as File[];

        setValue("Attachments", files.map((file) => ({
            FileName: file.name,
            File: file,
            FileUlr: null,
        })),
            {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });

        await trigger("UploadChoice");

    };

    const clearLanguageImage = (languageCode: string) => {
        const currentLanguages = getValues("Languages");
        const langIndex = currentLanguages.findIndex((x) => x.Code === languageCode);
        if (langIndex < 0) return;

        setValue(`Languages.${langIndex}.ImageFile`, null, {
            shouldDirty: true,
            shouldValidate: true,
        });

        setValue(`Languages.${langIndex}.ImageUrl`, null, {
            shouldDirty: true,
            shouldValidate: true,
        });

        setPendingImages((prev) => prev.map((img) => img.AssignedLanguageCode === languageCode ? { ...img, AssignedLanguageCode: null } : img));
    };

    const show = (severity: "success" | "info" | "warn" | "error", summary: string, detail?: string) => {
        toastRef.current?.show({ severity, summary, detail, life: 3500 });
    };

    const onInvalid = () => {
        const currentErrors = form.formState.errors;

        // 1. Error de validación cruzada (el de Yup .test)
        if ((currentErrors as any).Images) {
            show("error", "Faltan Imágenes", (currentErrors as any).Images.message);
            // Opcional: podrías mover al usuario a la primera pestaña para que suba algo
            setActiveLanguageIndex(0);
            return;
        }
        if (currentErrors.Languages) {
            // 1. Obtenemos todas las llaves que tienen error (serán "0", "1", etc.)
            const errorKeys = Object.keys(currentErrors.Languages)
                .map(Number) // Convertimos a número
                .filter(n => !isNaN(n)); // Nos quedamos solo con los índices

            if (errorKeys.length > 0) {
                // 2. Ordenamos para ir al primer error real (el menor índice)
                const firstErrorIndex = Math.min(...errorKeys);

                // 3. Saltamos a la pestaña
                setActiveLanguageIndex(firstErrorIndex);

                show("warn", "Errores", "Revisa los campos marcados en el idioma correspondiente.");
            }
        }
    };

    const onSubmit = async (values: EmailTemplateFormValues) => {
        try {
            debugger;
            const payload = mapTemplateFormToPayload(values);
            const imageFiles = extractLanguageImageFiles(values);
            const attachmentFiles = extractAttachmentFiles(values);

            await EmailTemplateStore.create({
                payload,
                imageFiles,
                attachmentFiles,
            });

            show("success", "Exito", "Plantilla creada correctamente.");

            reset(createEmptyTempalteUIModel(portalLanguages) as any);
            setPendingImages([]);
            onCreated?.();
        } catch (err) {
            console.error(err);
            toastRef.current?.show({
                severity: "error",
                summary: "Error",
                detail: "No se pudo crear la plantilla.",
                life: 4000,
            });
        }
    };

    const mapTemplateFormToPayload = (values: EmailTemplateFormValues) => {
        return {
            Name: values.Name,
            ClickUrl: values.ClickUrl,
            ValidRange: values.ValidRange,
            uploadChoice: values.UploadChoice,

            Attachments: (values.Attachments ?? []).map((file) => ({
                Id: file.Id,
                FileName: file.FileName,
                FileUrl: file.FileUlr ?? null,
            })),

            Languages: Object.fromEntries(
                (values.Languages ?? []).map((lang) => [
                    lang.Code,
                    {
                        Subject: lang.Subject,
                        Html: lang.Html,
                        ImageUrl: lang.ImageUrl ?? null,
                    },
                ])
            ),
        };
    };

    const extractLanguageImageFiles = (values: EmailTemplateFormValues) => {
        return (values.Languages ?? [])
            .filter((lang) => !!lang.ImageFile)
            .map((lang) => ({
                Code: lang.Code,
                File: lang.ImageFile as File,
            }));
    };

    const extractAttachmentFiles = (values: EmailTemplateFormValues) => {
        return (values.Attachments ?? [])
            .filter((file) => !!file.File)
            .map((file) => ({
                FileName: file.FileName,
                File: file.File as File,
            }))
    }

    const valueTemplate = (opt?: TemplateOption) => {
        if (!opt) return <span>Selecciona una plantilla</span>;

        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" }}>
                <span style={{ fontWeight: 600 }}>{opt.label}</span>
            </div>
        );
    };

    const itemTemplate = (fileObj: object) => {
        const file = fileObj as File;

        const pending = pendingImages.find((x) => x.File === file);
        if (!pending) return null;

        return (
            <div className="grid">
                <div className="col-4 flex align-items-center">
                    <img
                        src={pending.PreviewUrl}
                        alt={pending.File.name}
                        style={{ maxWidth: 180, borderRadius: 8, marginRight: 10 }}
                    />
                    <label className="text-sm">{pending.File.name}</label>
                </div>


                <Divider layout="vertical" />

                <div className="col-4">
                    <Dropdown
                        value={pending.SelectedLanguageCode}
                        options={languageOptions}
                        placeholder="Selecciona idioma"
                        optionLabel="label"
                        optionValue="value"
                        valueTemplate={valueTemplate as any}
                        className="w-full"
                        panelClassName="mv-language-dropdown-panel"
                        itemTemplate={(option) => (
                            <div className="flex align-items-center gap-3">
                                <span className="font-medium">{option.label}</span>
                            </div>
                        )}
                        style={{ marginBottom: 10 }}
                        onChange={(e) => setPendingImageSelectedLanguage(pending.TempId, e.value ?? null)
                        }
                    />

                    <div className="flex align-items-center ap-2">
                        <div className="ml-auto flex gap-2">
                            <Button
                                type="button"
                                label="Asignar"
                                icon="pi pi-check"
                                onClick={() => assignImageToLanguage(pending.TempId)}
                                disabled={!pending.SelectedLanguageCode || pending.SelectedLanguageCode === pending.AssignedLanguageCode}
                            />

                            <Button
                                type="button"
                                label="Quitar"
                                icon="pi pi-times"
                                severity="secondary"
                                outlined
                                onClick={() => removePendingImage(pending.TempId ?? "")}

                            />
                        </div>
                    </div>
                </div>

                <div className="col-12 md:col-6">
                    <div className="flex align-items-center gap-2">
                        {pending.AssignedLanguageCode && (
                            <small>
                                Asignada a:{" "}
                                {portalLanguages.find((x) => x.Code === pending.AssignedLanguageCode)?.Name ?? pending.AssignedLanguageCode}
                            </small>
                        )}
                    </div>
                </div>
                <Divider />
            </div>
        );
    };

    const fileTemplate = (fileObj: object, option: any) => {

        const file = fileObj as File;

        const sameFile = (a: File, b: File) =>
            a.name === b.name &&
            a.size === b.size &&
            a.type === b.type &&
            a.lastModified === b.lastModified;


        const onRemove = async (e: any) => {

            e?.preventDefault?.();
            e?.stopPropagation?.();

            // 1) quita de la lista del FileUpload
            option?.removeElement?.props?.onClick?.(e);

            // 2) quita del estado RHF
            const current = getValues("Attachments") ?? [];

            const next = current.filter((f) => {
                const currentFile = f?.File;
                if (!currentFile) return true;

                return !sameFile(currentFile, file);
            });

            setValue("Attachments", next, { shouldDirty: true, shouldTouch: true, shouldValidate: true });

            // 3) revalida
            await trigger("UploadChoice");
        };

        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

        const removeBtn = React.isValidElement(option.removeElement)
            ? React.cloneElement(option.removeElement, { onClick: onRemove })
            : null;

        return (
            <div className="flex align-items-center justify-content-between w-full gap-2">
                <div className="flex align-items-center gap-3">
                    {option.previewElement}
                    <div className="flex flex-column">
                        <div><i className={`${resolveFileIcon(ext)} text-4xl pi-fw mr-2`} />{file.name}</div>
                        <small style={{ opacity: 0.7 }}>{Math.round(file.size / 1024)} KB</small>
                    </div>
                </div>
                <div className="flex align-items-center gap-2">
                    {removeBtn}
                </div>
            </div>
        );

    }

    return (
        <div className="p-3">
            <Toast ref={toastRef} />

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="formulario-usuario">
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <label className="block mb-1 font-semibold">Nombre</label>
                        <InputText className={`w-full ${errors.Name ? "p-invalid" : ""}`} {...register("Name")} />
                        {errors.Name?.message && <small className="p-error">{errors.Name.message}</small>}
                    </div>

                    <div className="col-12 md:col-6">
                        <label className="block- mb-1 font-semibold">Click URL</label>
                        <InputText className={`w-full ${errors.ClickUrl ? "p-invalid" : ""}`} {...register("ClickUrl")} />
                        {errors.ClickUrl?.message && <small className="p-error">{errors.ClickUrl.message}</small>}
                    </div>

                    <div className="col-12 md:col-6">
                        <label className="block mb-1 font-semibold">Vigencia (rango)</label>
                        <Controller
                            name="ValidRange"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Calendar
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    selectionMode="range"
                                    readOnlyInput
                                    hideOnRangeSelection
                                    showButtonBar
                                    showIcon
                                    dateFormat="dd-MM-yy"
                                    placeholder="Selecciona rango de fechas"
                                    className={classNames("w-full", { "p-invalid": fieldState.invalid })}
                                    panelClassName="mv-calendar-small"
                                />
                            )}
                        />
                        {errors.ValidRange?.message && <small className="p-error">{errors.ValidRange.message}</small>}
                    </div>

                    <div className="col-12 md:col-6">
                        <label className="block mb-1 font-semibold">Modo de carga</label>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                label="Imágenes"
                                icon="pi pi-images"
                                outlined={uploadChoice !== "IMAGE"}
                                onClick={() => setMode("IMAGE")}
                            />

                            <Button
                                type="button"
                                label="Archivos"
                                icon="pi pi-file"
                                outlined={uploadChoice !== "FILE"}
                                onClick={() => setMode("FILE")}
                            />
                        </div>

                        {errors.UploadChoice?.message && (
                            <small className="p-error">{String(errors.UploadChoice.message)}</small>
                        )}
                    </div>

                    <Divider />

                    <div className="col-12 md:col-5">
                        <TabView
                            activeIndex={activeLanguageIndex}
                            onTabChange={(e: TabViewTabChangeEvent) => setActiveLanguageIndex(e.index)}
                        >
                            {languages?.map((lang, index) => (
                                <TabPanel
                                    key={lang.Code}
                                    header={lang.Name ?? lang.Code}
                                >
                                    <div className="grid">
                                        <div className="col-12">
                                            <label>Asunto ({lang.Code})</label>
                                            <Controller
                                                control={control}
                                                name={`Languages.${index}.Subject`}
                                                render={({ field }) => (
                                                    <InputText
                                                        className={`w-full ${errors.Languages?.[index]?.Subject ? "p-invalid" : ""}`}
                                                        value={field.value ?? ""}
                                                        onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                                                        onBlur={field.onBlur}
                                                        ref={field.ref}
                                                        name={field.name}
                                                    />
                                                )}
                                            />
                                            {errors.Languages?.[index]?.Subject && (
                                                <small className="p-error">
                                                    {errors.Languages[index].Subject.message}
                                                </small>
                                            )}
                                        </div>
                                        <div className="col-12">
                                            <label>HTML ({lang.Code})</label>
                                            <Controller
                                                control={control}
                                                name={`Languages.${index}.Html`}
                                                render={({ field }) => (
                                                    <textarea
                                                        className={`w-full ${errors?.Languages?.[index]?.Html ? "p-invalid" : ""}`}
                                                        style={{ minHeight: 160 }}
                                                        value={field.value ?? ""}
                                                        onChange={(e) => field.onChange(e.target.value)}
                                                        onBlur={field.onBlur}
                                                        ref={field.ref}
                                                        name={field.name}
                                                    />
                                                )}
                                            />
                                            {errors.Languages?.[index]?.Html && (
                                                <small className="p-error">
                                                    {errors.Languages[index].Html.message}
                                                </small>
                                            )}
                                        </div>
                                        <div className="col-12">
                                            <TemplateHybridPreviewIFrame
                                                lang={lang?.Code ?? ""}
                                                title={lang.Subject}
                                                htmlRaw={sanitizeHtml(lang.Html ?? "")}
                                                imageUrl={lang.ImageUrl ?? undefined}
                                            />
                                        </div>
                                    </div>
                                    {lang.ImageUrl && (
                                        <div className="flex align-items-end gap-2 mt-2"> {/* Cambié stretch por end */}
                                            {/* Imagen */}
                                            <img
                                                src={lang.ImageUrl}
                                                alt="Preview"
                                                style={{
                                                    maxWidth: 250,
                                                    borderRadius: 8,
                                                    marginTop: 10,
                                                    display: 'block' // Evita espacios fantasmas debajo de la imagen
                                                }}
                                            />

                                            {/* Contenedor del botón */}
                                            <div className="flex">
                                                <Button
                                                    label="Quitar imagen"
                                                    icon="pi pi-times"
                                                    size="small"
                                                    outlined
                                                    onClick={() => clearLanguageImage(lang.Code)}
                                                    className="p-button-sm" // Asegura que sea compacto
                                                />
                                            </div>
                                        </div>
                                    )}

                                </TabPanel>
                            ))}
                        </TabView>
                    </div>

                    <Divider layout="vertical" />

                    <div className="col-12 md:col-6">
                        {isImageMode ? (
                            <div className="mt-4">
                                <label className="block mb-2 font-semibold">Imágenes por idioma</label>
                                <FileUpload
                                    ref={imageUploadRef}
                                    mode="advanced"
                                    multiple
                                    accept=".jpg,.jpeg,.png"
                                    maxFileSize={2_000_000}
                                    customUpload
                                    auto={false}
                                    chooseLabel="Elegir"
                                    onSelect={onSelectImage}
                                    itemTemplate={itemTemplate}
                                    uploadOptions={{ style: { display: "none" } }}
                                    cancelOptions={{ style: { display: "none" } }}
                                    emptyTemplate={<p className="m-0"> Arrastra la imagen aquí o presiona "Elegir"</p>}
                                />
                                {(errors as any).Images && (
                                    <div className="col-12">
                                        <small className="p-error block mb-2" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                            <i className="pi pi-exclamation-triangle mr-2"></i>
                                            {(errors as any).Images.message}
                                        </small>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-4">
                                <label className="block mb-2 font-semibold">Archivos adjuntos</label>
                                <FileUpload
                                    ref={fileUploadRef}
                                    mode="advanced"
                                    multiple
                                    accept=".pdf,.docx,.doc"
                                    maxFileSize={2_000_000}
                                    customUpload
                                    auto={false}
                                    chooseLabel="Elegir"
                                    onSelect={onSelectFile}
                                    itemTemplate={fileTemplate}
                                    uploadOptions={{ style: { display: "none" } }}
                                    cancelOptions={{ style: { display: "none" } }}
                                    emptyTemplate={<p className="m-0">Arrastra el archivo aquí o presiona "Elegir"</p>}
                                />
                            </div>
                        )}
                    </div>

                    {/* ES Y EN
                    <div className="col-12 flex gap-2 align-items-center">
                        <div className="col-6 flex gap-2 align-items-center">
                            <Button
                                type="button"
                                label="ES"
                                outlined={lang !== "ES"}
                                onClick={() => setLang("ES")}
                                size="small"
                            />
                            <Button
                                type="button"
                                label="EN"
                                outlined={lang !== "EN"}
                                onClick={() => setLang("EN")}
                                size="small"
                            />
                        </div>
                        <div className="col-6 flex gap-2 align-items-center">
                            <Button
                                type="button"
                                label="Imágenes"
                                outlined={uploadChoice !== "IMAGE"}
                                onClick={() => setMode("IMAGE")}
                                size="small"
                            />
                            <Button
                                type="button"
                                label="Archivos"
                                outlined={uploadChoice !== "FILE"}
                                onClick={() => setMode("FILE")}
                                size="small"
                            />
                        </div>
                    </div>
                    {uploadChoice === "IMAGE" ? (
                        <div className="mt-3">
                            <div className="mv-label">Imágenes por idioma</div>
                        </div>
                    ): (
                        <>
                        </>
                    )}
                    <div className="col-12 md:col-6" style={blockStyle(!isImageMode)}>
                        <label className="block mb-1 font-semibold">Imagen</label>
                        <FileUpload
                            ref={imageUploadRef}
                            mode="advanced"
                            multiple
                            accept=".jpg,.jpeg,.png"
                            maxFileSize={2_000_000}
                            customUpload
                            auto={false}
                            chooseLabel="Elegir"
                            onSelect={onSelectImage}
                            itemTemplate={itemTemplate}
                            uploadOptions={{ style: { display: "none" } }}
                            cancelOptions={{ style: { display: "none" } }}
                            emptyTemplate={<p className="m-0"> Arrastra la imagen aquí o presiona "Elegir"</p>}
                        />

                        <div className="flex gap-2 mt-2">
                            <Button
                                type="button"
                                size="small"
                                outlined
                                label={`Quitar imagen ${lang}`}
                                onClick={() => clearLangImage(lang)}
                                disabled={!imagePreviewUrlByLang[lang] && !emailImageSrcByLang[lang]}
                            />
                        </div>

                        {isImageMode && errors?.UploadChoice?.message && (
                            <small className="p-error">{errors.UploadChoice.message as string}</small>
                        )}

                        {imagePreviewUrlByLang[lang] && (
                            <div className="mt-3">
                                <div className="font-semibold mb-2">Preview</div>
                                <img src={imagePreviewUrlByLang[lang]} alt="Preview" style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8 }} />
                            </div>
                        )}
                    </div>
                    <div className="col-12 md:col-4" style={blockStyle(!isFileMode)}>
                        <label className="block mb-1 font-semibold">Archivo(s) Adjunto(s)</label>
                        <FileUpload
                            ref={fileUploadRef}
                            mode="advanced"
                            multiple
                            accept=".pdf,.docx,.doc"
                            maxFileSize={2_000_000}
                            customUpload
                            auto={false}
                            chooseLabel="Elegir"
                            onSelect={onSelectFile}
                            itemTemplate={fileTemplate}
                            uploadOptions={{ style: { display: "none" } }}
                            cancelOptions={{ style: { display: "none" } }}
                            emptyTemplate={<p className="m-0"> Arrastra el archivo aquí o presiona "Elegir"</p>}
                        />

                        {isFileMode && errors?.UploadChoice?.message && (
                            <small className="p-error">{errors.UploadChoice.message as string}</small>
                        )}

                    </div>
                    <div className="col-12" ref={langFieldsRef}>
                        <div className="grid">
                            {lang === "ES" ? (
                                <LangFields key="ES" lang="ES"
                                    control={control} errors={errors} />
                            ) : (
                                <LangFields key="EN" lang="EN"
                                    control={control} errors={errors} />
                            )}
                        </div>
                    </div> */}
                </div>
                {/*PREVIEW */}
                {/* <div className="col-12 border-1">
                    <label className="block mb-1 font-semibold">Preview</label>
                    <div className="p-3 surface-border border-round">
                        <TemplateHybridPreviewIFrame
                            lang={lang}
                            title={(lang === "ES" ? watch("ES.Subject") : watch("EN.Subject")) ?? ""}
                            htmlRaw={htmlPreview ?? ""}
                            imageUrl={emailImageSrcByLang[lang] || undefined}
                        />
                    </div>
                </div> */}
                <div className="col-12 flex justify-content-end mt-2">
                    <Button
                        type="submit"
                        label={isSubmitting ? "Guardando..." : "Guardar Plantilla"}
                        disabled={isSubmitting}
                        icon="pi pi-save"
                    />
                </div>
            </form>
        </div>
    )
}


// function LangFields(props: {
//     lang: LangKey;
//     control: any;
//     errors: any;
// }) {

//     const { lang, control, errors } = props;

//     return (
//         <>
//             <div className="col-12 md:col-6">
//                 <label className="block mb-1 font-semibold">Asunto ({lang})</label>
//                 <Controller
//                     name={`${lang}.Subject`}
//                     control={control}
//                     render={({ field }) => (
//                         <InputText
//                             className={`w-full ${errors?.[lang]?.Subject ? "p-invalid" : ""}`}
//                             value={field.value ?? ""}
//                             onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
//                             onBlur={field.onBlur}
//                             ref={field.ref}
//                             name={field.name}
//                         />
//                     )}
//                 />
//                 {errors?.[lang]?.Subject?.message && (
//                     <small className="p-error">{errors[lang].Subject.message}</small>
//                 )}
//             </div>
//             <div className="col-12">
//                 <label className="block mb-1 font-semibold">HTML ({lang})</label>
//                 <Controller
//                     name={`${lang}.Html`}
//                     control={control}
//                     render={({ field }) => (
//                         <textarea
//                             className={`w-full ${errors?.[lang]?.Html ? "p-invalid" : ""}`}
//                             style={{ minHeight: 160 }}
//                             value={field.value ?? ""}
//                             onChange={(e) => field.onChange(e.target.value)}
//                             onBlur={field.onBlur}
//                             ref={field.ref}
//                             name={field.name}
//                         />
//                     )}
//                 />
//                 {errors?.[lang]?.Html?.message && (
//                     <small className="p-error">{errors[lang].Html.message}</small>
//                 )}
//             </div>

//         </>
//     );
// }