import { InputTextarea } from "primereact/inputtextarea";
import { useCallback, useEffect, useMemo, useRef } from "react";

type Props = {
    userValue: string;
    onUserValueChange: (v: string) => void;

    suffix: string;
    rows?: number;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
};

function stripAllOccurrences(haystack: string, needle: string): string {
    if(!needle) return haystack;
    return haystack.split(needle).join('');
}

export const FixedSuffixTextArea: React.FC<Props> = ({
    userValue,
    onUserValueChange,
    suffix,
    rows = 8,
    disabled,
    placeholder,
    className,
    style,
}) => {
    const ref = useRef<HTMLTextAreaElement | null>(null);

    const effectiveSuffix = useMemo(() => suffix ?? "", [suffix]);

    const displayValue = useMemo(() => {
        if(!effectiveSuffix) return userValue;
        
        const cleanedUser = stripAllOccurrences(userValue, effectiveSuffix);
        return `${cleanedUser}${effectiveSuffix}`;
    }, [userValue, effectiveSuffix]);

    const boundary = useMemo(() => {
        return effectiveSuffix ? Math.max(0, displayValue.length - effectiveSuffix.length) : displayValue.length;
    }, [displayValue.length, effectiveSuffix]);

    const clampCaret = useCallback(() => {
        const el = ref.current;
        if(!el) return;

        const s = el.selectionStart ?? 0;
        const e = el.selectionEnd ?? 0;

        const cs = Math.min(s, boundary);
        const ce = Math.min(e, boundary);

        if(cs !== s || ce !== e){
            el.setSelectionRange(cs, ce);
        }
    }, [boundary]);

    useEffect(() => {
        clampCaret();
    }, [displayValue, clampCaret]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const next = e.target.value ?? "";

        if(!effectiveSuffix){
            onUserValueChange(next);
            return;
        }

        let normalized = next;

        if(!normalized.endsWith(effectiveSuffix)) normalized = `${normalized}${effectiveSuffix}`;

        const lastIdx = normalized.lastIndexOf(effectiveSuffix);
        const before = normalized.slice(0, lastIdx);

        const cleanedUser = stripAllOccurrences(before, effectiveSuffix);
        onUserValueChange(cleanedUser);
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if(!effectiveSuffix) return;

        const el = ref.current;
        if(!el) return;

        const s = el.selectionStart ?? 0;
        const en = el.selectionEnd ?? 0;

        if(s > boundary || en > boundary){
            requestAnimationFrame(clampCaret);
            return;
        }

        if(e.key === "Delete" && s === en && s === boundary){
            e.preventDefault();
            return;
        }

        if(e.key === "ArrowRight" && s === en && s === boundary) {
            e.preventDefault();
            return;
        }

        if(e.key === "End") {
            e.preventDefault();
            el.setSelectionRange(boundary, boundary);
            return;
        }
    };

    return (
        <InputTextarea
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={clampCaret}
        onSelect={clampCaret}
        onClick={clampCaret}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        style={style}
        autoResize
        ref={ref}
        />
    );
};