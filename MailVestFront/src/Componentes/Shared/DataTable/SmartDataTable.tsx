/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterMatchMode, } from "primereact/api";
import { Column, type ColumnEditorOptions } from "primereact/column";
import { DataTable, type DataTableFilterMeta, type DataTableRowEditCompleteEvent, type DataTableRowEditEvent } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button as PrimeButton } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { isEqual } from "lodash";

const PrimeDataTable: any = DataTable;

function resolveEditable<T>(
    editable: boolean | ((row: T) => boolean) | undefined,
    row: T
): boolean {
    if (typeof editable === 'function') return editable(row);
    return !!editable; // mantiene compatibilidad con booleano
}


export interface LazyLoadState {
    first?: number;
    rows?: number;
    sortField?: string;
    sortOrder?: 1 | 0 | -1 | null;
    filters?: DataTableFilterMeta
}

export type SmartColumn<T extends Record<string, any>> = {
    field: keyof T;
    header?: string;
    width?: string;

    filter?: boolean;
    filterPlaceholder?: string;
    filterMatchMode?: FilterMatchMode;

    editable?: boolean | ((row: T) => boolean);
    body?: (row: T) => React.ReactNode;
    editor?: (options: ColumnEditorOptions) => React.ReactNode;

    headerClassName?: string;
    bodyClassName?: string;
};

export type SmartLoaderResult<T> = {
    data: T[];
    totalRecords: number;
}

export type SmartDataTableProps<T extends Record<string, any>> = {
    idField: keyof T;

    columns: SmartColumn<T>[];

    title?: string;

    pageSize?: number;

    scrollHeight?: string;

    sliceNumber?: number;

    canEdit?: boolean;
    editMode?: 'row' | 'dialog';
    onRowEditComplete?: (e: DataTableRowEditCompleteEvent) => void;
    onCellEditComplete?: (e: any) => void;
    onEditRow?: (row: T) => void;

    rowEditLock?: (row: T) => boolean;

    canExport?: boolean;
    exportFileName?: string;

    globalFilterFields: (keyof T)[];

    loadMode?: 'lazy' | 'client';

    loader: (state: LazyLoadState) => Promise<
        SmartLoaderResult<T>
    >;

    externalRowPatch?: {
        id: T[keyof T];
        patch: Partial<T>;
        nonce?: number;
    } | null;

    selectionMode?: 'single' | 'multiple';
    selection?: T[] | T | null;
    onSelectionChange?: (selection: T[] | T | null) => void;

    canAdd?: boolean;
    onAddClick?: () => void;
    addButtonLabel?: string;

    //Clases dinamicas
    wrapperClassName?: string;
    headerClassName?: string;
    tableClassName?: string;
    columnHeaderClassName?: string;
};

const fallback_text = 'No se pudo recuperar su información';

function humanize(key: string): string {
    return key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (c) => c.toUpperCase())
}

