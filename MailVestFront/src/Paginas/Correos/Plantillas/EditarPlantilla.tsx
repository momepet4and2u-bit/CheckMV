/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from "react-router";
import toAbsouluteUrl from "../../../Utils/toAbsouluteUrl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { type EmailTemplateDraft } from "./Templates/emailTemplate.schema";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import DOMPurify from "dompurify";
import EmailTemplateStore from "./Templates/emailTemplates.store";
import { FileUpload } from "primereact/fileupload";
import fileToDataUrl from "../../../Helpers/fileToDataURL";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { classNames } from "primereact/utils";
import { maeOnInvalidSwitchKey } from "../../../Utils/hasErrorForms";
import { createHubConnection } from "../../../Hooks/useSignalR";
import { useAuth } from "../../../Context/UserContext/AuthContext";
import { emailTemplateUpdateSchema } from "./Templates/emailTemplateUpdate.schema";
import { resolveFileIcon } from "../../../Helpers/iconsAttachment";
import { InputTextarea } from "primereact/inputtextarea";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import TemplateHybridPreviewIFrame from "../../../Componentes/Text/TemplateHybridPreviewIFrame";


type LangKey = "ES" | "EN";
type UploadMode = "IMAGE" | "FILE";

const Lang_Paths = {
    ES: ["ES.Subject", "ES.Html", "ImagenES"],
    EN: ["EN.Subject", "EN.Html", "ImagenEN"],
} as const;

type Lang = keyof typeof Lang_Paths;

type TemplateApi = {
    Id: number;
    Name: string;
    ClickUrl: string;

    ValidoDesde: string;
    ValidoHasta: string;

    ES: { Subject: string; Html: string };
    EN: { Subject: string; Html: string };

    ImageUrlES?: string;
    ImageUrlEN?: string;

    Attachment?: any[];

    Bloqueado: boolean;
    EditLocked: boolean;
};

type AttachmentPreview = {
    id: string;
    name: string;
    extension: string;
    url: string;
    relativePath?: string;
}

type ServerAttachment = {
    FileName: string;
    RelativePath: string;
}

const parseYmdToDate = (ymd?: string) => {
    if (!ymd) return null;

    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return null
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);

    return new Date(y, mo, d);
}

