import { Toast } from "primereact/toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../../../Context/UserContext/AuthContext";
import API from "../../../../API/ClientApi";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import toAbsouluteUrl from "../../../../Utils/toAbsouluteUrl";
import EmailTemplatePreviewDialog, { AttachmentPreviewList } from "../../Plantillas/Historiales/EmailTemplatePreviewDialog";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Tooltip } from "primereact/tooltip";
import { Avatar } from "primereact/avatar";
import { createHubConnection } from "../../../../Hooks/useSignalR";
import { Calendar } from "primereact/calendar";

//0,1,2
type ApproverDecision = "pending" | "approved" | "rejected";
type UploadMode = "IMAGE" | "FILE";

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

type ApproverApi = {
    Id?: number;
    Usuario?: string;
    Nombre?: string;
    Requerido?: boolean;
    Adicional?: boolean;
    Estatus?: number | ApproverDecision;
    Comentario?: string | null;
    Fecha?: string | null;
};

type EmailTemplatePreviewLocal = {
    Id: number;
    Name: string;
    ImageUrlES?: string;
    ImageUrlEN?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Attachment?: any[];
    ClickUrl?: string;
    ValidoDesde?: string;
    ValidoHasta?: string;
    ES?: { Subject: string; Html: string; };
    EN?: { Subject: string; Html: string; };

    UploadMode?: string;
};

type EmailDraftDetailApiLocal = {
    Id: number;
    TemplateId: number;

    PlantillaNombre: string;
    ClickUrl?: string;

    IcsStart?: string;
    IcsEnd?: string;

    Ics?: {
        ES?: { Body: string; FileName: string; PathRelativo: string; };
        EN?: { Body: string; FileName: string; PathRelativo: string; };
    };

    ES?: {
        Subject: string;
        Html: string;
        ImageUrl: string;
    };
    EN?: {
        Subject: string;
        Html: string;
        ImageUrl: string;
    };

    Estatus: number;
    Revision: number;

    CreadoPor?: string;
    Creacion?: string;
    Actualizado?: string;

    Approvers?: ApproverApi[];

    IsApprover?: boolean;

    UltimoRechazo?: { Usuario?: string; Comentario?: string; Fecha?: string };
    Rechazos?: { Usuario?: string; Comentario?: string; Fecha?: string }[];
};

const detectUploadMode = (tpl: EmailTemplatePreviewLocal): UploadMode => {
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

function normKey(v: unknown): string {
    return String(v ?? "").trim().toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAuthUserKey(auth: any): string {
    return normKey(auth?.Usuario ?? "");
}

function toDesicion(raw?: ApproverApi["Estatus"]): ApproverDecision {
    if (raw === "approved") return "approved";
    if (raw === "rejected") return "rejected";
    if (raw === "pending") return "pending";
    const n = Number(raw);
    if (n === 1) return "approved";
    if (n === 2) return "rejected";
    return "pending";
}

function canUserApproveDraft(args: { userKey: string; draft: EmailDraftDetailApiLocal | null }): boolean {
    const userKey = normKey(args.userKey);
    const draft = args.draft;

    if (!draft || !userKey) return false;

    if (typeof draft.IsApprover === "boolean") return draft.IsApprover;

    if (draft.Estatus === 3 || draft.Estatus === 4 || draft.Estatus === 5) return false;
    return (draft.Approvers ?? []).some((a) => normKey(a.Usuario) === userKey);
}

function requiredApprovalsComplete(draft: EmailDraftDetailApiLocal | null): boolean {
    if (!draft) return false;

    const approvers = draft.Approvers ?? [];
    const required = approvers.filter((a) => !!a.Requerido);
    if (required.length === 0) return false;

    if (required.some((a) => toDesicion(a.Estatus) === "rejected")) return false;
    return required.every((a) => toDesicion(a.Estatus) === "approved");
};

function toSafeDate(value?: string): Date | null {

    if (!value) return null;

    const trimmed = value.replace(/(\.\d{3})\d+/, "$1");
    const d = new Date(trimmed);

    return Number.isNaN(d.getTime()) ? null : d;
}

function formatData(value?: string, withTime = false): string {

    const d = toSafeDate(value);
    if (!d) return value ?? "";

    return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    }).format(d);
};

