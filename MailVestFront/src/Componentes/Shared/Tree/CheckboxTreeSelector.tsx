/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tree, type TreeCheckboxSelectionKeys, type TreeExpandedKeysType, type TreeSelectionEvent } from 'primereact/tree';
import type { TreeNode } from 'primereact/treenode';
import { useEffect, useRef, useState } from 'react';

export interface CheckboxTreeSelectorProps {
    nodes: TreeNode[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    className?: string;
}

function buildSelectionKeysFromIds(
    nodes: TreeNode[],
    selectedIds: string[],
): TreeCheckboxSelectionKeys {
    
    const selected = new Set(selectedIds.map(String));
    const result: TreeCheckboxSelectionKeys = {};

    const walk = (node: TreeNode): { any: boolean, full: boolean} => {
        const key = String(node.key ?? '');
        const children = node.children ?? [];

        if(children.length === 0){
            const full = selected.has(key);
            if(full){
                result[key] = { checked: true, partialChecked: false } as any;
            }
            return { any: full, full };
        }

        let any = false;
        let full = true;

        for(const child of children){
            const childState = walk(child);
            if(childState.any){
                any = true;
            }
            if(!childState.full){
                full = false;
            }
        }

        if(any){
            result[key] = { checked: full, partialChecked: !full } as any;
        }
        return { any, full };
    };

    nodes.forEach(walk);
    return result;
}

function buildExpandedKeysFromSelection(
    nodes: TreeNode[],
    selectionKeys: TreeCheckboxSelectionKeys,
): TreeExpandedKeysType {

    const expanded: TreeExpandedKeysType = {};
    const hasAnySelection = Object.keys(selectionKeys || {}).length > 0;

    const walk = (node: TreeNode, depth: number): boolean => {
        const key = String(node.key ?? '');
        const children = node.children ?? [];

        let hasSelectedHere = !!selectionKeys[key as any];

        for(const child of children){
            if(walk(child, depth + 1)){
                hasSelectedHere = true;
            }
        }

        if(hasSelectedHere && depth === 0 && children.length > 0){
            expanded[key] = true;
        }

        return hasSelectedHere;
    };

    nodes.forEach((node) => walk(node,0));

    if(!hasAnySelection){
        nodes.forEach((node) => {
            if(node.children && node.children.length > 0){
                expanded[String(node.key ?? '')] = true;
            }
        });
    }

    return expanded;
}

export default function CheckboxTreeSelector({
    nodes,
    selectedIds,
    onChange,
    className,
}: CheckboxTreeSelectorProps) {

    const [selectionKeys, setSelectionKeys] = useState<TreeCheckboxSelectionKeys>({});
    const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});

    const formUserRef = useRef(false);

    useEffect(() => {
        const keys = buildSelectionKeysFromIds(nodes, selectedIds);
        setSelectionKeys(keys);

        if(!formUserRef.current){
            const expanded = buildExpandedKeysFromSelection(nodes, keys);
            setExpandedKeys(expanded);
        }

        formUserRef.current = false;
    }, [nodes, selectedIds]);

    const handleSelectionChange = (event: TreeSelectionEvent) => {

        const value = event.value as TreeCheckboxSelectionKeys;
        setSelectionKeys(value);

        const checkedIds: string[] = [];

        Object.entries(value || {}).forEach(([key, meta]) => {
            if(!meta){
                return;
            }
            const m = meta as any;
            if(m.checked || m.partialChecked){
                checkedIds.push(key);
            }
        });

        formUserRef.current = true;
        onChange(checkedIds);
    };

    return (
        <Tree
            value={nodes}
            selectionMode='checkbox'
            selectionKeys={selectionKeys}
            onSelectionChange={handleSelectionChange}
            expandedKeys={expandedKeys}
            onToggle={(e) => setExpandedKeys(e.value as TreeExpandedKeysType)}
            className={`mv-perm-tree mv-perm-animated ${className ?? ''}`}
        />
    )
}