export default function EditarPlantilla() {

    const { id } = useParams();
    const templateId = Number(id);
    const navigate = useNavigate();

    const { token, user } = useAuth();

    const toastRef = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);

    const [lang, setLang] = useState<LangKey>("ES");

    const [serverImgUrl, setServerImgUrl] = useState<Record<LangKey, string>>({ ES: "", EN: "" });
    const [imagePreviewUrlByLang, setImagePreviewUrlByLang] = useState<Record<LangKey, string>>({ ES: "", EN: "" });

    const [emailImageSrc, setEmailImageSrc] = useState<Record<LangKey, string>>({ ES: "", EN: "" });

    //ARCHIVOS
    const [serverFiles, setServerFiles] = useState<ServerAttachment[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);

    const fileUrlCacheRef = useRef<Map<string, string>>(new Map());

    const fileSig = (f: File) => `${f.name}|${f.size}|${f.type}|${f.lastModified}`;

    const getOrCreateObjUrl = (f: File) => {
        const sig = fileSig(f);
        const cache = fileUrlCacheRef.current;
        const existing = cache.get(sig);
        if (existing) return existing;

        const url = URL.createObjectURL(f);
        cache.set(sig, url);
        return url;
    };

    const revokeObjectURL = (f: File) => {
        const sig = fileSig(f);
        const cache = fileUrlCacheRef.current;
        const url = cache.get(sig);
        if (url) {
            URL.revokeObjectURL(url);
            cache.delete(sig);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [enEdicion, setEnEdicion] = useState(false);
    const [enEdicionPor, setEnEdicionPor] = useState<string | null>(null);
    const [soloLectura, setSoloLectura] = useState(false);

    const [bloqueado, setBloqueado] = useState(false);

    const renewRef = useRef<number | null>(null);

    const defaultValues: EmailTemplateDraft = useMemo(
        () => ({
            Name: "",
            ClickUrl: "",
            ValidRange: null,
            ImagenEN: null,
            ImagenES: null,
            Archivo: [],
            DeletedServerUrls: [],
            ES: { Subject: "", Html: "" },
            EN: { Subject: "", Html: "" },
        }) as any,
        []
    );

    const {
        control,
        register,
        reset,
        trigger,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EmailTemplateDraft>({
        resolver: yupResolver(emailTemplateUpdateSchema) as any,
        defaultValues,
        mode: "onBlur",
    });

    const esHtml = useWatch({ control, name: "ES.Html" });
    const enHtml = useWatch({ control, name: "EN.Html" });

    const [uploadMode, setUploadMode] = useState<UploadMode>("IMAGE");

    const htmlPreview = useMemo(() => {
        const raw = (lang === 'ES' ? esHtml : enHtml) || '';

        // 1) Sanitiza
        const sanitized = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } }).trim();

        // 2) ¿Parece HTML? (heurística simple)
        const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(sanitized);

        // 3) Si NO parece HTML => convierte \n => <br/>
        if (!looksLikeHtml) {
            return sanitized.replace(/\n/g, '<br />');
        }

        // 4) Si SÍ parece HTML => (opcional) limpia \n sueltos para evitar espacios raros
        //    O simplemente deja tal cual:
        return sanitized;

    }, [lang, esHtml, enHtml]);

    const fullEmailImageSrc = useMemo(() => {

        return emailImageSrc[lang] || serverImgUrl[lang] || "";

    }, [emailImageSrc, serverImgUrl, lang]);


    const mapFileToPreview = (file: File): AttachmentPreview => {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

        return {
            id: fileSig(file),
            name: file.name,
            extension: ext,
            url: getOrCreateObjUrl(file),
        };
    };

    const mapServerFileToPreview = (f: ServerAttachment): AttachmentPreview => {
        const extension = f.FileName.split(".").pop()?.toLowerCase() ?? "";

        return {
            id: f.RelativePath,
            name: f.FileName,
            extension,
            url: toAbsouluteUrl(f.RelativePath),
            relativePath: f.RelativePath,
        };
    };

    const attachmentPreviews: AttachmentPreview[] = [
        ...serverFiles.map(mapServerFileToPreview),
        ...newFiles.map(mapFileToPreview),
    ];

    const onDeleteAttachment = async (file: AttachmentPreview) => {

        if (file.relativePath) {
            setServerFiles((prev) => prev.filter((x) => x.RelativePath !== file.relativePath));

            const currentDeleted = (getValues("DeletedServerUrls") ?? []) as string[];
            const nextDeleted = currentDeleted.includes(file.url)
                ? currentDeleted
                : [...currentDeleted, file.url];

            setValue("DeletedServerUrls" as any, nextDeleted as any, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });

            await trigger("UploadChoice");
            return;
        }

        const targetId = file.id;

        setNewFiles((prev) => {
            const keep: File[] = [];
            for (const f of prev) {
                if (fileSig(f) === targetId) {
                    revokeObjectURL(f);
                } else {
                    keep.push(f);
                }
            }
            return keep;
        });

        const current = (getValues("Archivo") ?? []) as any[];
        const next = current.filter((x) => !(x instanceof File) || fileSig(x) !== targetId);

        setValue("Archivo", next as any, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });

        await trigger("UploadChoice");
    }

    const detectUploadMode = (tpl: TemplateApi): UploadMode => {
        const hasImg = !!tpl.ImageUrlES || !!tpl.ImageUrlEN;

        // Soporta Archivo como array (de lo que sea). Lo importante es la longitud.
        const hasFiles =
            Array.isArray(tpl.Attachment) && tpl.Attachment.length > 0;

        // Si tu negocio garantiza exclusividad, esto es suficiente.
        if (hasImg && !hasFiles) return "IMAGE";
        if (hasFiles && !hasImg) return "FILE";

        // Fallback (si API no manda archivos): si hay imagen, IMAGE; si no, FILE
        return hasImg ? "IMAGE" : "FILE";
    };

    useEffect(() => {
        if (!Number.isFinite(templateId) || templateId <= 0) {
            toastRef.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Id invalido",
                life: 4000
            });
            return;
        }

        (async () => {
            try {
                const tpl = (await EmailTemplateStore.getById(templateId)) as unknown as TemplateApi;

                const mode = detectUploadMode(tpl);
                setUploadMode(mode);

                if (!tpl) {
                    toastRef.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Plantilla no encontrada",
                        life: 4000
                    });
                    return;
                }

                const form = parseYmdToDate(tpl.ValidoDesde);
                const to = parseYmdToDate(tpl.ValidoHasta);

                reset({
                    Name: tpl.Name ?? "",
                    ClickUrl: tpl.ClickUrl ?? "",
                    ValidRange: [form, to],
                    ES: { Subject: tpl.ES?.Subject ?? "", Html: tpl.ES?.Html ?? "" },
                    EN: { Subject: tpl.EN?.Subject ?? "", Html: tpl.EN?.Html ?? "" },
                    ImagenES: null,
                    ImagenEN: null,
                    Archivo: [],
                    DeletedServerUrls: [],
                    Bloqueado: tpl.Bloqueado,
                } as any);

                setBloqueado(tpl.Bloqueado);

                setServerImgUrl({
                    ES: toAbsouluteUrl(tpl.ImageUrlES),
                    EN: toAbsouluteUrl(tpl.ImageUrlEN),
                });

                setImagePreviewUrlByLang({
                    ES: "",
                    EN: "",
                });
                setEmailImageSrc({
                    ES: "",
                    EN: "",
                });

                setServerFiles(tpl.Attachment ?? []);
                setNewFiles([]);

                const lock = await EmailTemplateStore.lockEdit(templateId);

                setEnEdicion(lock.EnEdicion);
                setEnEdicionPor(lock.EnEdicionPor ?? null);

                if (lock.EnEdicion && !lock.IsOwner) {
                    setSoloLectura(true);
                    toastRef.current?.show({
                        severity: 'warn',
                        summary: 'Plantilla en edicion.',
                        detail: `Otro usuario esta editando esta plantilla ${lock.EnEdicionPor ? `(${lock.EnEdicionPor})` : ""}.`,
                        life: 5000,
                    });
                    return;
                }

                setSoloLectura(false);

                renewRef.current = window.setInterval(async () => {
                    try {
                        await EmailTemplateStore.lockEdit(templateId);
                    } catch {
                        if (renewRef.current) window.clearInterval(renewRef.current);
                        renewRef.current = null;

                        await EmailTemplateStore.unlockEdit(templateId).catch(() => { });
                    }
                }, 90_000);
            } catch (err: any) {
                console.error(err);
                toastRef.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "No se pudo cargar la plantilla",
                    life: 4000
                });
            }
        })();
        return () => {
            if (renewRef.current) {
                window.clearInterval(renewRef.current);
                renewRef.current = null;
            }
        };
    }, [templateId, reset, user]);

    useEffect(() => {
        if (!Number.isFinite(templateId) || templateId <= 0) {
            toastRef.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Id invalido",
                life: 4000
            });
            return;
        }

        let mounted = true;

        const conn = createHubConnection(() => token ?? "");

        const start = async () => {
            try {
                await conn.start();
                await conn.invoke("Join", `plantilla-${templateId}`);

                conn.on(
                    "plantillaBloqueadaCambio",
                    (payload: { id: number; bloqueado: boolean }) => {
                        if (!mounted) {
                            return;
                        }
                        if (payload.id !== templateId) {
                            return;
                        }
                        setBloqueado(payload.bloqueado);

                        if (payload.bloqueado) {
                            toastRef.current?.show({
                                severity: 'warn',
                                summary: "Plantilla bloqueada",
                                detail: "Otro usuario creó un draft con esta plantilla.",
                                life: 5000,
                            });
                        }
                    }
                );
                conn.on("plantillaEdicionCambio", (data) => {
                    if (data.id !== templateId) {
                        return
                    }
                    setEnEdicion(data.enEdicion);
                    setEnEdicionPor(data.enEdicionPor ?? null);
                    
                    if(data.isOwner){
                        if(!data.isOwner){
                            setSoloLectura(false);
                            return;
                        }
                    }
                    if (data.enEdicionPor && data.enEdicionPor !== user?.Usuario) {
                        setSoloLectura(true);
                        return;
                    }
                    if(!data.enEdicion){
                        setSoloLectura(false);
                        return;
                    }
                });
            } catch (err) {
                console.error("SignalR error: ", err);
            }
        };
        start();

        return () => {
            mounted = false;
            conn.stop();
        };
    }, [templateId, token, user])

    useEffect(() => {
        return () => {
            (Object.values(imagePreviewUrlByLang) as string[]).forEach((u) => u && URL.revokeObjectURL(u));
        };
    }, [imagePreviewUrlByLang]);

    const onSelectImage = () => {
    };

    const onSelectFile = async (e: any) => {
        if (uploadMode !== "FILE") return;

        const picked: File[] = e.files ?? [];

        setNewFiles((prev) => [...prev, ...picked]);

        const current = (getValues("Archivo") ?? []) as any[];
        const next = [...current, ...picked];

        setValue("Archivo", next as any, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    };

    const assignFileToLang = async (target: LangKey, file: File, removeFromList?: () => void) => {

        const fieldName = target === "ES" ? "ImagenES" : "ImagenEN";

        setValue(fieldName as any, file, { shouldValidate: true, shouldDirty: true });

        setImagePreviewUrlByLang((prev) => {
            if (prev[target]) URL.revokeObjectURL(prev[target]);
            return { ...prev, [target]: URL.createObjectURL(file) };
        });

        const dataUrl = await fileToDataUrl(file);
        setEmailImageSrc((prev) => ({ ...prev, [target]: dataUrl }));

        removeFromList?.();
    };

    const onClearImage = (target: LangKey) => {
        const fieldName = target === "ES" ? "ImagenES" : "ImagenEN";
        setValue(fieldName as any, null, { shouldValidate: true, shouldDirty: true });

        setImagePreviewUrlByLang((prev) => {
            if (prev[target]) URL.revokeObjectURL(prev[target]);
            return { ...prev, [target]: "" };
        });

        setEmailImageSrc((prev) => ({ ...prev, [target]: "" }));
    };


    const show = (severity: "success" | "info" | "warn" | "error", summary: string, detail?: string) => {
        toastRef.current?.show({ severity, summary, detail, life: 3500 });
    };

    const onSubmit = async (values: EmailTemplateDraft) => {
        try {
            const payload: EmailTemplateDraft = { ...values };

            if (uploadMode === "IMAGE") {
                payload.Archivo = []; // ✅ fuerza exclusividad
            } else {
                payload.ImagenES = null; // ✅ fuerza exclusividad
                payload.ImagenEN = null;
            }

            await EmailTemplateStore.update(templateId, payload);
            show("success", "Exito", "Plantilla actualizada correctamente.");
            navigate("/Plantillas");
        } catch (err) {
            console.error(err);
            show("error", "Error", "No se pudo actualizar la plantilla.");
        }
    };

    const unlock = () => {
        navigate("/Plantillas");
        EmailTemplateStore.unlockEdit(templateId).catch(() => { });
    }

    const itemTemplate = (fileObj: object, option: any) => {
        const file = fileObj as File;

        const removeRow = () => {
            option?.removeElement?.props?.onClick?.();
        };

        return (
            <div className="flex align-items-center justify-content-between w-full gap-2">
                <div className="flex align-items-center gap-3">
                    {option.previewElement}
                    <div className="flex flex-column">
                        <div>{file.name}</div>
                        <small style={{ opacity: 0.7 }}>{Math.round(file.size / 1024)} KB</small>
                    </div>
                </div>

                <div className="flex align-items-center gap-2">
                    <Button
                        type="button"
                        size="small"
                        label="ES"
                        onClick={() => assignFileToLang("ES", file, removeRow)}
                    />
                    <Button
                        type="button"
                        size="small"
                        label="EN"
                        onClick={() => assignFileToLang("EN", file, removeRow)}
                    />
                    {option.removeElement /* X */}
                </div>
            </div>
        );
    };

    const imageErrorMsg = lang === "ES" ? errors.ImagenES?.message : errors.ImagenEN?.message;

    const imageHasError = !!imageErrorMsg;

    const onInvalid = maeOnInvalidSwitchKey<EmailTemplateDraft, Lang>({
        getCurrentKey: () => lang,
        setKey: setLang,
        keyToPaths: Lang_Paths,
        order: ["ES", "EN"],
        onInvalid: () => {
            show("warn", "Errores", "Hay errores de validación. Revisa los campos marcados.");
        }
    })

    return (
        <div className="p-3">
            <Toast ref={toastRef} />

            <div className="flex align-items-center justify-content-between mb-3">
                <div className="text-x1 font-semibold">
                    Editar Plantilla - Tipo de plantilla: {" "} {uploadMode === "IMAGE" ? "Imágenes" : "Archivos"}
                </div>
                <Button
                    type="button"
                    label="Volver"
                    icon="pi pi-arrow-left"
                    outlined
                    onClick={() => unlock()} />

            </div>

            {soloLectura && (
                <div className="p-2 mb-3 border-1 surface-border border-round">
                    <b>Solo lectura</b>
                    <div style={{ opacity: 0.8 }}>
                        Esta plantilla esta siendo editada por {" "}<b>{enEdicionPor ?? "otro usuario"}</b>. No puedes realizar/guardar cambios.
                    </div>
                </div>
            )}

            <form className="grid" onSubmit={handleSubmit(onSubmit, onInvalid)}>
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
                <div className="col-12 md:col-6 flex align-items-end gap-2">
                    <Button type="button" label="ES" outlined={lang !== "ES"} onClick={() => setLang("ES")} />
                    <Button type="button" label="EN" outlined={lang !== "EN"} onClick={() => setLang("EN")} />
                </div>

                {uploadMode === "FILE" && uploadMode ? (
                    <div className="grid col-12">
                        <div className="col-12 md:col-5">
                            <Card
                                className="mv-card"
                                title="Archivos adjuntos"
                                subTitle="Carga o elimina adjuntos para esta plantilla">
                                <div className="flex flex-column gap-3">
                                    <div>
                                        <label className="block mb-2 font-semibold">Adjuntar archivos</label>

                                        <div className="file-picker-card">
                                            <FileUpload
                                                ref={fileUploadRef}
                                                className="fu-picker-only"
                                                mode="advanced"
                                                multiple
                                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                                maxFileSize={2_000_000}
                                                customUpload
                                                auto={false}
                                                chooseLabel="Elegir"
                                                onSelect={onSelectFile}
                                                uploadOptions={{ style: { display: "none" } }}
                                                cancelOptions={{ style: { display: "none" } }}
                                                emptyTemplate={null}
                                            />
                                            <div className="file-picker-hint">
                                                Arrastra y suelta aquí o presiona <b>Elegir</b>
                                            </div>
                                        </div>
                                        {errors.Archivo?.message && (
                                            <small className="p-error">{errors.Archivo.message}</small>
                                        )}
                                    </div>

                                    <Divider className="my-2" />

                                    <AttachmentPreviewList files={attachmentPreviews} onDelete={onDeleteAttachment} />
                                </div>
                            </Card>
                        </div>

                        <div className="col-12 lg:col-7">
                            <Card className="mv-card" title="Contenido del correo">
                                <div className="grid">
                                    <div className="col-12">
                                        <label className="block mb-2 font-semibold">Asunto ({lang})</label>
                                        <div style={{ display: lang === "ES" ? "block" : "none" }}>
                                            <Controller
                                                name="ES.Subject"
                                                control={control}
                                                render={({ field }) => (
                                                    <InputText
                                                        className={classNames("w-full", { "p-invalid": !!(errors as any)?.[lang]?.Subject })}
                                                        value={field.value}
                                                        onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                                                    />
                                                )}
                                            />
                                            {(errors as any)?.[lang]?.Subject?.message && (
                                                <small className="p-error">{String((errors as any)[lang].Subject.message)}</small>
                                            )}
                                        </div>
                                        <div style={{ display: lang === "EN" ? "block" : "none" }}>
                                            <Controller
                                                name="EN.Subject"
                                                control={control}
                                                render={({ field }) => (
                                                    <InputText
                                                        className={classNames("w-full", { "p-invalid": !!(errors as any)?.[lang]?.Subject })}
                                                        value={field.value}
                                                        onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                                                    />
                                                )}
                                            />
                                            {(errors as any)?.[lang]?.Subject?.message && (
                                                <small className="p-error">{String((errors as any)[lang].Subject.message)}</small>
                                            )}
                                        </div>
                                        <div style={{ display: lang === "EN" ? "block" : "none" }}>
                                            <Controller
                                                name="EN.Html"
                                                control={control}
                                                render={({ field }) => (
                                                    <InputTextarea
                                                        className={classNames("w-full", { "p-invalid": !!(errors as any)?.[lang]?.Subject })}
                                                        style={{ minHeight: 160 }}
                                                        value={field.value}
                                                        onChange={(e) => field.onChange((e.target as HTMLTextAreaElement).value)}
                                                    />
                                                )}
                                            />
                                            {(errors as any)?.[lang]?.Html?.message && (
                                                <small className="p-error">{String((errors as any)[lang].Html.message)}</small>
                                            )}
                                        </div>
                                        <div style={{ display: lang === "ES" ? "block" : "none" }}>
                                            <Controller
                                                name="ES.Html"
                                                control={control}
                                                render={({ field }) => (
                                                    <InputTextarea
                                                        className={classNames("w-full", { "p-invalid": !!(errors as any)?.[lang]?.Subject })}
                                                        style={{ minHeight: 160 }}
                                                        value={field.value}
                                                        onChange={(e) => field.onChange((e.target as HTMLTextAreaElement).value)}
                                                    />
                                                )}
                                            />
                                            {(errors as any)?.[lang]?.Html?.message && (
                                                <small className="p-error">{String((errors as any)[lang].Html.message)}</small>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="font-semibold mb-2">Preview correo completo ({lang})</div>
                                <div className="p-3 border-1 surface-border border-round" style={{ maxHeight: 520, overflow: "auto" }}>
                                    <TemplateHybridPreviewIFrame
                                        lang={lang as any}
                                        title={(lang === "ES" ? "Estimado {0}" : "Dear {0}")}
                                        htmlRaw={htmlPreview ?? ""}
                                        imageUrl={fullEmailImageSrc || undefined}
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid col-12">
                            <div className="col-12 md:col-6">
                                <Card
                                    className="mv-card"
                                    title="Imagenes adjuntas"
                                    subTitle="Carga o elimina imagenes adjuntas para esta plantilla">
                                    <div className="flex flex-column gap-3">
                                        <div>
                                            <label className="block mb-1 font-semibold">Imagen</label>
                                            <FileUpload
                                                mode="advanced"
                                                accept="image/*"
                                                multiple
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
                                            {imageHasError ? <small className="p-error">{imageErrorMsg}</small> : null}
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    type="button"
                                                    size="small"
                                                    outlined
                                                    label={`Quitar imagen ${lang}`}
                                                    onClick={() => onClearImage(lang)}
                                                    disabled={!imagePreviewUrlByLang[lang] && !emailImageSrc[lang]}
                                                />
                                            </div>
                                            {imagePreviewUrlByLang[lang] ? (
                                                <div className="mt-3">
                                                    <div className="font-semibold mb-2"> Preview Archivo ({lang})</div>
                                                    <img
                                                        src={imagePreviewUrlByLang[lang]}
                                                        alt="Preview"
                                                        style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8 }}
                                                    />
                                                </div>
                                            ) : null}

                                            {!imagePreviewUrlByLang[lang] && serverImgUrl[lang] ? (
                                                <div className="mt-3">
                                                    <div className="font-semibold mb-2"> Imagen Actual</div>
                                                    <img
                                                        src={serverImgUrl[lang]}
                                                        alt="Preview"
                                                        style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8 }}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            <div className="col-12 md:col-6">
                                <Card
                                    className="mv-card"
                                    title="Contenido del correo">
                                    <div className="grid">
                                        <div className="col-12">
                                            <label className="block mb-1 font-semibold">Asunto ({lang})</label>
                                            <div style={{ display: lang === "ES" ? "block" : "none" }}>
                                                <Controller
                                                    name="ES.Subject"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <InputText
                                                            className={classNames("w-full", { "p-invalid": !!(errors as any)?.[lang]?.Subject })}
                                                            value={field.value}
                                                            onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                                                        />
                                                    )}
                                                />
                                                {(errors as any)?.[lang]?.Subject?.message && (
                                                    <small className="p-error">{String((errors as any)[lang].Subject.message)}</small>
                                                )}
                                            </div>
                                            <div style={{ display: lang === "EN" ? "block" : "none" }}>
                                                <Controller
                                                    name="EN.Subject"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <InputText
                                                            className={classNames("w-full", { "p-invalid": !!(errors as any)?.[lang]?.Subject })}
                                                            value={field.value}
                                                            onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                                                        />
                                                    )}
                                                />
                                                {(errors as any)?.[lang]?.Subject?.message && (
                                                    <small className="p-error">{String((errors as any)[lang].Subject.message)}</small>
                                                )}
                                            </div>
                                            <div style={{ display: lang === "EN" ? "block" : "none" }}>
                                                <Controller
                                                    name="EN.Html"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <InputTextarea
                                                            className={classNames("w-full", { "p-invalid": !!(errors as any)?.[lang]?.Subject })}
                                                            style={{ minHeight: 160 }}
                                                            value={field.value}
                                                            onChange={(e) => field.onChange((e.target as HTMLTextAreaElement).value)}
                                                        />
                                                    )}
                                                />
                                                {(errors as any)?.[lang]?.Html?.message && (
                                                    <small className="p-error">{String((errors as any)[lang].Html.message)}</small>
                                                )}
                                            </div>
                                            <div style={{ display: lang === "ES" ? "block" : "none" }}>
                                                <Controller
                                                    name="ES.Html"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <InputTextarea
                                                            className={classNames("w-full", { "p-invalid": !!(errors as any)?.[lang]?.Subject })}
                                                            style={{ minHeight: 160 }}
                                                            value={field.value}
                                                            onChange={(e) => field.onChange((e.target as HTMLTextAreaElement).value)}
                                                        />
                                                    )}
                                                />
                                                {(errors as any)?.[lang]?.Html?.message && (
                                                    <small className="p-error">{String((errors as any)[lang].Html.message)}</small>
                                                )}
                                            </div>
                                        </div>
                                        <Divider />
                                        <div className="col-12">
                                            <div className="font-semibold mb-2">Preview correo completo ({lang})</div>
                                            <div className="p-3 border-1 surface-border border-round">
                                                <TemplateHybridPreviewIFrame
                                                    lang={lang as any}
                                                    title=""
                                                    htmlRaw={htmlPreview ?? ""}
                                                    imageUrl={fullEmailImageSrc || undefined}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </>
                )}

                <div className="col-12 flex justify-content-end mt-2">
                    <Button
                        type="submit"
                        label={isSubmitting ? "Guardando..." : "Guardar"}
                        disabled={isSubmitting || bloqueado || soloLectura}
                        icon="pi pi-save"
                    />
                </div>

            </form >
        </div >
    );
}
const AttachmentPreviewList = ({ files, onDelete }: { files: AttachmentPreview[]; onDelete: (file: AttachmentPreview) => void; }) => {
    if (!files.length) {
        return null;
    }

    return (
        <div className="mt-3 flex flex-column gap-2">
            <div className="font-semibold">Archivos Adjuntos Cargados</div>

            {files.map((f) => (
                <div className="attachment-row" key={f.id}>
                    <div className="attachment-left">
                        <div className="attachment-icon"><i className={`${resolveFileIcon(f.extension)} text-4xl pi-fw`} /></div>
                        <div className="attachment-meta">
                            <div className="attachment-name">{f.name}</div>
                            <div className="attachment-ext">{f.extension}</div>
                        </div>
                    </div>

                    <div className="attachment-actions">
                        <Button
                            type="button"
                            label="Eliminar"
                            icon="pi pi-trash"
                            className="p-button-sm p-button-text attachment-delete-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete(f);
                            }}
                        />
                        {!!f.url && (
                            <Button
                                type="button"
                                rel="noopener noreferrer"
                                label="Descargar"
                                icon="pi pi-download"
                                className="p-button-sm p-button-text attachment-download-btn"
                                onClick={() => {
                                    window.open(f.url, "_blank");
                                }}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};