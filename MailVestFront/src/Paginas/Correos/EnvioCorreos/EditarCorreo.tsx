import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useAuth } from "../../../Context/UserContext/AuthContext";
import { schema } from "./Templates/emailDraftEdit";
import { fetchAllAprobadores, fetchAllPlantillas, fetchAprobadores } from "./Templates/emailTemplates.api";
import API from "../../../API/ClientApi";
import { createHubConnection } from "../../../Hooks/useSignalR";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Message } from "primereact/message";
import { Card } from "primereact/card";
import { Dropdown, type DropdownChangeEvent } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { FixedSuffixTextArea } from "../../../Componentes/Text/FixedSuffixTextArea";
import { Dialog } from "primereact/dialog";
import { Checkbox } from "primereact/checkbox";
import EmailDraftStore from "./Draft/emailDraft.api";

const maxDefaults = Number(import.meta.env.VITE_MAX_DEFAULTS);
/* eslint-disable @typescript-eslint/no-explicit-any */

type EmailDraftDetailApi = {
    Id: number;
    TemplateId: number;
    PlantillaNombre: string;

    IcsStart?: string | null;
    IcsEnd?: string | null;

    Ics: {
        ES?: { Body: string; FileName: string; PathRelativo: string; };
        EN?: { Body: string; FileName: string; PathRelativo: string; };
    };

    RequiredApprovers: number;
    Approvers: EmailDraftApproverViewDto[];

    Estatus: number;
    Revision: number;
};

type TemplateOption = {
    label: string;
    value: number;
    disabled: boolean;
    template: EmailTemplateDto;
};

type FormState = {
    templateId: number | null;

    icsStart: Date | null;
    icsEnd: Date | null;

    icsFileNameES: string;
    icsFileNameEN: string;

    icsBodyES: string;
    icsBodyEN: string;
};

type EmailDraftApproverViewDto = {
    Id: number;
    Usuario: string;
    Email: string;
    Requerido: boolean;
    Adicional: boolean;
    Comentario?: string | null;
    IsCurrentUser: boolean;
};

type AdditionalApprover = {
    Id: number;
    Requerido: boolean;
}

const ENDPOINTS = {
    getDraft: (id: number) => `/correosDraft/${id}`,
    updateDraft: (id: number) => `/correosDraft/update/${id}`,
};

const convertToStaticUTC = (date: Date | null): string | null => {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
};

const normalizeIcsBody = (body: string, allTempaltes: EmailTemplateDto[]): string => {
    const clickUrls = new Set(
        allTempaltes.map(t => String(t.ClickUrl ?? "").trim()).filter(Boolean)
    );

    const lines = String(body ?? "").split(/\r?\n/)
        .filter(line => !clickUrls.has(line.trim()));

    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
        lines.pop();
    }

    return lines.join("\n");
}

function parseStaticUTCToLocalDate(iso?: string | null): Date | null {
    if (!iso) return null;

    const m = String(iso).match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(?::(\d{2}))?(?:\.\d+)?Z?$/
    );
    if (!m) {
        const dt = new Date(iso);
        return Number.isNaN(dt.getTime()) ? null : dt;
    }

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const hh = Number(m[4]);
    const mm = Number(m[5]);
    const ss = Number(m[6] ?? 0);

    const dt = new Date(y, mo - 1, d, hh, mm, ss);
    return Number.isNaN(dt.getTime()) ? null : dt;
}

