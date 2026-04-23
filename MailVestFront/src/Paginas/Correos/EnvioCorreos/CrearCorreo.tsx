/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as yup from "yup";
import { fetchAllAprobadores, fetchAllPlantillas, fetchAprobadores } from "./Templates/emailTemplates.api";
import { Tag } from "primereact/tag";
import { Dropdown, type DropdownChangeEvent } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import toAbsouluteUrl from "../../../Utils/toAbsouluteUrl";
import { Calendar } from "primereact/calendar";
import { FixedSuffixTextArea } from "../../../Componentes/Text/FixedSuffixTextArea";
import { Button } from "primereact/button";
import { usePermiso } from "../../../Hooks/usePermiso";
import { Permisos } from "../../../Constantes/Permisos";
import type AprobadoresCat from "../../Aprobadores/Modelos/AprobadoresCat";
import { MultiSelect } from "primereact/multiselect";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import API from "../../../API/ClientApi";
import { Checkbox } from "primereact/checkbox";
import { useNavigate } from "react-router";
import { useAuth } from "../../../Context/UserContext/AuthContext";
import { createHubConnection } from "../../../Hooks/useSignalR";
import { AttachmentPreviewList } from "../Plantillas/Historiales/EmailTemplatePreviewDialog";

const DEFAULT_DURATION_MIN = 60;

type Props = {
    onCreated?: () => void;
}
function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60_000);
}

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

type TemplateOption = {
    label: string;
    value: number;
    disabled: boolean;

    vigente: boolean;
    vigenciaLabel: string;
    template: EmailTemplateDto;
};

type FormState = {
    templateId: number | null;

    icsStart: Date | null;
    icsEnd: Date | null;

    icsFileNameES: string;
    icsFileNameEN: string;

    icsBodyUserES: string;
    icsBodyUserEN: string;
};

type AprobadoresAd = {
    Id: number;
    Requerido: boolean;
}

const schema = yup.object({
    templateId: yup.number().required("Selecciona una plantilla").typeError("Selecciona una plantilla"),

    icsStart: yup.date().required("El inicio del ICS es requerido").nullable(),
    icsEnd: yup.date().nullable().required("El fin del ICS es requerido").test("after-start", "Fin debe de ser mayor al inicio", function (value) {
        const start = this.parent.icsStart as Date | null;

        if (!start || !value) {
            return true;
        }
        return value > start;
    }),

    icsFileNameES: yup.string().required("Nombre del archivo ICS(ES) es requerido"),
    icsFileNameEN: yup.string().required("Nombre del archivo ICS(EN) es requerido"),

    icsBodyUserES: yup.string().required("Cuerpo del ICS(ES) es requerido"),
    icsBodyUserEN: yup.string().required("Cuerpo del ICS(EN) es requerido"),
});


const convertToStaticUTC = (date: Date | null): string | null => {
    if (!date) return null;

    // Obtenemos los componentes locales (lo que tú ves en pantalla)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Construimos el string ISO con 'Z' al final manualmente
    // Esto evita que JS haga la conversión de zona horaria
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
};