export function SmartDataTable<T extends Record<string, any>>({
    idField,
    columns,
    title,
    pageSize = 50,
    scrollHeight = '600px',
    sliceNumber = -1,
    canEdit = false,
    editMode = 'row',
    onRowEditComplete,
    canExport = false,
    exportFileName = 'export',
    globalFilterFields,
    loadMode = 'lazy',
    loader,
    externalRowPatch,
    selectionMode,
    selection,
    onSelectionChange,
    canAdd = false,
    onAddClick,
    onEditRow,
    rowEditLock,

    wrapperClassName,
    headerClassName,
    tableClassName,
    columnHeaderClassName,
}: SmartDataTableProps<T>) {

    const dt = useRef<DataTable<any>>(null);

    const [lazyState, setLazyState] = useState<LazyLoadState>({
        first: 0,
        rows: pageSize,
        sortField: undefined,
        sortOrder: 1,
        filters: {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        }
    });

    const [data, setData] = useState<T[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    const [originalRows, setOriginalRows] = useState<Record<string | number, T>>({});
    const [draftRows, setDraftRows] = useState<Record<string | number, T>>({});

    const getId = (row: T): string | number =>
        row[idField] as unknown as string | number;

    const areEqual = (a: T, b: T): boolean =>
        isEqual(a, b);

    const useRowEdit = canEdit && editMode === 'row';
    const useDialogEdit = canEdit && editMode === 'dialog';

    const effectiveEditMode = useRowEdit ? (editMode as 'row') : undefined;

    const mergeClass = (...classes: Array<string | undefined | null | false>) =>
        classes.filter(Boolean).join(' ');

    const isRowLocked = useCallback((row: T) => {
        if (!rowEditLock) return false;
        try {
            return !!rowEditLock(row);
        } catch {
            return false;
        }
    }, [rowEditLock]);

    //Modo servidor:
    useEffect(() => {
        if (loadMode !== 'lazy') {
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const result = await loader(lazyState);
                if (!cancelled) {
                    setData(result.data);
                    setTotalRecords(result.totalRecords);
                }
            } catch (err) {
                console.error('Error cargando datos (SmartDataTable)', err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        load();

        return () => {
            cancelled = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lazyState, loader, lazyState]);


    //Modo cliente:
    useEffect(() => {
        if (loadMode !== 'client') {
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const result = await loader(lazyState);
                if (!cancelled) {
                    setData(result.data);
                    setTotalRecords(result.totalRecords);
                }
            } catch (err) {
                console.error('Error cargando datos (SmartDataTable)', err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadMode, loader]);

    useEffect(() => {
        setLazyState((prev) => ({
            ...prev,
            rows: pageSize
        }));
    }, [pageSize]);

    useEffect(() => {
        if(!externalRowPatch){
            return;
        }

        const { id, patch} = externalRowPatch;

        setData(prev => {
            let changed = false;

            const next = prev.map(row => {
                if(row[idField] === id) {
                    changed = true;
                    return {
                        ...row,
                        ...patch
                    };
                }
                    return row;
            });

            return changed ? next : prev;
        })
    }, [externalRowPatch, externalRowPatch?.id, externalRowPatch?.nonce, idField]);

    const onLazyLoad = (event: any) => {
        setLazyState({
            first: event.first ?? 0,
            rows: event.rows ?? pageSize,
            sortField: event.sortField,
            sortOrder: event.sortOrder,
            filters: event.filters,
        } as LazyLoadState);
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const value = e.target.value;
        setGlobalFilterValue(value);

        setLazyState((prev) => ({
            ...prev,
            first: 0,
            filters: {
                ...(prev?.filters ?? {}),
                global: { value, matchMode: FilterMatchMode.CONTAINS },
            },
        }));
    };

    const header = (
        <div className={mergeClass('sdt-header', headerClassName)}>
            <div className="sdt-header-left">
                {title && <span className="sdt-title">{title}</span>}
            </div>
            <div className="sdt-header-right">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder={`Buscar ${title ?? ''}`.trim()}
                    />
                </span>
                <div
                    className="flex gap-2">
                    {canAdd && onAddClick && (
                        <PrimeButton
                            type="button"
                            icon="pi pi-user-plus"
                            label={`Nuevo ${title?.slice(0, sliceNumber) ?? 'Nuevo'}`}
                            onClick={onAddClick}
                            className="!bg-sky-600 !border-none !text-white !px-3 !py-2 !rounded-full shadow-md hover:shadow-lg hover:!bg-sky-700 transition-all duration-150"
                            style={{
                                backgroundColor: "#763dbe",
                                borderColor: "#763dbe"
                            }}
                        />
                    )}
                    {canExport && (
                        <PrimeButton
                            type="button"
                            icon="pi pi-file-excel"
                            label="Exportar"
                            onClick={() => dt.current?.exportCSV({ selectionOnly: false })}
                            severity="success"
                            outlined
                        />
                    )}
                </div>
            </div>
        </div>
    );

    const skeletonRows: { _id: number }[] = useMemo(
        () => Array.from({ length: pageSize }, (_, i) => ({ _id: i })),
        [pageSize],
    );

    const isSkeletonRow = (row: T | { _id: number }) =>
        (row as any)._id !== undefined;

    const tableValue =
        loading && data.length === 0
            ? (skeletonRows as any)
            : data;

    const markRowDraftFromOptions = (options: ColumnEditorOptions, value: any) => {
        const row = options.rowData as T;
        const id = getId(row);
        const field = options.field as keyof T;

        const prevDraft = draftRows[id] ?? row;
        const newDraft = { ...prevDraft, [field]: value };

        setDraftRows(prev => ({
            ...prev,
            [id]: newDraft,
        }));
    };

    const defaultTextEditor = (options: ColumnEditorOptions) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            options.editorCallback?.(e.target.value);
        };

        return (
            <InputText
                value={options.value ?? ''}
                onChange={handleChange}
            />
        );
    };

    const handleRowEditInit = (e: DataTableRowEditEvent) => {
        const row = e.data as T;

        if (isRowLocked(row)) {
            const oe: any = (e as any).originalEvent;
            oe?.preventDefault?.();
            oe?.stopPropagation?.();
            oe?.stopImmediatePropagation?.();
            return;
        }
        const id = getId(row);

        setOriginalRows(prev => ({
            ...prev,
            [id]: { ...row },
        }));

        setDraftRows(prev => ({
            ...prev,
            [id]: { ...row },
        }));
    };

    const handleRowEditCancel = (e: DataTableRowEditEvent) => {
        const row = e.data as T;
        const id = getId(row);

        setOriginalRows(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });

        setDraftRows(prev => ({
            ...prev,
            [id]: { ...row },
        }));
    };

    const handleRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
        const newRow = e.newData as T;
        const id = getId(newRow);

        const original = originalRows[id];

        const hasChanges = original ? !areEqual(original, newRow) : true;

        const cleanupRow = () => {
            setOriginalRows(prev => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });


            setDraftRows(prev => {

                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        };

        if (!hasChanges) {
            cleanupRow();
            return;
        }

        onRowEditComplete?.(e);
        cleanupRow();
    };

    const rowClassName = (row: T) => {
        const id = getId(row);
        const original = originalRows[id];
        const locked = isRowLocked(row);

        if (!original) {
            return {};
        }

        const draft = draftRows[id] ?? row;
        const hasChanges = !areEqual(original, draft);

        return {
            'sdt-row-clean': !hasChanges,
            'sdt-row-locked': locked,
        };
    };

    const buildColumn = (col: SmartColumn<T>) => {
        const headerText = col.header ?? humanize(String(col.field));

        const bodyFn =
            col.body ??
            ((row: T | { _id: number }) => {
                if (loading && isSkeletonRow(row)) {
                    return <Skeleton />;
                }
                const value = (row as T)[col.field] as any;
                if (value === undefined || value === null) {
                    return (
                        <span className="sdt-cell-muted">
                            {fallback_text}
                        </span>
                    );
                }
                if (typeof value === 'string' && value.trim() === '') {
                    return (
                        <span className="sdt-cell-muted">
                            {fallback_text}
                        </span>
                    );
                }
                return String(value);
            });


        const editorBase = col.editor ?? defaultTextEditor;

        const editorFn =
            canEdit
                ? (options: ColumnEditorOptions) => {
                    const row = options.rowData as T;
                    const enabled = resolveEditable<T>(col.editable, row);

                    if (!enabled) {
                        const value = options.value ?? '';
                        return (
                            <span className="sdt-cell-readonly">
                                {String(value)}
                            </span>
                        );
                    }
                    const wrappedOptions: ColumnEditorOptions = {
                        ...options,
                        editorCallback: (value: any) => {
                            markRowDraftFromOptions(options, value);
                            options.editorCallback?.(value);
                        },
                    };
                    return editorBase(wrappedOptions);
                }
                : undefined;


        return (
            <Column
                key={String(col.field)}
                field={String(col.field)}
                header={headerText}
                headerClassName={mergeClass('sdt-header-text',
                    columnHeaderClassName,
                    col.headerClassName)}
                bodyClassName={mergeClass(undefined, col.bodyClassName)}
                style={col.width ? { minWidth: col.width } : undefined}
                filter={col.filter}
                showFilterMenu={col.filter}
                filterPlaceholder={col.filterPlaceholder}
                filterMatchMode={col.filterMatchMode}
                body={bodyFn}
                editor={editorFn}
            />
        );
    };

    return (
        <div className={mergeClass('sdt-wrapper', wrapperClassName)}>
            {rowEditLock && (
                <style>{`
                .sdt-row-locked { opacity: 0.75; }
                .sdt-row-locked td { cursor: not-allowed; }
                .sdt-row-locked .p-row-editor-init,
                .sdt-row-locked .p-row-editor-save,
                .sdt-row-locked .p-row-editor-cancel { display: none !important; }
                    `}</style>
            )}
            <PrimeDataTable
                ref={dt}
                value={tableValue}
                header={header}
                dataKey={loading ? undefined : (idField as string)}
                first={lazyState?.first ?? 0}
                rows={lazyState?.rows ?? pageSize}
                totalRecords={totalRecords}
                filters={lazyState?.filters}
                filterDisplay="menu"
                globalFilterFields={globalFilterFields.map((f) => f as string)}
                scrollable
                virtualScrollerOptions={{
                    lazy: true,
                    onLazyLoad,
                    itemSize: 48,
                }}
                scrollHeight={scrollHeight}
                showGridlines
                stripedRows
                className={mergeClass('p-datatable-stripped sdt-table',
                    tableClassName)}
                tableStyle={{ minWidth: '100%' }}
                paginator={false}
                loading={false}
                emptyMessage={
                    loading ? '' : 'No se encontraron registros con los filtros aplicados.'
                }
                editMode={effectiveEditMode}
                onRowEditInit={
                    useRowEdit ? handleRowEditInit : undefined
                }
                onRowEditCancel={
                    useRowEdit ? handleRowEditCancel : undefined
                }
                onRowEditComplete={
                    useRowEdit ? handleRowEditComplete : undefined
                }
                rowClassName={rowClassName}
                selection={selection}
                exportFilename={exportFileName}
                onSelectionChange={(e: any) => onSelectionChange?.(e.value)}
            >
                {selectionMode && (
                    <Column
                        selectionMode={selectionMode}
                        headerStyle={{ width: '3rem' }}
                    />
                )}
                {columns.map(buildColumn)}
                {useRowEdit && (
                    <Column
                        rowEditor
                        headerStyle={{ width: '6rem' }}
                        bodyStyle={{ textAlign: 'center' }}
                    />
                )}
                {useDialogEdit && (
                    <Column
                        header="Acciones"
                        headerStyle={{ width: '6rem', textAlign: 'center' }}
                        bodyStyle={{ textAlign: 'center' }}
                        body={(rowData: T) => (
                            <button
                                type="button"
                                className="p-button p-button-text p-button-rounded p-button-icon-only"
                                disabled={isRowLocked(rowData)}
                                onClick={() => {
                                    if (isRowLocked(rowData)) return;
                                    onEditRow?.(rowData);
                                }}
                            >
                                <i className="pi pi-pencil" />
                            </button>
                        )}
                    />
                )}
            </PrimeDataTable>
        </div>
    )
}