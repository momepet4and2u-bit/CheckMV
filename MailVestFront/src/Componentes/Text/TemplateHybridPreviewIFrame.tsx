/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import EmailTemplateStore from "../../Paginas/Correos/Plantillas/Templates/emailTemplates.store";

// Cache en memoria (por pestaña)
let cachedShell: string | null = null;

type Props = {
    lang: string;
    title: string;
    htmlRaw: string;
    imageUrl?: string;
    height?: number;
};

function buildImageHtml(src: string) {
    const safe = escapeHTML(src);
    return `
        <div style="margin:0 0 12px 0">
        <img src="${safe}" alt=""
        
        style="max-width:100%;height:auto;display:block;border:0;border-radius:10px;max-height:520px;object-fit:contain;" />
        </div>
        `;
}
function escapeHTML(s: string) {
    return (s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export default function TemplateHybridPreviewIFrame({
    lang,
    title,
    htmlRaw,
    imageUrl,
}: Props) {
    const [shell, setShell] = useState<string>(cachedShell ?? "");
    const [srcDoc, setSrcDoc] = useState<string>("");
    const [autoHeight, setAutoHeight] = useState<number>(320);
    const [ready, setReady] = useState(false);

    const [isFrameLoaded, setIsFrameLoaded] = useState(false);

    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const recalcHeight = useCallback(() => {
        const el = iframeRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            try {
                const doc = el.contentDocument;
                if (!doc) return;

                const h = getContentHeight(doc) + 8;

                const clamped = Math.max(320, Math.min(h, 1200));
                setAutoHeight(clamped);
                setReady(true);
            } catch { /* empty */ }
        })
    }, []);

    const getContentHeight = (doc: Document) => {
        const root = doc.getElementById("mv-preview-root");
        if (root) return root.scrollHeight;

        return Math.max(doc.body?.scrollHeight ?? 0, doc.documentElement?.scrollHeight ?? 0);
    };

    // 1) Crargar html shell desde el back (ese es el bueno)
    useEffect(() => {
        let cancelled = false;

        if (cachedShell) return;

        (async () => {
            if (cachedShell) {
                if (!cancelled) setShell(cachedShell);
                return;
            }
            const s = await EmailTemplateStore.getPreviewShell();
            cachedShell = s;
            if (!cancelled) setShell(s);
        })();

        return () => { cancelled = true; };
    }, []);

    //2) Preview local instantaneo (shell + contenido)
    //2) NUEVO - Preparar srcDoc cuando cambia el idioma o llega el shell
    useEffect(() => {
        const targetShell = shell || cachedShell;
        if (!targetShell) return;

        const base = targetShell
            .replace("{{IMAGE_SECTION}}", `<div id="mv-image-slot"></div>`)
            .replace("{{TITLE}}", `<div id="mv-title-slot"></div>`)
            .replace("{{CONTENT}}", `<div id="mv-content-slot"></div>`);

        setSrcDoc(base);
        setIsFrameLoaded(false); // Resetear porque el iframe se recargará con el nuevo srcDoc
    }, [lang, shell]);

    // useEffect(() => {
    //     if(cachedShell){
    //         setShell(cachedShell);

    //         const base = cachedShell
    //         .replace("{{IMAGE_SECTION}}", `<div id="mv-image-slot"></div>`)
    //         .replace("{{TITLE}}", `<div id="mv-title-slot"></div>`)
    //         .replace("{{CONTENT}}", `<div id="mv-content-slot"></div>`);

    //         setSrcDoc(base);
    //         return;
    //     }
    // }, [lang]);

    // useEffect(() => {
    //     const doc = iframeRef.current?.contentDocument;
    //     if (!doc) return;

    //     const titleSlot = doc.getElementById("mv-title-slot");
    //     if (titleSlot) {
    //         titleSlot.textContent = title ?? "";
    //     }

    //     const contentSlot = doc.getElementById("mv-content-slot");
    //     if (contentSlot) {
    //         contentSlot.innerHTML = htmlRaw;
    //     }
    //     recalcHeight();
    // }, [htmlRaw, recalcHeight, title]);

    // 3) Inyectar Título y Contenido (Solo cuando el iframe cargó su estructura)
    useEffect(() => {
        if (!isFrameLoaded || !srcDoc) return;

        const inject = () => {
            const doc = iframeRef.current?.contentDocument;
            if (!doc) return false;

            const titleSlot = doc.getElementById("mv-title-slot");
            const contentSlot = doc.getElementById("mv-content-slot");

            // 2. CLAVE: Si los slots NO existen aún en el DOM del iframe, 
            // significa que el navegador sigue parseando el srcDoc.
            if (!titleSlot || !contentSlot) return false;

            titleSlot.textContent = title ?? "";
            contentSlot.innerHTML = htmlRaw;

            recalcHeight();
            return true;
        };

        const succes = inject();

        if (!succes) {
            const timeout = setTimeout(() => {
                inject();
            }, 50); // Un pequeño delay de 50ms suele ser suficiente
            return () => clearTimeout(timeout);
        }
    }, [isFrameLoaded, htmlRaw, title, recalcHeight, srcDoc]);

    // 4) Inyectar Imagen
    useEffect(() => {
        if (!isFrameLoaded) return;

        const doc = iframeRef.current?.contentDocument;
        if (!doc) return;

        const imgSlot = doc?.getElementById("mv-image-slot");
        if (!imgSlot) return;

        if (!imageUrl) {
            imgSlot.innerHTML = "";
            recalcHeight();
            return;
        }

        const isBlob = imageUrl.startsWith("blob:");
        const cacheBusted = isBlob ? imageUrl : `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}_pv=${Date.now()}`;

        imgSlot.innerHTML = buildImageHtml(cacheBusted);

        const img = imgSlot.querySelector("img");
        if (img) {
            img.addEventListener("load", recalcHeight, { once: true });
            img.addEventListener("error", recalcHeight, { once: true });
        }
    }, [imageUrl, isFrameLoaded, recalcHeight]);

    // useEffect(() => {
    //     debugger;

    //     const doc = iframeRef.current?.contentDocument;
    //     if (!doc) return;

    //     const imgSlot = doc.getElementById("mv-image-slot");
    //     if (!imgSlot) return;

    //     if (!imageUrl) {
    //         imgSlot.innerHTML = "";
    //         recalcHeight();
    //         return;
    //     }


    //     const isBlob = imageUrl.startsWith("blob:");

    //     const cacheBusted =
    //        isBlob
    //         ? imageUrl
    //         : imageUrl.includes("?")
    //             ? `${imageUrl}&_pv=${Date.now()}`
    //             : `${imageUrl}?_pv=${Date.now()}`;

    //     imgSlot.innerHTML = buildImageHtml(cacheBusted);

    //     const img = imgSlot.querySelector("img");
    //     if (img) {
    //         img.addEventListener("load", recalcHeight, { once: true });
    //         img.addEventListener("error", recalcHeight, { once: true });
    //     } else {
    //         recalcHeight();
    //     }
    // }, [imageUrl, recalcHeight]);

    // 5) ResizeObserver para cambios dinámicos
    useEffect(() => {
        if (!isFrameLoaded) return;

        const doc = iframeRef.current?.contentDocument;
        if (!doc) return;

        const ro = new ResizeObserver(() => recalcHeight());
        const root = doc.getElementById("mv-preview-root") || doc.body;
        if (root) ro.observe(root);

        return () => ro.disconnect();
    }, [isFrameLoaded, recalcHeight]);

    useLayoutEffect(() => {
        setAutoHeight(320);
        setReady(false);
    }, [srcDoc]);

    // useEffect(() => {
    //     const iframe = iframeRef.current;
    //     if (!iframe) return;

    //     const doc = iframe.contentDocument;
    //     if (!doc) return;

    //     recalcHeight();

    //     // Observa cambios de layout

    //     const ro = new ResizeObserver(() => recalcHeight());
    //     const root = doc.getElementById("mv-preview-root");
    //     if (root instanceof Element) {
    //         ro.observe(root);
    //     } else if (doc.body instanceof Element) {
    //         ro.observe(doc.body);
    //     } else if (doc.documentElement instanceof Element) {
    //         ro.observe(doc.documentElement);
    //     }

    //     return () => ro.disconnect();
    // }, [srcDoc, recalcHeight]);

    // useLayoutEffect(() => {
    //     setAutoHeight(320);
    //     setReady(false);
    // }, [srcDoc]);

    return (
        <iframe
            ref={iframeRef}
            title="Preview"
            sandbox="allow-same-origin"
            onLoad={() => {
                setIsFrameLoaded(true);
                recalcHeight();
            }}
            style={{
                width: "100%",
                height: autoHeight,
                border: 0,
                display: "block",
                background: "white",
                borderRadius: 8,
                opacity: ready ? 1 : 0,
                visibility: ready ? "visible" : "hidden",
                transition: "opacity 120ms ease",
            }}
            srcDoc={srcDoc}
        />
    );
}