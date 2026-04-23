/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import toAbsouluteUrl from "../../../../Utils/toAbsouluteUrl";
import { resolveFileIcon } from "../../../../Helpers/iconsAttachment";
import { Card } from "primereact/card";
import { useCallback, useEffect, useRef, useState } from "react";
import API from "../../../../API/ClientApi";

type EmailTemplatePreview = {
    Id: number;
    Name: string;

    ImageUrlES?: string;
    ImageUrlEN?: string;

    Attachment?: any[];

    ClickUrl?: string;

    ValidoDesde?: string;
    ValidoHasta?: string;

    ES?: { Subject: string, Html: string };
    EN?: { Subject: string, Html: string };

    UploadMode?: string;
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

type Props = {
    open: boolean;
    template: EmailTemplatePreview | null;
    onClose: () => void;
}

export default function EmailTemplatePreviewDialog({ open, template, onClose }: Props) {
    const [esPreview, setEsPreview] = useState<string>("");
    const [enPreview, setEnPreview] = useState<string>("");

    const [autoHeight, setAutoHeight] = useState<number>(0);

    const iframeRefES = useRef<HTMLIFrameElement | null>(null);
    const iframeRefEN = useRef<HTMLIFrameElement | null>(null);

    const getPreviewRootHeight = (doc: Document) => {
        const root = doc.getElementById("mv-preview-root");
        if (root) return root.scrollHeight;

        return Math.max(
            doc.body?.scrollHeight ?? 0,
            doc.documentElement?.scrollHeight ?? 0
        );
    };

    const recalcHeight = useCallback((ref: React.RefObject<HTMLIFrameElement | null>) => {
        if(!ref?.current) return;
        const el = ref.current;
        if (!el) return;
        try {
            const doc = el.contentDocument;
            if (!doc) return;

            const desired = getPreviewRootHeight(doc) + 8;

            const maxH = 1200;
            const finalH = Math.max(320, Math.min(desired, maxH));
            setAutoHeight(finalH);
        } catch { /* empty */ }
    }, []);

    useEffect(() => {
        const t = setTimeout(recalcHeight, 50);
        return () => clearTimeout(t);
    }, [esPreview, enPreview, recalcHeight]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!open || !template?.Id) return;

            let [es, en] = await Promise.all([
                API.get(`/plantillas/${template.Id}/preview`, { params: { lang: "ES" }, responseType: "text" as any }).then(r => (r.data as any) ?? ""),
                API.get(`/plantillas/${template.Id}/preview`, { params: { lang: "EN" }, responseType: "text" as any }).then(r => (r.data as any) ?? ""),
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
                setEnPreview(en);
                setEsPreview(es);
            }
        })();

        return () => { cancelled = true; };
    }, [open, template?.Id]);

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
        <Dialog
            header={template ? `Vista: ${template.Name}` : "Vista"}
            visible={open}
            onHide={onClose}
            modal
            resizable
            headerClassName="dialog-header-gradient"
            style={{ width: "2000px", minWidth: "42rem" }}>
            {!template ? (
                <div className="text-600">
                    No hay plantillas seleccionadas.
                </div>
            ) : (
                <div className="flex flex-column gap-2">
                    <div className="text-sm text-600" style={{ marginTop: "20px" }}>
                        Vigencia: <b>{template.ValidoDesde}</b> → <b>{template.ValidoHasta}</b>
                    </div>
                    <div className="text-sm text-600">
                        Click URL: <b>{template.ClickUrl}</b>
                    </div>
                    <Divider />

                    {template.UploadMode === "FILE" ? (
                        <div className="grid">
                            {(template.Attachment?.length ?? 0) > 0 ? (
                                <Card className="mv-card mv-card-compact col-12 surface-border"
                                    title="Archivos adjuntos"
                                    subTitle="Archivos cargados en la plantilla">
                                    <AttachmentPreviewList files={attachmentPreviews} />
                                </Card>
                            ) : (
                                <>
                                    <b>No hay archivos adjuntos</b>
                                </>
                            )}
                            <Divider />
                            <div className="col-12 md:col-6">
                                <div className="font-medium mb-1">Asunto (ES)</div>
                                <div className="text-700 mb-2">{template.ES?.Subject || "-"}</div>

                                {template.ES?.Html ? (
                                    <>
                                        <div className="font-medium mb-2">Correo(ES)</div>
                                        <div
                                            className="p-2 border-1 border-round surface-border"
                                            style={{ maxHeight: 420, overflow: "auto" }}
                                        >
                                            <iframe
                                                ref={iframeRefES}
                                                title="Preview ES"
                                                sandbox="allow-same-origin"
                                                onLoad={() => recalcHeight(iframeRefES)}
                                                style={{ width: "100%", height: autoHeight, border: 0, display: "block", borderRadius: 8 }}
                                                srcDoc={esPreview}
                                            />
                                        </div>
                                    </>
                                ) : null}
                            </div>
                            <div className="col-12 md:col-6">
                                <div className="font-medium mb-1">Asunto (EN)</div>
                                <div className="text-700 mb-2">{template.EN?.Subject || "-"}</div>

                                {template.EN?.Html ? (
                                    <>
                                        <div className="font-medium mb-2">Correo(EN)</div>
                                        <div
                                            className="p-2 border-1 border-round surface-border"
                                            style={{ maxHeight: 420, overflow: "auto" }}
                                        >
                                            <iframe
                                                ref={iframeRefEN}
                                                title="Preview EN"
                                                sandbox="allow-scripts"
                                                onLoad={() => recalcHeight(iframeRefEN)}
                                                style={{ width: "100%", height: autoHeight, border: 0, display: "block", borderRadius: 8 }}
                                                srcDoc={enPreview}
                                            />
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <div className="grid">
                                <div className="col-12 md:col-6">
                                    <div className="font-medium mb-1">Asunto (ES)</div>
                                    <div className="text-700 mb-2">{template.ES?.Subject || "-"}</div>

                                    <div className="font-medium mb-2">Correo(ES)</div>
                                    <div
                                        className="p-2 border-1 border-round surface-border"
                                    >
                                        
                                        <iframe
                                            ref={iframeRefES}
                                            title=""
                                            sandbox="allow-same-origin"
                                            onLoad={() => recalcHeight(iframeRefES)}
                                            style={{ width: "100%", height: autoHeight, border: 0, display: "block", borderRadius: 8 }}
                                            srcDoc={esPreview}
                                        />
                                    </div>
                                </div>
                                <div className="col-12 md:col-6">
                                    <div className="font-medium mb-1">Asunto (EN)</div>
                                    <div className="text-700 mb-2">{template.EN?.Subject || "-"}</div>

                                    <div className="font-medium mb-2">Correo(EN)</div>
                                    <div
                                        className="p-2 border-1 border-round surface-border"
                                    >
                                        <iframe
                                            ref={iframeRefEN}
                                            title=""
                                            sandbox="allow-same-origin"
                                            onLoad={() => recalcHeight(iframeRefEN)}
                                            style={{ width: "100%", height: autoHeight, border: 0, display: "block", borderRadius: 8 }}
                                            srcDoc={enPreview}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                    <div className="flex justify-content-end mt-3">
                        <Button label="Cerrar" icon="pi pi-times" onClick={onClose} />
                    </div>
                </div>
            )
            }
        </Dialog >
    )
}

export const AttachmentPreviewList = ({ files }: { files: AttachmentPreview[]; }) => {
    if (!files.length) {
        return null;
    }

    return (
        <div className="mt-2 flex flex-column gap-2">
            <div className="font-semibold">Archivos Adjuntos Cargados</div>
            {files.map((f) => (
                <div className="attachment-row" key={f.id}>
                    <div className="attachment-left">
                        <div className="attachment-icon"><i className={`${resolveFileIcon(f.extension)} mv-attach-icon pi-fw text-2xl`} /></div>
                        <div className="attachment-meta">
                            <div className="attachment-name mv-attach-name">{f.name}</div>
                            <div className="attachment-ext mv-attach-ext">{f.extension}</div>
                        </div>
                    </div>

                    <div className="attachment-actions mv-attach-actions">
                        {!!f.url && (
                            <Button
                                type="button"
                                label="Descargar"
                                icon="pi pi-download"
                                className="p-button-sm p-button-text mv-attach-btn"
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