export default function CrearCorreo({ onCreated }: Props) {

    const [previewES, setPreviewES] = useState<string>("");
    const [previewEN, setPreviewEN] = useState<string>("");

    const { tienePermiso } = usePermiso();

    const toast = useRef<Toast>(null);

    const puedeAgregar = tienePermiso(Permisos.Correos.submodulos.AdminCorreos.permisos.Alta);

    const abortRef = useRef<AbortController | null>(null);

    const [templates, setTemplates] = useState<EmailTemplateDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string>("");

    const endWasAutoRef = useRef(true);
    const prevStartRef = useRef<Date | null>(null);

    const [aprobadores, setAprobadores] = useState<AprobadoresCat[]>([]);
    const [requiredAprobador, setRequiredAprobador] = useState<number>(2);
    const [selectedAprobadores, setSelectedAprobadores] = useState<AprobadoresAd[]>([]);

    const navigate = useNavigate();

    const { token } = useAuth();

     const [autoHeight, setAutoHeight] = useState<number>(0);

    const iframeRefES = useRef<HTMLIFrameElement | null>(null);
    const iframeRefEN = useRef<HTMLIFrameElement | null>(null);

    const recalcHeight = (ref: React.RefObject<HTMLIFrameElement | null>) => {
        const el = ref.current;
        if (!el) return;
        try {
            const doc = el.contentDocument;
            if (!doc) return;

            const h = Math.max(
                doc.documentElement?.scrollHeight ?? 0,
                doc.body?.scrollHeight ?? 0
            ) + 8;

            const clamped = Math.max(320, Math.min(h, 1200));
            setAutoHeight(clamped);
        } catch { /* empty */ }
    };

    const selectedAprobadoresIds = useMemo(
        () => selectedAprobadores.map(x => x.Id),
        [selectedAprobadores]
    );

    const onAddiionalApproversChange = (ids: number[]) => {
        setSelectedAprobadores((prev) => {
            const prevById = new Map(prev.map(x => [x.Id, x]));

            return ids.map((id) => prevById.get(id) ?? ({ Id: id, Requerido: true }));
        });
    };

    const setAdditionalApproverRequired = (id: number, requerido: boolean) => {
        setSelectedAprobadores((prev) => prev.map(x => x.Id === id ? { ...x, Requerido: requerido } : x)
        );
    };

    const maxDefaults = ((import.meta as any).env.VITE_MAX_DEFAULTS as number | undefined) ?? 0;

    const effectiveRequiredAprobadores = Math.max(maxDefaults, requiredAprobador);

    const extraAprobadoresNecesarios = Math.max(0, effectiveRequiredAprobadores - maxDefaults);

    const [showModal, setShowModal] = useState(false);
    const [sending, setSending] = useState(false);

    const closeEditDialog = () => {
        setShowModal(false);
        setSending(false);
        setSelectedAprobadores([]);
    };

    const selectableAprobadores = useMemo(
        () =>
            aprobadores.filter(a => !a.IsDefault && a.Estatus)
                .map(a => ({
                    ...a,
                    label: `${a.Usuario} - ${a.Email}`
                })), [aprobadores]
    );

    const [form, setForm] = useState<FormState>({
        templateId: null,
        icsStart: null,
        icsEnd: null,
        icsFileNameES: "",
        icsFileNameEN: "",
        icsBodyUserES: "",
        icsBodyUserEN: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setLoading(true);
        setLoadError("");

        fetchAllPlantillas(ac.signal)
            .then((rows) => setTemplates(rows))
            .catch((e) => setLoadError(e?.message ?? "No se pudieron cargar las plantillas"))
            .finally(() => setLoading(false));

        fetchAllAprobadores(ac.signal)
            .then((rows) => setAprobadores(rows))
            .catch((e) => setLoadError(e?.message ?? "No se pudieron cargar los aprobadores"))
            .finally(() => setLoading(false));

        fetchAprobadores(ac.signal)
            .then((rows) => setRequiredAprobador(rows))
            .catch((e) => setLoadError(e?.message ?? "No se pudieron cargar los aprobadores minimo"))
            .finally(() => setLoading(false));

        return () => ac.abort();

    }, []);

    useEffect(() => {
        if (!form.icsStart) return;

        const start = form.icsStart;
        const end = form.icsEnd;

        if (!end || end <= start) {
            const next = new Date(start.getTime());
            next.setHours(next.getHours() + 1);
            setField("icsEnd", next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.icsStart]);

    useEffect(() => {
        let mounted = true;

        const conn = createHubConnection(() => token ?? "");

        const handler = (payload: { id: number; bloqueado: boolean }) => {
            if (!mounted) {
                return;
            }

            setTemplates(prev =>
                prev.map(t => (t.Id === payload.id ? { ...t, Bloqueado: payload.bloqueado } : t))
            );
        };

        const start = async () => {
            try {
                await conn.start();
                await conn.invoke("Join", "plantillas");
                conn.on("plantillaBloqueadaCambio", handler);
            } catch (e) {
                console.error(e);
            }
        };

        start();

        return () => {
            mounted = false;
            conn.off("plantillaBloqueadaCambio", handler);
            conn.stop();
        };
    }, [token])

    const options: TemplateOption[] = useMemo(() => {
        const now = new Date();

        return templates
            .slice()
            .sort((a, b) => (a.Name ?? "").localeCompare(b.Name ?? ""))
            .map((t) => {
                const vigente = isTemplateVigente(t, now);
                const vigLabel = formatVigenciaRange(t.ValidoDesde, t.ValidoHasta);
                return {
                    label: `${t.Name || `Plantilla #${t.Id}`}${t.Bloqueado ? " (Bloqueada)" : ""}`,
                    value: t.Id,
                    disabled: !vigente || !!t.Bloqueado,
                    vigente,
                    vigenciaLabel: vigLabel,
                    template: t,
                };
            });
    }, [templates]);

    const selectedTemplate: EmailTemplateDto | null = useMemo(() => {
        if (!form.templateId) return null;

        return templates.find((t) => t.Id === form.templateId) ?? null;
    }, [templates, form.templateId]);

    const selectedTemplateBloqueado = !!selectedTemplate?.Bloqueado;

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
        ...(selectedTemplate?.Attachment?.map(mapServerFileToPreview) ?? [])
    ];

    useEffect(() => {
        if (!selectedTemplate?.Id) {
            return;
        }
        if (selectedTemplate.Bloqueado) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Plantilla bloqueada',
                detail: 'Esta plantilla fue bloqueada por otro usuario. No podras guardar los cambios.',
                life: 5000,
            });
        }
    }, [selectedTemplate?.Id, selectedTemplate?.Bloqueado]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!selectedTemplate?.Id) {
                setPreviewES("");
                setPreviewEN("");
                return;
            }

            let [es, en] = await Promise.all([
                API.get(`/plantillas/${selectedTemplate?.Id}/preview`, { params: { lang: "ES" }, responseType: "text" as any }).then(r => (r.data as any) ?? ""),
                API.get(`/plantillas/${selectedTemplate?.Id}/preview`, { params: { lang: "EN" }, responseType: "text" as any }).then(r => (r.data as any) ?? ""),
            ]);
            
            es = es.replace(/<img[^>]+src="([^">]+)"/g, (match: string, srcCapture: any) => {
            // Ejecutas tu función sobre el src capturado
            const absoluteUrl = toAbsouluteUrl(srcCapture);
                return match.replace(srcCapture, absoluteUrl);
            });
            
            en = en.replace(/<img[^>]+src="([^">]+)"/g, (match: string, srcCapture: any) => {
            // Ejecutas tu función sobre el src capturado
            const absoluteUrl = toAbsouluteUrl(srcCapture);
                return match.replace(srcCapture, absoluteUrl);
            });

            if (!cancelled) {
                setPreviewEN(en);
                setPreviewES(es);
            }
        })();

        return () => { cancelled = true; };
    }, [selectedTemplate?.Id]);

    

    useEffect(() => {
        const t = setTimeout(recalcHeight, 50);
        return () => clearTimeout(t);
    }, [previewES, previewEN]);

    const clickUrlSuffix = useMemo(() => {
        const url = (selectedTemplate?.ClickUrl ?? "").trim();
        return url ? `\n${url}` : null;
    }, [selectedTemplate?.ClickUrl]);



    const itemTemplate = (opt: TemplateOption) => {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600 }}>{opt.label}</span>
                    {opt.vigenciaLabel ? (
                        <small style={{ opacity: 0.75 }}>{opt.vigenciaLabel}</small>
                    ) : null}
                </div>
                {opt.vigente ? (
                    <Tag severity="success" value="Vigente" />
                ) : (
                    <Tag severity="warning" value="No vigente" />
                )}
            </div>
        );
    };

    const valueTemplate = (opt?: TemplateOption) => {
        if (!opt) return <span>Selecciona una plantilla</span>;

        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" }}>
                <span style={{ fontWeight: 600 }}>{opt.label}</span>
                {opt.vigente ? <Tag severity="success" value="Vigente" /> : <Tag severity="warning" value="No vigente" />}
            </div>
        );
    };

    const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
        setForm((prev) => ({ ...prev, [k]: v }));
        setErrors((prev) => {
            if (!prev[k as string]) return prev;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [k as string]: _, ...rest } = prev;
            return rest;
        });
    };

    const handleTemplateChange = (e: DropdownChangeEvent) => {
        setField("templateId", (e.value ?? null) as number | null);
    };

    const validate = async (): Promise<boolean> => {
        try {
            setErrors({});
            await schema.validate(form, { abortEarly: false });
            return true;
        } catch (err: any) {
            const next: Record<string, string> = {};
            const inner = err?.inner ?? [];
            for (const it of inner) {
                if (it?.path && !next[it.path]) next[it.path] = it.message;
            }
            if (!Object.keys(next).length && err?.message) next["_"] = err.message;
            setErrors(next);
            return false;
        }
    };

    const buildIcsBody = (userText: string, clickUrl: string): string => {
        const url = (clickUrl ?? "").trim();
        if (!url) return userText ?? "";
        const t = userText ?? "";

        if (!t) return url;

        if (t.includes(url)) return t;

        return `${t}\n${url}`;
    };

    const handleSubmit = async () => {
        if (extraAprobadoresNecesarios > 0) {
            console.log(selectableAprobadores);
            if (selectedAprobadores.length !== extraAprobadoresNecesarios) {
                toast.current?.show({
                    severity: "error",
                    summary: "Aprobadores",
                    detail: `Debes seleccionar exactamente ${extraAprobadoresNecesarios} aprobador(es) adicional(es)`,
                });
                setShowModal(true);
                return;
            }
            else {
                sendCreateMail();
            }
        }
        else {
            sendCreateMail();
        }
    };

    const sendCreateMail = async () => {
        const ok = await validate();
        if (!ok) return;

        if (!selectedTemplate) return;

        const payload = {
            TemplateId: selectedTemplate.Id,
            ClickUrl: selectedTemplate.ClickUrl,
            IcsStart: convertToStaticUTC(form.icsStart),
            IcsEnd: convertToStaticUTC(form.icsEnd),

            Ics: {
                ES: {
                    FileName: form.icsFileNameES,
                    Body: buildIcsBody(form.icsBodyUserES, selectedTemplate.ClickUrl),
                },
                EN: {
                    FileName: form.icsFileNameEN,
                    Body: buildIcsBody(form.icsBodyUserEN, selectedTemplate.ClickUrl),
                },
            },
            AdditionalApproverIds: selectedAprobadores,
            RequiredApprovers: effectiveRequiredAprobadores,
        };
        setSending(true);
        console.log(payload);
        saveDraftEmail(payload);
        onCreated?.();
    }

    const saveDraftEmail = useCallback(
        async (payload: any) => {
            try {
                const response = await API.post('/correosDraft/newDraft', payload);

                if (response.status === 200) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Correo creado',
                        detail: 'El correo se creo correctamente.',
                        life: 3000,
                    });
                    setSending(false);
                    closeEditDialog();
                    navigate(`/${response.data}`);
                    // navigate a editar el draft ahora.
                } else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error al crear el correo.',
                        detail: 'No se pudo guardar el correo. Intente de nuevo.',
                        life: 5000
                    });
                    setSending(false);
                }
            } catch (err: any) {
                const backendMsg: string | undefined = err.response?.data?.message;

                const detail =
                    backendMsg ??
                    'No se pudo crear el parametro. Intente mas tarde.';

                toast.current?.show({
                    severity: 'error',
                    summary: 'Error al crear parametro',
                    detail,
                    life: 5000
                });
                setSending(false);
            }
        }, [navigate]
    );

    const requiredOk = useMemo(() => {
        return Boolean(
            selectedTemplate && isTemplateVigente(selectedTemplate) &&
            form.icsStart &&
            form.icsEnd &&
            form.icsEnd > form.icsStart &&
            (form.icsFileNameES ?? "").trim() &&
            (form.icsFileNameEN ?? "").trim() &&
            (form.icsBodyUserES ?? "").trim() &&
            (form.icsBodyUserEN ?? "").trim() &&
            !Object.values(errors || {}).some((v) => Boolean(v))
        );
    }, [selectedTemplate, form, errors]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                <ProgressSpinner />
            </div>
        );
    }

    const setEndFromStart = (start: Date, durationMin: number) => {
        endWasAutoRef.current = true;
        setField("icsEnd", addMinutes(start, durationMin));
    };

    const onStartChange = (nextStart: Date | null) => {
        setField("icsStart", nextStart);

        if (!nextStart) return;

        const prevStart = prevStartRef.current;
        const end = form.icsEnd;

        if (!end) {
            setEndFromStart(nextStart, DEFAULT_DURATION_MIN);
            prevStartRef.current = nextStart;
            return;
        }

        if (endWasAutoRef.current) {
            setEndFromStart(nextStart, DEFAULT_DURATION_MIN);
            prevStartRef.current = nextStart;
            return;
        }

        if (prevStart) {
            const durationMs = end.getTime() - prevStart.getTime();
            const nextEnd = new Date(nextStart.getTime() + Math.max(durationMs, 30 * 60_000));

            setField("icsEnd", nextEnd);
        } else {
            setField("icsEnd", addMinutes(nextStart, DEFAULT_DURATION_MIN));
        }

        prevStartRef.current = nextStart;
    };

    const onEndChange = (nextEnd: Date | null) => {
        endWasAutoRef.current = false;
        setField("icsEnd", nextEnd);
    };

    return (
        <div className="mv-create-mail-page" style={{ display: "grid", gap: 16 }}>
            <Toast ref={toast} />
            <Card title="Crear correo desde plantilla">
                {loadError ? <Message severity="error" text={loadError} /> : null}

                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    <label style={{ fontWeight: 600 }}>Plantilla</label>
                    <Dropdown
                        value={form.templateId}
                        options={options}
                        onChange={handleTemplateChange}
                        optionLabel="label"
                        optionValue="value"
                        optionDisabled="disabled"
                        placeholder="Selecciona una plantilla"
                        itemTemplate={itemTemplate}
                        valueTemplate={valueTemplate as any}
                        style={{ width: "1005" }}
                        filter
                        disabled={!puedeAgregar}
                    />
                    {errors.templateId ? <small style={{ color: "var(--red-500)" }}>{errors.templateId}</small> : null}
                </div>

                {selectedTemplate ? (
                    <>
                        <Divider />
                        <div style={{ display: "grid", gap: 12 }}>
                            <div style={{ display: "grid", gap: 6 }}>
                                <label style={{ fontWeight: 600 }}>ClickUrl</label>
                                <InputText value={selectedTemplate.ClickUrl ?? ""} readOnly style={{ width: "100%" }} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <Card title="Preview ES" subTitle={selectedTemplate.ES.Subject}>
                                    <iframe
                                    ref={iframeRefES}
                                    title="Preview ES"
                                    sandbox="allow-same-origin"
                                    onLoad={() => recalcHeight(iframeRefES)}
                                    style={{ width: "100%", height: autoHeight, border: 0, display: "block", borderRadius: 8 }}
                                    srcDoc={previewES}
                                    />
                                </Card>
                                <Card title="Preview EN" subTitle={selectedTemplate.EN.Subject} style={{ marginTop: 2 }}>
                                    <iframe
                                    ref={iframeRefEN}
                                    title="Preview EN"
                                    sandbox="allow-same-origin"
                                    onLoad={() => recalcHeight(iframeRefEN)}
                                    style={{ width: "100%", height: autoHeight, border: 0, display: "block", borderRadius: 8 }}
                                    srcDoc={previewEN}
                                    />
                                </Card>
                            </div>
                            {selectedTemplate.UploadChoice == "FILE" ? (
                                <div style={{ display: "grid", gap: 12, marginTop: 2 }}>
                                    <Card
                                        title="Archivos adjuntos"
                                        subTitle="Archivos subidos para la plantilla"
                                        className="mv-card col-12"
                                    >
                                        <AttachmentPreviewList files={attachmentPreviews} />
                                    </Card>
                                </div>
                            ) : null}
                        </div>

                        <Divider />

                        <div className="mv-section-card">
                            <div className="mv-section-title">
                                ICS Fecha y Hora
                            </div>

                            <div className="mv-dt-grid">
                                <div className="mv-field">
                                    <label className="mv-label">Inicio (fecha y hora)</label>
                                    <Calendar
                                        className="mv-cal-sm"
                                        value={form.icsStart}
                                        onChange={(e) => onStartChange((e.value as Date) ?? null)}
                                        showTime
                                        hourFormat="12"
                                        dateFormat="dd-MM-yy"
                                        inputStyle={{ width: "100%" }}
                                        panelStyle={{ width: 320 }}
                                        appendTo="self"
                                        showIcon
                                        readOnlyInput={false}
                                        hideOnDateTimeSelect
                                    />
                                    {errors.icsStart ? <small className="mv-error">{errors.icsStart}</small> : null}
                                </div>

                                <div className="mv-field">
                                    <label className="mv-label">Fin (fecha y hora)</label>

                                    <Calendar
                                        className="mv-cal-sm"
                                        value={form.icsEnd}
                                        onChange={(e) => onEndChange((e.value as Date) ?? null)}
                                        showTime
                                        hourFormat="12"
                                        dateFormat="dd/mm/yy"
                                        inputStyle={{ width: "100%" }}
                                        panelStyle={{ width: 320 }}
                                        appendTo="self"
                                        showIcon
                                        minDate={form.icsStart ?? undefined}
                                        readOnlyInput={false}
                                        hideOnDateTimeSelect
                                    />
                                </div>
                                {errors.icsEnd ? <small style={{ color: "var(--red-500)" }}>{errors.icsEnd}</small> : null}
                            </div>
                        </div>
                        <div className="mv-ics-grid" style={{ marginTop: 20 }}>
                            <Card title="ICS - Español">
                                <div style={{ display: "grid", gap: 10 }}>
                                    <div style={{ display: "grid", gap: 6 }}>
                                        <label style={{ fontWeight: 600 }}>Nombre archivo .ics (ES)</label>
                                        <InputText
                                            value={form.icsFileNameES}
                                            onChange={(e) => setField("icsFileNameES", e.target.value)}
                                            placeholder="evento_es.ics"
                                        />
                                        {errors.icsFileNameES ? <small style={{ color: "var(--red-500)" }}>{errors.icsFileNameES}</small> : null}
                                    </div>
                                    <div style={{ display: "grid", gap: 6 }}>
                                        <label style={{ fontWeight: 600 }}>Contenido ICS (ES)</label>
                                        <FixedSuffixTextArea
                                            userValue={form.icsBodyUserES}
                                            onUserValueChange={(v) => setField("icsBodyUserES", v)}
                                            suffix={clickUrlSuffix ?? ""}
                                            rows={10}
                                            placeholder="Escribe aqui el contenido del ICS (ES)..."
                                        />
                                        {errors.icsBodyUserES ? <small style={{ color: "var(--red-500)" }}>{errors.icsBodyUserES}</small> : null}
                                    </div>
                                </div>
                            </Card>

                            <Card title="ICS - INGLES">
                                <div style={{ display: "grid", gap: 6 }}>
                                    <label style={{ fontWeight: 600 }}>Nombre archivo .ics (EN)</label>
                                    <InputText
                                        value={form.icsFileNameEN}
                                        onChange={(e) => setField("icsFileNameEN", e.target.value)}
                                        placeholder="evento_en.ics"
                                    />
                                    {errors.icsFileNameEN ? <small style={{ color: "var(--red-500)" }}>{errors.icsFileNameEN}</small> : null}
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                    <label style={{ fontWeight: 600 }}>Contenido ICS (EN)</label>
                                    <FixedSuffixTextArea
                                        userValue={form.icsBodyUserEN}
                                        onUserValueChange={(v) => setField("icsBodyUserEN", v)}
                                        suffix={clickUrlSuffix ?? ""}
                                        rows={10}
                                        placeholder="Escribe aqui el contenido del ICS (EN)..."
                                    />
                                    {errors.icsBodyUserEN ? <small style={{ color: "var(--red-500)" }}>{errors.icsBodyUserEN}</small> : null}
                                </div>
                            </Card>
                        </div>

                        <Divider />

                        <div className="mv-sticky-actionbar">
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <Button
                                    label="Continuar"
                                    icon="pi pi-arrow-right"
                                    onClick={handleSubmit}
                                    className="mv-action-primary"
                                    disabled={!requiredOk || selectedTemplateBloqueado}
                                />
                            </div>
                        </div>
                        {extraAprobadoresNecesarios > 0 && showModal && (
                            <Dialog
                                visible={showModal}
                                modal
                                style={{ width: '50rem' }}
                                header="Aprobadores adicionales"
                                onHide={closeEditDialog}
                                className="mv-role-dialog dialog-header-gradient"
                            >
                                <div className="dialog-content-role">

                                    <MultiSelect
                                        value={selectedAprobadoresIds}
                                        options={selectableAprobadores}
                                        optionLabel="label"
                                        optionValue="Id"
                                        selectionLimit={extraAprobadoresNecesarios}
                                        placeholder={`Selecciona ${extraAprobadoresNecesarios} aprobador(es)`}
                                        onChange={(e) => onAddiionalApproversChange(e.value as number[])}
                                        className="w-full"
                                        filter
                                        display="chip"
                                        disabled={sending}
                                        appendTo="self"
                                    />
                                    {selectedAprobadores.length > 0 && (
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                                Marcar si son requeridos:
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                {selectedAprobadores.map((sel) => {
                                                    const ap = selectableAprobadores.find(a => a.Id === sel.Id);
                                                    const label = ap?.label ?? `Id: ${sel.Id}`;

                                                    return (
                                                        <div key={sel.Id}
                                                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                                            <div style={{ flex: 1 }}>
                                                                {label}
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <Checkbox
                                                                    inputId={`req-${sel.Id}`}
                                                                    checked={sel.Requerido}
                                                                    onChange={(e) => setAdditionalApproverRequired(sel.Id, Boolean(e.checked))}
                                                                    disabled={sending}
                                                                />
                                                                <label htmlFor={`req-${sel.Id}`}>Requerido</label>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {/*Botones del dialogo*/}
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            type="button"
                                            className="p-button p-button-text"
                                            onClick={closeEditDialog}
                                            disabled={sending}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            className="p-button p-button-primary"
                                            onClick={handleSubmit}
                                            disabled={sending || selectedTemplateBloqueado}
                                        >
                                            {sending ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            </Dialog>
                        )}
                    </>
                ) : null}
            </Card >
        </div >
    );
}