export default function EditarCorreo() {
    const { id } = useParams();
    const draftId = useMemo(() => Number(id), [id]);

    const navigate = useNavigate();
    const toast = useRef<Toast>(null);

    const { token } = useAuth();

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [draft, setDraft] = useState<EmailDraftDetailApi | null>(null);
    const [originalTemplateId, setOriginalTemplateId] = useState<number | null>(null);

    const [templatesLoading, setTemplatesLoading] = useState(true);
    const [templates, setTemplates] = useState<EmailTemplateDto[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [templateUsedNow, setTemplateUsedNow] = useState(false);
    const templateUsedNowToastShownRef = useRef(false);

    const [requiredAprobador, setRequiredAprobador] = useState<number>(maxDefaults);
    const [catalogoAprobadores, setCatalogoAprobadores] = useState<any[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [selectedAprobadores, setSelectedAprobadores] = useState<AdditionalApprover[]>([]);
    const [modalAprobadores, setModalAprobadores] = useState<AdditionalApprover[]>([]);
    const [modalApproversError, setModalApproversErros] = useState<string>("");

    const [, setEnEdicion] = useState(false);
    const [enEdicionPor, setEnEdicionPor] = useState<string | null>(null);
    const [soloLectura, setSoloLectura] = useState(false);

    const [bloqueado, setBloqueado] = useState(false);
    const renewRef = useRef<number | null>(null);

    const [editingTemplateIds, setEditingTemplateIds] = useState<Set<number>>(new Set());
    const connRef = useRef<any | null>(null);
    const lastEditingTemplateIdRef = useRef<number | null>(null);

    const [form, setForm] = useState<FormState>({
        templateId: null,

        icsStart: null,
        icsEnd: null,

        icsFileNameEN: "",
        icsFileNameES: "",

        icsBodyES: "",
        icsBodyEN: "",
    });

    // 1. Usar Ref para acceder a los valores actuales sin reiniciar el efecto
    const formRef = useRef(form);
    const originalIdRef = useRef(originalTemplateId);

    const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            if (!prev[key as string]) return prev;
            const clone = { ...prev };
            delete clone[key as string];
            return clone;
        });
        if (key === "templateId") {
            setTemplateUsedNow(false);
            templateUsedNowToastShownRef.current = false;
        }
    }, []);

    const defaultApprovers = useMemo(
        () => (draft?.Approvers ?? []).filter((a) => !a.Adicional), [draft?.Approvers]
    );

    const additionalApproversFromDraft = useMemo(
        () => (draft?.Approvers ?? []).filter((a) => a.Adicional), [draft?.Approvers]
    );

    const extraNeeded = useMemo(() => Math.max(0, (requiredAprobador ?? 2) - 2), [requiredAprobador]);

    const requiredOk = useMemo(() => {
        if (extraNeeded <= 0) return true;
        return selectedAprobadores.length === extraNeeded;
    }, [extraNeeded, selectedAprobadores.length]);

    const selectedTemplate = useMemo(() => {
        if (!form.templateId) return null;
        return templates.find((t) => t.Id === form.templateId) ?? null;
    }, [templates, form.templateId]);

    const clickUrlSuffix = useMemo(() => {
        const s = String(selectedTemplate?.ClickUrl ?? "").trim();
        return s ? `\n${s}` : "";
    }, [selectedTemplate?.ClickUrl]);

    //opciones de plantillas

    const templateOptions: TemplateOption[] = useMemo(() => {
        const now = new Date();

        return (templates ?? [])
            .slice()
            .sort((a, b) => (a.Name ?? "").localeCompare(b.Name ?? ""))
            .map((t) => {
                const vigente = isTemplateVigente(t, now);

                const allowBecauseSelected = t.Id === form.templateId;
                const allowBecauseOriginal = originalTemplateId != null && t.Id === originalTemplateId;
                const isEditing = editingTemplateIds.has(t.Id);
                return {
                    label: `${t.Name || `Plantilla #${t.Id}`}${t.Bloqueado ? " (Bloqueada)" : `${isEditing ? "(En edición)" : ""}`}`,
                    value: t.Id,
                    disabled: (!vigente || !!t.Bloqueado || isEditing) && !(allowBecauseSelected || allowBecauseOriginal),
                    template: t
                };
            });
    }, [templates, form.templateId, originalTemplateId, editingTemplateIds]);

    const isReassigningTemplate = useMemo(() => {
        return !!form.templateId && !!originalTemplateId && form.templateId !== originalTemplateId;
    }, [form.templateId, originalTemplateId]);

    const saveBlockedByApprovers = useMemo(() => {
        return extraNeeded > 0 && selectedAprobadores.length !== extraNeeded;
    }, [extraNeeded, selectedAprobadores.length]);

    const idToLabel = useMemo(() => {
        const m = new Map<number, string>();
        (catalogoAprobadores ?? []).forEach((a) => {
            const usuario = String((a as any)?.Usuario ?? (a as any)?.usuario ?? "").trim();
            const email = String((a as any)?.Email ?? (a as any)?.email ?? "").trim();
            const label = email ? `${usuario} (${email})` : usuario;
            m.set(a.Id, label);
        });
        return m;
    }, [catalogoAprobadores]);

    const getSlotOptions = useCallback(
        (slotIndex: number) => {
            const defaultIds = new Set(defaultApprovers.map((a) => a.Id));
            const selectedInOtherSlots = new Set<number>();
            modalAprobadores.forEach((x, idx) => {
                if (idx !== slotIndex) selectedInOtherSlots.add(x.Id);
            });

            return (catalogoAprobadores ?? [])
                .filter((a) => !defaultIds.has(a.Id))
                .filter((a) => !selectedInOtherSlots.has(a.Id))
                .map((a) => ({ label: idToLabel.get(a.Id) ?? `Id ${a.Id}`, value: a.Id }))
                .sort((a, b) => a.label.localeCompare(b.label));
        },
        [catalogoAprobadores, defaultApprovers, modalAprobadores, idToLabel]
    );

    const validate = async (): Promise<boolean> => {
        try {
            await schema.validate(form, { abortEarly: false });
            setErrors({});
            return true;
        } catch (e: any) {
            const next: Record<string, string> = {};
            const inner = Array.isArray(e?.inner) ? e.inner : [];
            for (const err of inner) {
                const path = String(err?.path ?? "");
                if (path && !next[path]) next[path] = String(err?.message ?? "Invalid");
            }
            if (extraNeeded > 0) {
                const ids = selectedAprobadores.map((x) => x.Id).filter((x) => x > 0);
                if (ids.length !== extraNeeded || new Set(ids).size !== ids.length) {
                    next._approvers = `Se necesitan elegir exactamente ${extraNeeded} aprobador(es) adicional(es).`;
                }
            }
            setErrors(next);
            toast.current?.show({
                severity: "error",
                summary: "Error de validación",
                detail: "Corrige los campos marcados",
                life: 3500,
            });
            return false;
        }
    };

    const loadTemplates = useCallback(async (signal?: AbortSignal) => {
        setTemplatesLoading(true);
        try {
            const rows = await fetchAllPlantillas(signal);
            setTemplates(rows);
        } finally {
            setTemplatesLoading(false);
        }
    }, []);

    const loadDraft = useCallback(async (signal?: AbortSignal) => {
        const res = await API.get<EmailDraftDetailApi>(ENDPOINTS.getDraft(draftId), { signal });
        const d = res.data as any;
        setDraft(d);
        setOriginalTemplateId(Number(d?.TemplateId) || null);

        setForm({
            templateId: Number(d?.TemplateId) || null,

            icsStart: parseStaticUTCToLocalDate(d?.IcsStart),
            icsEnd: parseStaticUTCToLocalDate(d?.IcsEnd),

            icsFileNameES: String(d?.Ics?.ES?.FileName ?? ""),
            icsFileNameEN: String(d?.Ics?.EN?.FileName ?? ""),

            icsBodyES: String(d?.Ics?.ES?.Body ?? ""),
            icsBodyEN: String(d?.Ics?.EN?.Body ?? "")
        });

        setBloqueado(d.Estatus !== 0 ? true : false);

        const additional = (d?.Approvers ?? []).filter((a: any) => a.Adicional);
        setSelectedAprobadores(additional.map((a: any) => ({ Id: Number(a.Id), Requerido: !!a.Requerido })));
    }, [draftId]);

    const tryLockTemplate = useCallback(async (templateId: number) => {
        try {
            const conn = connRef.current;
            if (!conn || conn.state !== "Connected") return { ok: false as const };

            const res = await conn.invoke("TryLockPlantillaEdicion", { id: templateId, draftId });
            return res as { ok: boolean; reason?: string; lockedBy?: string };
        } catch (e) {
            console.error(e);
            return { ok: false as const };
        }
    }, [draftId]);

    const unlockTemplate = useCallback(async (templateId: number) => {
        try {
            const conn = connRef.current;
            if (!conn || conn.state !== "Connected") return;

            await conn.invoke("UnlockPlantillaEdicion", { id: templateId, draftId });
        } catch (e) {
            console.error(e);
        }
    }, [draftId]);

    const openAprobadoresModal = useCallback(() => {
        const base = (selectedAprobadores ?? []).map(x => ({ ...x}));
        const filled: AdditionalApprover[] = [...base];

        while (filled.length < extraNeeded) {
            filled.push({ Id: 0, Requerido: true });
        }
        if( filled.length > extraNeeded) filled.length = extraNeeded;

        setModalAprobadores(filled);
        setModalApproversErros("");
        setShowModal(true);
    },[selectedAprobadores, extraNeeded]);

    const cancelAprobadoresModal = useCallback(() => {
        setModalApproversErros("");
        setShowModal(false);
    }, []);

    const saveAprobadoresModal = useCallback(() => {
        if(extraNeeded > 0){
            if(modalAprobadores.length !== extraNeeded){
                setModalApproversErros(`Debes seleccionar exactamente ${extraNeeded} aprobador ${extraNeeded ? "es" : ""}`);
                return;
            }
            const ids = modalAprobadores.map(x => Number(x.Id || 0));
            if(ids.some(id => id <= 0)){
                setModalApproversErros("Selecciona un aprobador en todos los espacios.");
                return;
            }

            const unique = new Set(ids);
            if(unique.size !== ids.length){
                setModalApproversErros("No puedes repetir aprobadores adicionales.");
                return;
            }
        }

        setSelectedAprobadores(modalAprobadores.map(x => ({...x })));

        setModalApproversErros("");
        setShowModal(false);
    }, [extraNeeded, modalAprobadores, setSelectedAprobadores]);

    useEffect(() => {
        formRef.current = form;
        originalIdRef.current = originalTemplateId;
    }, [form, originalTemplateId]);

    //SignalR: si se bloquea una plantilla mientras editas
    useEffect(() => {
        let mounted = true;
        const conn = createHubConnection(() => token ?? "");
        connRef.current = conn;

        const onEditChange = (payload: { id: number; editing: boolean; by?: string }) => {
            if (!mounted) return;

            setEditingTemplateIds(prev => {
                const next = new Set(prev);
                if (payload.editing) next.add(payload.id);
                else next.delete(payload.id);
                return next;
            });
        };

        const handler = (payload: { id: number; bloqueado: boolean }) => {
            if (!mounted) return;

            setTemplates((prev) => prev.map((t) => (t.Id === payload.id ? { ...t, Bloqueado: payload.bloqueado } : t)));

            // Usamos las Refs para no depender de variables que cambian
            const selected = formRef.current.templateId;
            const original = originalIdRef.current;

            if (selected !== original && selected === payload.id && payload.bloqueado) {
                setTemplateUsedNow(true);
                if (!templateUsedNowToastShownRef.current) {
                    templateUsedNowToastShownRef.current = true;
                    toast.current?.show({ /* ... config toast ... */ });
                }
            }
        };

        const start = async () => {
            try {
                // Verificación de estado para evitar el AbortError
                if (conn.state === "Disconnected") {
                    await conn.start();
                    if (mounted) {
                        await conn.invoke("Join", "plantillas");
                        conn.on("plantillaBloqueadaCambio", handler);
                        conn.on("plantillaEdicionCambio", onEditChange);
                    }
                }
            } catch (e) {
                console.error("SignalR Start Error: ", e);
            }
        };

        start();

        return () => {
            mounted = false;
            // Solo detener si la conexión no está ya en proceso de detención
            if (conn.state !== "Disconnected") {
                conn.stop();
            }
        };
    }, [token]); // Solo depende del token

    //Carga inicial
    useEffect(() => {
        if (!Number.isFinite(draftId) || draftId <= 0) {
            setLoading(false);
            toast.current?.show({
                severity: "error",
                summary: "Id inválido",
                detail: "El id del draft no es válido.",
                life: 3500,
            });
            return;
        }

        const ac = new AbortController();

        (async () => {
            setLoading(true);
            try {
                await Promise.all([loadTemplates(ac.signal), loadDraft(ac.signal)]);
                const [min, all] = await Promise.all([fetchAprobadores(ac.signal),
                fetchAllAprobadores(ac.signal),
                ]);

                setRequiredAprobador(min);
                setCatalogoAprobadores(all as any);

                const lock = await EmailDraftStore.lockEdit(draftId);

                setEnEdicion(lock.EnEdicion);
                setEnEdicionPor(lock.EnEdicionPor ?? null);

                if (lock.EnEdicion && !lock.IsOwner) {
                    setSoloLectura(true);
                    toast.current?.show({
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
                        await EmailDraftStore.lockEdit(draftId);
                    } catch {
                        if (renewRef.current) window.clearInterval(renewRef.current);
                        renewRef.current = null;

                        await EmailDraftStore.unlockEdit(draftId).catch(() => { });
                    }
                }, 90_000);
            } catch {
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "No se pudo cargar el correo.",
                    life: 4000,
                });
            } finally {
                setLoading(false);
            }
        })();

        return () => {
            ac.abort();
        }
    }, [draftId, loadTemplates, loadDraft]);

    useEffect(() => {
        if (!templates.length) return;

        setForm(prev => ({
            ...prev,
            icsBodyES: normalizeIcsBody(prev.icsBodyES, templates),
            icsBodyEN: normalizeIcsBody(prev.icsBodyEN, templates)
        }))
    }, [templates])

    const setSlotApproverId = (slotIndex: number, newId: number) => {
        setModalAprobadores((prev) => {
            const copy = [...prev];
            if(!copy[slotIndex]){
                copy[slotIndex] = {Id: 0, Requerido: true };
            }
            copy[slotIndex] = {...copy[slotIndex], Id: newId };
            return copy;
        });
    };

    const setSlotRequired = (slotIndex: number, requerido: boolean) => {
        setModalAprobadores((prev) => {
            const copy = [...prev];
            if (!copy[slotIndex]) return prev;
            copy[slotIndex] = { ...copy[slotIndex], Requerido: requerido };
            return copy;
        });
    };

    // regla de bloqueo de guardado:
    // - si reasignas (templateId != originaltemplateID) entonces debe estar vigente y no bloqueada
    // y ademas si signalR dijo "ya se bloqueo", bloquear si o si

    const saveBlockedByTemplate = useMemo(() => {
        if (!form.templateId || !originalTemplateId) return false;

        const isReassigning = form.templateId !== originalTemplateId;
        if (!isReassigning) return false;

        const isEditing = form.templateId ? editingTemplateIds.has(form.templateId) : false;
        if (isEditing) return true;

        const t = templates.find((x) => x.Id === form.templateId);
        if (!t) return true;

        const vigente = isTemplateVigente(t, new Date());
        const blocked = !!t.Bloqueado;

        return templateUsedNow || blocked || !vigente;
    }, [form.templateId, originalTemplateId, editingTemplateIds, templates, templateUsedNow]);

    //si se bloquea por regla, muestra toast 1 vez

    useEffect(() => {
        if (!saveBlockedByTemplate) return;
        if (!form.templateId || !originalTemplateId) return;

        const isReassigning = form.templateId !== originalTemplateId;
        if (!isReassigning) return;

        const t = templates.find((x) => x.Id === form.templateId);
        if (!t) return;

        const vigente = isTemplateVigente(t, new Date());

        if (t.Bloqueado && !templateUsedNowToastShownRef.current) {
            templateUsedNowToastShownRef.current = true;
            toast.current?.show({
                severity: "warn",
                summary: "Plantilla no disponible",
                detail: "La plantilla seleccionada ya fue utilizada y se encuentra bloqueada. Selecciona otra.",
                life: 5000,
            });
        } else if (!vigente && !templateUsedNowToastShownRef.current) {
            templateUsedNowToastShownRef.current = true;
            toast.current?.show({
                severity: "warn",
                summary: "Plantilla no vigente",
                detail: "La plantilla seleccionada no está vigente. Selecciona otra.",
                life: 5000,
            });
        }
    }, [saveBlockedByTemplate, form.templateId, originalTemplateId, templates]);

    useEffect(() => {
        return () => {
            const id = lastEditingTemplateIdRef.current;
            if (id) {
                void unlockTemplate(id);
                lastEditingTemplateIdRef.current = null;
            }
        }
    }, [unlockTemplate]);

    const onSave = async () => {
        const ok = await validate();
        if (!ok) {
            if (extraNeeded > 0) setShowModal(true);
            return;
        }

        if (!draft) return;

        if (saveBlockedByTemplate) {
            toast.current?.show({
                severity: "warn",
                summary: "No se puede guardar",
                detail: "La plantilla seleccionada ya no está disponible. Selecciona otra plantilla.",
                life: 4500,
            });
            return;
        }

        const payloadAdditional = selectedAprobadores
            .filter((x) => x.Id && x.Id > 0)
            .slice(0, extraNeeded)
            .map((x) => ({ Id: x.Id, Requerido: x.Requerido }));

        const payload = {
            Id: draft.Id,
            TemplateId: form.templateId,

            IcsStart: convertToStaticUTC(form.icsStart),
            IcsEnd: convertToStaticUTC(form.icsEnd),

            Ics: {
                ES: {
                    Body: form.icsBodyES,
                    FileName: form.icsFileNameES,
                },
                EN: {
                    Body: form.icsBodyEN,
                    FileName: form.icsFileNameEN,
                },
            },
            RequiredApprovers: payloadAdditional,
            AdditionalApproverIds: requiredAprobador,
        };

        setSending(true);
        try {
            try {
                await API.put(ENDPOINTS.updateDraft(draftId), payload);
                toast.current?.show({
                    severity: "success",
                    summary: "Guardado",
                    detail: "Se actualizó el correo.",
                    life: 3000,
                });
            } catch {
                await API.get(ENDPOINTS.getDraft(draftId));
            }
            setShowModal(false);
            await loadDraft();
        } catch (err: any) {
            const backendMsg: string | undefined = err?.response?.data?.detail ?? err?.response?.data?.message;

            toast.current?.show({
                severity: "error",
                summary: "Error al guardar",
                detail: backendMsg ?? "No se pudo actualizar el correo.",
                life: 5500,
            });
        } finally {
            setSending(false);
        }
    };

    const onBack = () => {
        navigate("/Correos");
        EmailDraftStore.unlockEdit(draftId).catch(() => { });
        unlockTemplate(draftId);
    }

    const onGoPreview = useCallback(() => {
        navigate(`/Correos/VerCorreo/${draftId}`);
    }, [navigate, draftId]);

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: 250 }}>
                <ProgressSpinner />
                <Toast ref={toast} />
            </div>
        );
    }

    return (
        <div className="mv-create-mail-page p-3">
            <Toast ref={toast} />

            <div className="mv-page-header flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                    <h2 className="m-0">Editar Correo</h2>
                    <div className="text-sm opacity-80">
                        Draft #{draftId} {draft?.PlantillaNombre ? `° ${draft.PlantillaNombre}` : ""}
                    </div>
                </div>

                {(saveBlockedByTemplate || saveBlockedByApprovers) && (
                    <div className="mb-2">
                        {saveBlockedByTemplate && isReassigningTemplate && (
                            <Message
                                severity="warn"
                                text="No puedes guardar porque la plantilla seleccionada ya no esta disponible (bloqueada o no vigente)."
                            />
                        )}
                        {saveBlockedByApprovers && (
                            <Message
                                severity="warn"
                                text={`Debes seleccionar exactametne ${extraNeeded} aprobador(es) adicional(es) porque AutorizadoresCorreos = ${requiredAprobador}.`}
                            />
                        )}
                    </div>
                )}
                {soloLectura && (
                    <div className="p-2 mb-3 border-1 surface-border border-round">
                        <b>Solo lectura</b>
                        <div style={{ opacity: 0.8 }}>
                            Este correo esta siendo editado por {" "}<b>{enEdicionPor ?? "otro usuario"}</b>. No puedes realizar/guardar cambios.
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <Button label="Regresar" icon="pi pi-arrow-left" outlined onClick={onBack} disabled={sending} />
                    <Button label="Ver" icon="pi pi-eye" outlined onClick={onGoPreview} disabled={sending} />
                    <Button
                        label={sending ? "Guardando..." : "Guardar"}
                        icon="pi pi-save"
                        onClick={onSave}
                        className="mv-action-primary"
                        disabled={sending || saveBlockedByTemplate || saveBlockedByApprovers || soloLectura || bloqueado}
                        loading={sending}
                    />
                </div>
            </div>

            <Divider />
            {/* 
            {saveBlockedByTemplate && isReassigning && (
                <Message
                    severity="warn"
                    text="No puedes guardar porque la plantilla seleccionada ya no está disponible (bloqueada o no vigente). Selecciona otra plantilla."
                />
            )} */}

            <div className="grid">
                <div className="col-12 lg:col-8">
                    <Card className="mv-card-compact mv-card" title={
                        <span className="mv-card-title">
                            <i className="pi pi-clone" />
                            Plantilla
                        </span>
                    }>
                        <div className="mv-field">
                            <div className="mv-label">
                                Plantilla
                            </div>
                            <Dropdown
                                value={form.templateId}
                                options={templateOptions}
                                onChange={(e) => {
                                    const nextId = e.value as number;
                                    const prevSelected = form.templateId;

                                    void (async () => {
                                        const original = originalTemplateId;
                                        const prevLocked = lastEditingTemplateIdRef.current;

                                        //Si ya esta editando (SIGNALR), bloquear inmediatamente
                                        if (editingTemplateIds.has(nextId) && nextId !== prevLocked) {
                                            toast.current?.show({
                                                severity: "warn",
                                                summary: "Plantilla en edicion.",
                                                detail: "Esta plantilla esta siendo editada por otro usuario.",
                                                life: 5000,
                                            });

                                            setForm(prev => ({
                                                ...prev,
                                                templateId: prevSelected,
                                                icsBodyES: normalizeIcsBody(prev.icsBodyES, templates),
                                                icsBodyEN: normalizeIcsBody(prev.icsBodyEN, templates)
                                            }))
                                            // setField("templateId", prevSelected);
                                            return;
                                        }

                                        if (original && nextId === original) {
                                            if (prevLocked) {
                                                await unlockTemplate(prevLocked);
                                            }
                                            lastEditingTemplateIdRef.current = null;
                                            setForm(prev => ({
                                                ...prev,
                                                templateId: nextId,
                                                icsBodyES: normalizeIcsBody(prev.icsBodyES, templates),
                                                icsBodyEN: normalizeIcsBody(prev.icsBodyEN, templates)
                                            }))
                                            // setField("templateId", nextId);
                                            return;
                                        }

                                        //Si se reasigna (diferente del original), intena el TryLock en servidor
                                        if (original && nextId !== original) {
                                            const res = await tryLockTemplate(nextId);
                                            if (!res.ok) {
                                                toast.current?.show({
                                                    severity: "warn",
                                                    summary: "Plantilla ocupada",
                                                    detail: res.lockedBy ? `La está editando: ${res.lockedBy}`
                                                        : "Alguien más tomó esta plantilla para edición.",
                                                    life: 4500,
                                                });
                                                setForm(prev => ({
                                                    ...prev,
                                                    templateId: prevSelected,
                                                    icsBodyES: normalizeIcsBody(prev.icsBodyES, templates),
                                                    icsBodyEN: normalizeIcsBody(prev.icsBodyEN, templates)
                                                }))
                                                // setField("templateId", prevSelected);
                                                return;
                                                //No se cambia la seleccion
                                            }
                                            if (prevLocked && prevLocked !== nextId) {
                                                await unlockTemplate(prevLocked);
                                            }
                                            lastEditingTemplateIdRef.current = nextId;
                                            setForm(prev => ({
                                                ...prev,
                                                templateId: nextId,
                                                icsBodyES: normalizeIcsBody(prev.icsBodyES, templates),
                                                icsBodyEN: normalizeIcsBody(prev.icsBodyEN, templates)
                                            }))
                                            // setField("templateId", nextId);
                                            return;
                                        }

                                        //Ahora aplicar el cambio

                                        setForm(prev => ({
                                            ...prev,
                                            templateId: nextId,
                                            icsBodyES: normalizeIcsBody(prev.icsBodyES, templates),
                                            icsBodyEN: normalizeIcsBody(prev.icsBodyEN, templates)
                                        }))
                                        // setField("templateId", nextId);
                                    })();
                                }}
                                placeholder={templatesLoading ? "Cargando..." : "Selecciona una plantilla"}
                                disabled={templatesLoading || sending}
                                filter
                                optionDisabled="disabled"
                                className={errors.templateId ? "p-invalid" : ""}
                            />

                            {errors.templateId && <small className="p-error">{errors.templateId}</small>}

                            {selectedTemplate && (
                                <small className="opacity-80">
                                    Vigencia: {formatVigenciaRange(selectedTemplate.ValidoDesde, selectedTemplate.ValidoHasta)}{""}
                                    {selectedTemplate.Bloqueado ? "° (Bloqueada)" : ""}
                                </small>
                            )}

                            <small className="opacity-70">
                                Puedes cambiar la plantilla siempre que esté vigente y no bloqueada. La plantilla actual se permite mantener aunque se haya bloqueado después (porque ya pertenece a este correo).
                            </small>
                        </div>
                    </Card>
                    <Divider />
                    <Card className="mv-card-compact mv-card" title={
                        <span className="mv-card-title">
                            <i className="pi pi-calendar" />
                            ICS
                        </span>
                    }>
                        <div className="flex flex-column gap-3">
                            <div className="mv-ics-grid">
                                <div className="mv-field">
                                    <div className="mv-label">Inicio</div>
                                    <Calendar
                                        value={form.icsStart}
                                        onChange={(e) => setField("icsStart", (e.value as Date) ?? null)}
                                        showTime
                                        hourFormat="24"
                                        className={errors.icsStart ? "p-invalid w-full" : "w-full"}
                                    />
                                    {errors.icsStart && <small className="mv-error">{errors.icsStart}</small>}
                                </div>

                                <div className="mv-field">
                                    <div className="mv-label">Fin</div>
                                    <Calendar
                                        value={form.icsEnd}
                                        onChange={(e) => setField("icsEnd", (e.value as Date) ?? null)}
                                        showTime
                                        hourFormat="24"
                                        className={errors.icsEnd ? "p-invalid w-full" : "w-full"}
                                    />
                                    {errors.icsEnd && <small className="mv-error">{errors.icsEnd}</small>}
                                </div>
                            </div>

                            <Divider />

                            <div className="mv-ics-grid">
                                <div className="mv-field">
                                    <div className="mv-label">Archivo ICS (ES)</div>
                                    <InputText
                                        value={form.icsFileNameES}
                                        onChange={(e) => setField("icsFileNameES", e.target.value)}
                                        className={errors.icsFileNameES ? "p-invalid w-full" : "w-full"}
                                        placeholder="invite_es.ics"
                                    />
                                    {errors.icsFileNameES && <small className="mv-error">{errors.icsFileNameES}</small>}
                                </div>

                                <div className="mv-field">
                                    <div className="mv-label">Archivo ICS (EN)</div>
                                    <InputText
                                        value={form.icsFileNameEN}
                                        onChange={(e) => setField("icsFileNameEN", e.target.value)}
                                        className={errors.icsFileNameES ? "p-invalid w-full" : "w-full"}
                                        placeholder="invite_en.ics"
                                    />
                                    {errors.icsFileNameEN && <small className="mv-error">{errors.icsFileNameEN}</small>}
                                </div>
                            </div>

                            <div className="mv-ics-grid">
                                <div className="mv-field">
                                    <div className="mv-label">Contenido ICS (ES)</div>
                                    <FixedSuffixTextArea
                                        userValue={form.icsBodyES}
                                        onUserValueChange={(v) => setField("icsBodyES", v)}
                                        suffix={clickUrlSuffix}
                                        rows={10}
                                        placeholder="Escribe aqí el contenido del ICS..."
                                        className={errors.icsBodyES ? "p-invalid w-full" : "w-full"}
                                    />
                                    {errors.icsBodyES && <small className="p-error">{errors.icsBodyES}</small>}
                                </div>
                                <div className="mv-field">
                                    <div className="mv-label">Contenido ICS (EN)</div>
                                    <FixedSuffixTextArea
                                        userValue={form.icsBodyEN}
                                        onUserValueChange={(v) => setField("icsBodyEN", v)}
                                        suffix={clickUrlSuffix}
                                        rows={10}
                                        placeholder="Escribe aqí el contenido del ICS..."
                                        className={errors.icsBodyEN ? "p-invalid w-full" : "w-full"}
                                    />
                                    {errors.icsBodyEN && <small className="p-error">{errors.icsBodyEN}</small>}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="col-12 lg:col-4">
                    <Card className="mv-card-compact mv-card" title={
                        <span className="mv-card-title">
                            <i className="pi pi-info-circle"/>
                            Información
                        </span>
                    }>
                        <div className="flex flex-column gap-2">
                            <div className="text-sm">
                                <b>Estatus:</b> {draft?.Estatus} &nbsp; <b>Revisión:</b>{draft?.Revision}
                            </div>
                            <Divider />
                            <div className="text-sm">
                                <b>Plantilla original:</b>{originalTemplateId ?? "-"}
                            </div>
                            <div className="text-sm">
                                <b>Plantilla seleccionada:</b>{form.templateId ?? "-"}{" "}
                                {isReassigningTemplate ? <span className="opacity-70">(reasignando)</span> : null}
                            </div>
                            <Divider />

                            <small className="opacity-70">
                                Si se selecciona otra plantilla y alguien la usa antes de que se guarde, se notificara y bloqueara el guardar cambios.
                            </small>

                            <Divider />

                            <div className="text-sm">
                                <b>Autorizador{requiredAprobador > 2 ? "es" : ""} del correo:</b> {requiredAprobador} <br />
                                <span className="opacity-70">Extras requeridos: {extraNeeded}</span>
                            </div>

                            {extraNeeded > 0 ? (
                                <>
                                    <Divider />
                                    <Button
                                        label="Editar aprobadores adicionales"
                                        icon="pi pi-users"
                                        outlined
                                        onClick={openAprobadoresModal}
                                        disabled={sending}
                                    />

                                    <div className="text-sm opacity-80 mt-2">
                                        <b>Actuales:</b>{" "}
                                        {selectedAprobadores.filter(x => x.Id > 0).length ? selectedAprobadores.filter(x => x.Id > 0).map(x => idToLabel.get(x.Id) ?? `Id ${x.Id}`).join(", ") : "Ninguno"}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </Card>
                    <Divider />
                    <Card className="mv-card-compact mv-card" title={
                        <span className="mv-card-title">
                            <i className="pi pi-users" />
                            Aprobadores
                        </span>
                    }>
                        <div className="mv-field">
                            <div className="mv-label">Aprobadores Default (siempre)</div>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {defaultApprovers.map(a => (
                                    <li key={a.Id}>
                                        {a.Usuario} {a.Requerido ? "(Requerido)" : ""}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {extraNeeded > 0 ? (
                            <div className="mv-field" style={{ marginTop: 12 }}>
                                <div className="mv-label">Adicional(es) actuales</div>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                    {(additionalApproversFromDraft ?? []).length ? (
                                        additionalApproversFromDraft.map(a => (
                                            <li key={a.Id}>
                                                {a.Usuario} {a.Requerido ? "(Requerido)" : "(Opcional)"}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="opacity-70">No asignado</li>
                                    )}
                                </ul>
                            </div>
                        ) : null}
                    </Card>
                </div>
            </div>
            {extraNeeded > 0 && showModal && (
                <Dialog
                    visible={showModal}
                    modal
                    style={{ width: "50rem" }}
                    header="Aprobadores adicionales"
                    onHide={() => setShowModal(false)}
                    className="mv-role-dialog dialog-header-gradient"
                >
                    <div className="dialog-content-role">
                        <div className="mb-2">
                            <Message
                                severity="info"
                                text={`Debes seleccionar exactamente ${extraNeeded} aprobador(es) adicional(es). Los 2 defaults no se pueden cambiar aqui.`}
                            />
                        </div>
                        {Array.from({ length: extraNeeded }).map((_, idx) => {
                            const slot = modalAprobadores[idx] ?? { Id: 0, Requerido: true };
                            const opts = getSlotOptions(idx);

                            return (
                                <div key={idx} style={{ marginTop: idx === 0 ? 0 : 14 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Aprobador adicional #{idx + 1}</div>
                                    <Dropdown
                                        value={slot.Id > 0 ? slot.Id : null}
                                        options={opts}
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Selecciona..."
                                        onChange={(e: DropdownChangeEvent) => setSlotApproverId(idx, Number(e.value))}
                                        className="w-full"
                                        filter
                                        disabled={sending}
                                    />
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                        <Checkbox
                                            inputId={`slot-req-${idx}`}
                                            checked={!!slot.Requerido}
                                            onChange={(e) => setSlotRequired(idx, !!e.checked)}
                                            disabled={sending || slot.Id <= 0}
                                        />
                                        <label htmlFor={`slot-req-${idx}`}>Requerido</label>
                                    </div>
                                </div>
                            );
                        })}

                        {modalApproversError ? (
                            <div style={{ marginTop: 10 }}>
                                <small style={{ color: "var(--red-500)" }}>{modalApproversError}</small>
                            </div>
                        ) : null}

                        <div className="flex justify-end gap-2 mt-3">
                            <Button
                                label="Cancelar"
                                type="button"
                                className="mv-action-secondary"
                                onClick={cancelAprobadoresModal}
                                disabled={sending}
                            />
                            <Button
                                label={sending ? "Gurdando..." : "Guardar"}
                                className="mv-action-primary"
                                onClick={saveAprobadoresModal}
                                disabled={sending || saveBlockedByTemplate || !requiredOk}
                            />
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
}