function estatusLabel(estatus: number): { label: string; severity: "success" | "warning" | "danger" | "info" | "secondary" } {
    switch (estatus) {
        case 0:
            return { label: "Borrador", severity: "secondary" };
        case 1:
            return { label: "En revisión", severity: "info" };
        case 2:
            return { label: "Aprobado", severity: "success" };
        case 3:
            return { label: "Rechazado", severity: "danger" };
        case 4:
            return { label: "Envio", severity: "warning" };
        case 5:
            return { label: "Enviado", severity: "success" };
        case 6:
            return { label: "Fallido", severity: "danger" };
        default:
            return { label: `Estatus ${estatus}`, severity: "secondary" };
    }
};

function initialsFromUser(u?: string): string {
    const s = String(u ?? "").trim();
    if (!s) return "?";
    return (s.length <= 2 ? s : s.slice(0, 2)).toUpperCase();
}

const ENDPOINTS = {
    getDraft: (id: number) => `/correosDraft/${id}`,
    approve: (id: number) => `/correosDraft/aprobar/${id}`,
    reject: (id: number) => `/correosDraft/rechazar/${id}`,
    getTemplatePreview: (templateId: number) => `/plantillas/${templateId}`,
};

export default function EmailDraftPreview() {
    const { id } = useParams();
    const correoId = useMemo(() => Number(id), [id]);

    const navigate = useNavigate();
    const toast = useRef<Toast | null>(null);

    const auth = useAuth();
    const userKey = useMemo(() => getAuthUserKey(auth.user), [auth.user]);
    const token = auth.token;

    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState<EmailDraftDetailApiLocal | null>(null);

    const [tplLoading, setTplLoading] = useState(false);
    const [template, setTemplate] = useState<EmailTemplatePreviewLocal | null>(null);
    const [tplDialogOpen, setTplDialogOpen] = useState(false);

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const loadDraft = useCallback(async () => {
        if (!Number.isFinite(correoId) || correoId <= 0) {
            setLoading(false);
            setDraft(null);
            return;
        }

        setLoading(true);
        try {
            const res = await API.get<EmailDraftDetailApiLocal>(ENDPOINTS.getDraft(correoId));
            setDraft(res.data ?? null);
        } catch (e) {
            console.error(e);
            setDraft(null);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo obtener el correo.',
                life: 4000
            });
        } finally {
            setLoading(false);
        }
    }, [correoId]);

    const loadTemplate = useCallback(async (templateId: number) => {
        setTplLoading(true);
        try {
            const res = await API.get<EmailTemplatePreviewLocal | EmailTemplatePreviewLocal[]>(ENDPOINTS.getTemplatePreview(templateId));
            const raw = Array.isArray(res.data) ? res.data[0] : res.data;

            const data = raw ? {
                ...raw,
                UploadMode: detectUploadMode(raw)
            } : null;

            setTemplate(data ?? null);
        } catch (e) {
            console.error(e);
            setTemplate(null);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo obtener la plantilla.',
                life: 4000
            });
        } finally {
            setTplLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDraft().catch(console.error);
    }, [loadDraft]);

    useEffect(() => {
        if (draft?.TemplateId) {
            loadTemplate(draft.TemplateId).catch(console.error);
        }
    }, [draft?.TemplateId, loadTemplate]);

    useEffect(() => {
        if (!token || Number.isFinite(correoId || correoId <= 0)) return;

        let mounted = true;

        const conn = createHubConnection(() => token);

        const onDraftUpdated = (payload: unknown) => {
            if (!mounted) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p: any = payload as any;
            const incomingId = Number(p?.Id ?? p?.id);
            if (!incomingId || incomingId !== correoId) return;

            if (p?.TemplateId != null && p?.Estatus != null) {
                setDraft(p as EmailDraftDetailApiLocal);
                return;
            }

            setDraft((prev) => (prev ? { ...prev, ...API(p?.patch ?? {}) } : prev));
        };

        async function start() {
            try {
                await conn.start();
                await conn.invoke("Join", "correos");

                conn.on("correoDraftActualizado", onDraftUpdated);
                conn.on("correoDraftAprobacionCambio", onDraftUpdated);
            } catch (e) {
                console.error(e);
            }
        }

        start();

        return () => {
            mounted = false;
            conn.off("correoDraftActualizado", onDraftUpdated);
            conn.off("correoDraftAprobacionCambio", onDraftUpdated);
            conn.invoke("Leave", "correos").catch(() => { });
            conn.stop().catch(() => { });
        }
    }, [token, correoId]);

    const esImg = useMemo(() => toAbsouluteUrl(template?.ImageUrlES), [template?.ImageUrlES]);
    const enImg = useMemo(() => toAbsouluteUrl(template?.ImageUrlEN), [template?.ImageUrlEN]);



    const canApprove = useMemo(() => canUserApproveDraft({ userKey, draft }), [draft, userKey]);
    const canSend = useMemo(() => requiredApprovalsComplete(draft), [draft]);
    const status = draft ? estatusLabel(Number(draft.Estatus)) : null;

    const aprobar = useCallback(async () => {
        if (!draft) return;
        try {
            await API.post(ENDPOINTS.approve(draft.Id));
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Correo aprobado.',
                life: 4000
            });
            await loadDraft();
        } catch (e) {
            console.error(e);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo aprobar el correo.',
                life: 4000
            });
        }
    }, [draft, loadDraft]);

    const rechazar = useCallback(async () => {
        if (!draft) return;

        const comentario = rejectReason.trim();
        if (!comentario) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Falta comentario',
                detail: 'Escribe un comentario para rechazar.',
                life: 3500
            });
            return;
        }

        try {
            await API.post(ENDPOINTS.reject(draft.Id), { comentario });
            setRejectOpen(false);
            setRejectReason("");
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Correo rechazado.',
                life: 4000
            });
            await loadDraft();
        } catch (e) {
            console.error(e);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo rechazar el correo.',
                life: 4000
            });
        }
    }, [draft, rejectReason, loadDraft]);

    const approvers = draft?.Approvers ?? [];

    const rejectionFeed = useMemo(() => {
        const list = (draft?.Rechazos ?? []).slice();
        if (draft?.UltimoRechazo?.Comentario && list.length) {
            list.push(draft.UltimoRechazo);
        }
        return list.filter((x) => (x?.Comentario ?? "").trim().length > 0)
            .sort((a, b) => (toSafeDate(b?.Fecha ?? undefined)?.getTime() ?? 0) - (toSafeDate(a?.Fecha ?? undefined)?.getTime() ?? 0));
    }, [draft?.Rechazos, draft?.UltimoRechazo]);

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
        ...(template?.Attachment?.map(mapServerFileToPreview) ?? [])
    ];

    return (
        <div className="p-3">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-3">
                <div className="flex align-items-center gap-2">
                    <Button
                        icon="pi pi-arrow-left"
                        label="Volver"
                        outlined
                        onClick={() => navigate(-1)}
                    />
                    {draft ? (
                        <div className="flex align-items-center gap-2">
                            <span className="font-medium">Correo #{draft.Id}</span>
                            {status ? <Tag value={status.label} severity={status.severity} /> : null}
                            {canSend ? <Tag value="Listo para envio" severity="success" /> : null}
                        </div>
                    ) : null}
                </div>

                <div className="flex gap-2">
                    {canApprove && (
                        <Button icon="pi pi-check" label="Aprobar" severity="success" onClick={aprobar} />
                    )}
                    {canApprove && (
                        <Button icon="pi pi-times" label="Rechazar" severity="danger" onClick={() => setRejectOpen(true)} />
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-content-center py-6">
                    <ProgressSpinner />
                </div>
            ) : !draft ? (
                <Card title="Correo no encontrado">
                    <div className="text-600">No se encontró información para el correo solicitado.</div>
                </Card>
            ) : (
                <div className="grid">
                    <div className="col-12 lg:col-8">
                        <Card>
                            <div className="flex justify-content-between flex-wrap gap-2">
                                <div>
                                    <div className="text-700 text-sm">Plantilla:</div>
                                    <div className="font-medium">{draft.PlantillaNombre}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        icon="pi pi-external-link"
                                        label="Ver plantilla"
                                        outlined
                                        loading={tplLoading}
                                        onClick={() => setTplDialogOpen(true)}
                                        disabled={!template}
                                    />
                                </div>
                            </div>
                            <Divider className="my-3" />

                            <div className="grid">
                                <div className="col-12 md:col-6">
                                    <div className="font-medium mb-2">ES</div>
                                    <div className="text-700 text-sm mb-1">Asunto</div>
                                    <div className="p-2 border-round surface-50">{template?.ES?.Subject ?? "N/A"}</div>
                                    <Divider className="my-3" />
                                    <div className="text-700 text-sm mb-1">Vista Previa</div>
                                    {esImg ? (
                                        <img src={esImg} style={{ width: "100%", borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                                    ) : (
                                        <div className="text-600">Sin imagen.</div>
                                    )}
                                </div>
                                <div className="col-12 md:col-6">
                                    <div className="font-medium mb-2">EN</div>
                                    <div className="text-700 text-sm mb-1">Asunto</div>
                                    <div className="p-2 border-round surface-50">{template?.EN?.Subject ?? "N/A"}</div>
                                    <Divider className="my-3" />
                                    <div className="text-700 text-sm mb-1">Vista Previa</div>
                                    {enImg ? (
                                        <img src={enImg} style={{ width: "100%", borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                                    ) : (
                                        <div className="text-600">Sin imagen.</div>
                                    )}
                                </div>
                            </div>

                            <Divider className="my-3" />

                            {template?.UploadMode == "FILE" ? (
                                <div className="grid">
                                    <div className="col-12">
                                        <AttachmentPreviewList files={attachmentPreviews} />
                                    </div>
                                </div>
                            ) : null}

                            <Divider className="my-3" />

                            <div className="grid">
                                <div className="col-12 md:col-6">
                                    <div className="text-700 text-sm">Creado por</div>
                                    <div className="font-medium">{draft.CreadoPor ?? "N/A"}</div>
                                </div>
                                <div className="col-6 md:col-3">
                                    <div className="text-700 text-sm">Creado</div>
                                    <div className="font-medium">{formatData(draft.Creacion, true)}</div>
                                </div>
                                <div className="col-6 md:col-3">
                                    <div className="text-700 text-sm">Actualizado</div>
                                    <div className="font-medium">{formatData(draft.Actualizado, true)}</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="col-12 lg:col-4">
                        <Card>
                            <div className="flex justify-content-between align-items-center gap-2">
                                <div className="font-medium">Aprobadores</div>
                                <div className="text-600 text-sm">Revisión {draft.Revision}</div>
                            </div>

                            <Divider className="my-3" />

                            <div className="mv-approvers">
                                {approvers.length === 0 ? (
                                    <div className="text-600">Sin aprobadores.</div>
                                ) : (
                                    approvers.map((a, idx) => {
                                        const dec = toDesicion(a.Estatus);
                                        const required = !!a.Requerido;
                                        const user = a.Usuario ?? a.Nombre ?? `Aprobador ${idx + 1}`;
                                        const key = `appr-${a.Id ?? user}-${idx}`;
                                        const tooltipId = `appr-tt-${idx}`;

                                        const cls =
                                            dec === "approved"
                                                ? "mv-approver mv-approver--approved"
                                                : dec === "rejected"
                                                    ? "mv-approver mv-approver--rejected"
                                                    : "mv-approver mv-approver--pending";

                                        return (
                                            <div key={key} className={cls}>
                                                <Tooltip target={`#${tooltipId}`} />
                                                <Avatar
                                                    id={tooltipId}
                                                    label={initialsFromUser(a.Usuario ?? a.Nombre)}
                                                    shape="circle"
                                                    className="mv-approver__avatar"
                                                    data-pr-tooltip={`${user}${required ? "(Requerido)" : ""}${a.Comentario ? ` ° ${a.Comentario}` : ""}`}
                                                />
                                                <div className="mv-approver__meta">
                                                    <div className="mv-approver__name">
                                                        {user}
                                                        {required ? <span className="mv-approver__req">*</span> : null}
                                                    </div>
                                                    <div className="mv-approver__status">
                                                        {dec === "approved" ? (
                                                            <span className="text-gree-700"><i className="pi pi-check mr-2" />Aprovado</span>
                                                        ) : dec === "rejected" ? (
                                                            <span className="text-red-700"><i className="pi pi-times mr-2" />Rechazado</span>
                                                        ) : (
                                                            <span className="text-600"><i className="pi pi-clock mr-2" />Pendiente</span>
                                                        )}
                                                        {a.Fecha ? <span className="ml-2 text-500">({formatData(a.Fecha, true)})</span> : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <Divider className="my-3" />
                            {rejectionFeed.length === 0 ? (
                                <div>
                                    <div className="font-medium mb-2">Comentarios de rechazo</div>
                                    <div className="text-600">Sin comentarios.</div>
                                </div>
                            ) : (
                                <div className="mv-rejection-feed">
                                    <div className="font-medium mb-2">Comentarios de rechazo</div>
                                    {rejectionFeed.map((r, idx) => (
                                        <div key={`rej-${idx}`} className="mv-rejection">
                                            <div className="mv-rejection__head">
                                                <span className="font-medium">{r.Usuario ?? "-"}</span>
                                                <span className="text-500">{formatData(r.Fecha ?? undefined, true)}</span>
                                            </div>
                                            <div className="mv-rejection__body">{r.Comentario}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                        <Divider className="my-3" />

                        <Card>
                            <div className="flex justify-content-between align-items-center gap-2">
                                <div>
                                    <div className="text-700 text-sm">ICS</div>
                                </div>
                            </div>
                            <Divider className="my-3" />
                            <div className="mv-dt-grid">
                                <div className="mv-field">
                                    <label className="mv-label">Inicio (fecha y hora)</label>
                                    <Calendar
                                        className="mb-cal-sm"
                                        value={draft.IcsStart ? new Date(draft.IcsStart) : null}
                                        showTime
                                        hourFormat="12"
                                        dateFormat="dd/mm/yy"
                                        appendTo="self"
                                        readOnlyInput={true}
                                        hideOnDateTimeSelect
                                        disabled
                                    />
                                </div>
                                <div className="mv-field">
                                    <label className="mv-label">Fin (fecha y hora)</label>
                                    <Calendar
                                        className="mb-cal-sm"
                                        value={draft.IcsEnd ? new Date(draft.IcsEnd) : null}
                                        showTime
                                        hourFormat="12"
                                        dateFormat="dd/mm/yy"
                                        appendTo="self"
                                        readOnlyInput={true}
                                        hideOnDateTimeSelect
                                        disabled
                                    />
                                </div>
                            </div>
                            <Divider className="my-3" />

                            <div className="mv-ics-downloads">

                                {/* ICS ES */}
                                {draft?.Ics?.ES?.PathRelativo ? (
                                    <Button
                                        className="mv-ics-btn"
                                        icon="pi pi-download"
                                        label="Descargar ICS (ES)"
                                        onClick={() => window.open(toAbsouluteUrl(draft.Ics?.ES?.PathRelativo), "_blank")}
                                    />
                                ) : (
                                    <Tag value="Sin ICS (ES)" severity="secondary" />
                                )}

                                {/* ICS EN */}
                                {draft?.Ics?.EN?.FileName ? (
                                    <Button
                                        className="mv-ics-btn"
                                        icon="pi pi-download"
                                        label="Descargar ICS (EN)"
                                        onClick={() => window.open(toAbsouluteUrl(draft.Ics?.EN?.PathRelativo), "_blank")}
                                    />
                                ) : (
                                    <Tag value="Sin ICS (EN)" severity="secondary" />
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
            <EmailTemplatePreviewDialog open={tplDialogOpen} template={template} onClose={() => setTplDialogOpen(false)} />

            <Dialog
                header="Rechazar correo"
                visible={rejectOpen}
                modal
                onHide={() => setRejectOpen(false)}
                style={{ width: "36rem" }}
                headerClassName="dialog-header-gradient"
            >
                <div className="text-600 mb-2">Escribe el motivo del rechazo (se mostrará al creador del correo).</div>
                <InputTextarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={5}
                    autoResize
                    className="w-full"
                    placeholder="Escribe un motivo..."
                />
                <div className="flex justify-content-end gap-2 mt-3">
                    <Button label="Cancelar" outlined onClick={() => setRejectOpen(false)} />
                    <Button label="Rechazar" severity="danger" onClick={rechazar} />
                </div>
            </Dialog>
        </div>
    );
}