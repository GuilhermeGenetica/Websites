/**
 * modules/canvas.jsx — SeqNode-OS Canvas (React Flow)
 *
 * Exports:
 *   WorkflowCanvas  — main React component
 *   addNodeFromPlugin(toolId, x, y, store, plugins)
 *   addSpecialNode(nodeType, x, y, store)
 *   removeNode(nodeId, store)
 */

import {
    useCallback, useEffect, useRef, useMemo,
} from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position,
    useReactFlow,
    ReactFlowProvider,
    MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/* ════════════════════════════════════════════════════════════
   Adaptive initial zoom
   ════════════════════════════════════════════════════════════ */

function getAdaptiveInitialZoom() {
    const w = window.innerWidth;
    if (w >= 7680) return 3.8;
    if (w >= 5120) return 2.6;
    if (w >= 3840) return 2.0;
    if (w >= 2560) return 1.4;
    if (w >= 1920) return 1.0;
    if (w >= 1366) return 0.88;
    if (w >= 1024) return 0.80;
    return 0.72;
}

/* ════════════════════════════════════════════════════════════
   Workflow ←→ React Flow conversion
   ════════════════════════════════════════════════════════════ */

function toRFNodes(seqNodes, plugins, nodeStatuses, selectedNodeId) {
    return seqNodes.map(node => {
        const plugin   = plugins.find(p => p.id === node.tool_id);
        const status   = nodeStatuses[node.id] || "";
        return {
            id:       node.id,
            type:     "seqNode",
            position: { x: node.position.x, y: node.position.y },
            selected: node.id === selectedNodeId,
            data: {
                node,
                plugin,
                status,
                label:     node.label || node.tool_id,
                nodeType:  node.node_type || "tool",
                enabled:   node.enabled !== false,
            },
        };
    });
}

function toRFEdges(seqNodes, selectedEdge) {
    const edges = [];
    for (const node of seqNodes) {
        for (const targetId of (node.edges || [])) {
            const edgeId  = node.id + "__to__" + targetId;
            const isSelected = selectedEdge &&
                selectedEdge.source === node.id &&
                selectedEdge.target === targetId;
            edges.push({
                id:           edgeId,
                source:       node.id,
                target:       targetId,
                selected:     !!isSelected,
                type:         "smoothstep",
                markerEnd:    { type: MarkerType.ArrowClosed, width: 16, height: 16 },
                style:        {
                    stroke:      isSelected ? "var(--accent)" : "var(--edge-default, #5a5a8a)",
                    strokeWidth: isSelected ? 2.5 : 2,
                },
            });
        }
    }
    return edges;
}

/* ════════════════════════════════════════════════════════════
   SeqNode custom node component
   ════════════════════════════════════════════════════════════ */

const NODE_W = 180;

function SeqNodeComponent({ data, selected }) {
    const { node, plugin, status, label, nodeType, enabled } = data;

    const inputs  = plugin ? Object.keys(plugin.inputs  || {}) : [];
    const outputs = plugin ? Object.keys(plugin.outputs || {}) : [];
    const portCount = Math.max(inputs.length, outputs.length, 1);
    const nodeH = Math.max(60, 40 + portCount * 18);

    // Fill color
    const fillColor = selected            ? "var(--node-selected)"
        : !enabled                        ? "var(--bg-secondary)"
        : status === "RUNNING"            ? "var(--node-running,#1a3a5c)"
        : status === "COMPLETED"          ? "var(--node-completed,#1a4a2a)"
        : status === "FAILED"             ? "var(--node-failed,#4a1a1a)"
        : status === "SKIPPED"            ? "var(--node-skipped,#2a2a2a)"
        : status === "CANCELLED"          ? "var(--node-cancelled,#2a2a1a)"
        : "var(--node-bg, #1e2a3a)";

    // Border color
    const strokeColor = selected          ? "var(--accent)"
        : status === "RUNNING"            ? "var(--accent)"
        : status === "COMPLETED"          ? "#4caf50"
        : status === "FAILED"             ? "#f44336"
        : status === "SKIPPED"            ? "#555"
        : nodeType === "subworkflow"      ? "#9c27b0"
        : nodeType === "condition"        ? "#ff9800"
        : nodeType === "ai_agent"         ? "#00bcd4"
        : nodeType === "pause"            ? "#ffc107"
        : nodeType === "loop"             ? "#8bc34a"
        : "var(--border, #334)";

    const typeIcons = { subworkflow: "\u2937", condition: "\u25C6", ai_agent: "\u2726", pause: "\u23F8", loop: "\u21BA" };
    const typeIcon = typeIcons[nodeType];

    const statusColor = status === "RUNNING" ? "var(--accent)"
        : status === "COMPLETED" ? "#4caf50"
        : status === "FAILED"    ? "#f44336"
        : undefined;

    const subLabel = status
        ? status
        : nodeType !== "tool" ? nodeType.toUpperCase()
        : plugin ? plugin.category : "";

    return (
        <div
            style={{
                width:        NODE_W,
                minHeight:    nodeH,
                background:   fillColor,
                border:       "1px solid " + strokeColor,
                borderRadius: "6px",
                position:     "relative",
                fontSize:     "11px",
                userSelect:   "none",
                boxShadow:    selected ? "0 0 0 2px var(--accent)" : undefined,
            }}
            className="seqnode-card"
        >
            {/* Title */}
            <div style={{
                padding:    "4px 8px 0",
                fontWeight: 600,
                fontSize:   "12px",
                textAlign:  "center",
                overflow:   "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color:      "var(--text-primary, #e0e0e0)",
            }}>
                {label.substring(0, 22)}
            </div>

            {/* Subtitle / status */}
            <div style={{
                textAlign:  "center",
                fontSize:   "10px",
                color:      statusColor || "var(--text-secondary, #888)",
                padding:    "0 4px 4px",
                overflow:   "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            }}>
                {subLabel.substring(0, 25)}
            </div>

            {/* Type icon */}
            {typeIcon && (
                <div style={{
                    position: "absolute",
                    top: "2px",
                    right: "6px",
                    fontSize: "10px",
                    color: strokeColor,
                    pointerEvents: "none",
                }}>
                    {typeIcon}
                </div>
            )}

            {/* Input handles */}
            {inputs.map((name, i) => {
                const top = 44 + i * 18;
                return (
                    <Handle
                        key={"in-" + name}
                        type="target"
                        position={Position.Left}
                        id={name}
                        style={{ top, background: "var(--accent)", width: 10, height: 10 }}
                        title={name}
                    />
                );
            })}
            {/* Fallback input handle if no plugin inputs defined */}
            {inputs.length === 0 && (
                <Handle
                    key="in-default"
                    type="target"
                    position={Position.Left}
                    id="default_in"
                    style={{ top: "50%", background: "var(--accent)", width: 10, height: 10 }}
                />
            )}

            {/* Output handles */}
            {outputs.map((name, i) => {
                const top = 44 + i * 18;
                return (
                    <Handle
                        key={"out-" + name}
                        type="source"
                        position={Position.Right}
                        id={name}
                        style={{ top, background: "var(--accent)", width: 10, height: 10 }}
                        title={name}
                    />
                );
            })}
            {/* Fallback output handle */}
            {outputs.length === 0 && (
                <Handle
                    key="out-default"
                    type="source"
                    position={Position.Right}
                    id="default_out"
                    style={{ top: "50%", background: "var(--accent)", width: 10, height: 10 }}
                />
            )}

            {/* Port labels */}
            {inputs.map((name, i) => (
                <div key={"inlbl-" + name} style={{
                    position: "absolute",
                    left: "12px",
                    top: 40 + i * 18,
                    fontSize: "9px",
                    color: "var(--text-secondary, #888)",
                    pointerEvents: "none",
                }}>
                    {name}
                </div>
            ))}
            {outputs.map((name, i) => (
                <div key={"outlbl-" + name} style={{
                    position: "absolute",
                    right: "12px",
                    top: 40 + i * 18,
                    fontSize: "9px",
                    color: "var(--text-secondary, #888)",
                    textAlign: "right",
                    pointerEvents: "none",
                }}>
                    {name}
                </div>
            ))}
        </div>
    );
}

const nodeTypes = { seqNode: SeqNodeComponent };

/* ════════════════════════════════════════════════════════════
   WorkflowCanvasInner — ReactFlow must be inside ReactFlowProvider
   ════════════════════════════════════════════════════════════ */

function WorkflowCanvasInner({ store }) {
    const { setViewport, getViewport } = useReactFlow();

    const storeState   = store.getState();
    const workflow     = storeState.workflow;
    const plugins      = storeState.plugins;
    const nodeStatuses = storeState.nodeStatuses;
    const selectedNodeId = storeState.selectedNode?.id ?? storeState.selectedNode;
    const selectedEdge   = storeState.selectedEdge;
    const showMinimap    = storeState.settings.ui.show_minimap;
    const snapToGrid     = storeState.settings.ui.snap_to_grid;
    const gridSize       = storeState.settings.ui.grid_size || 20;

    // Derive RF nodes/edges from store
    const initialNodes = useMemo(
        () => toRFNodes(workflow.nodes, plugins, nodeStatuses, selectedNodeId),
        [] // eslint-disable-line react-hooks/exhaustive-deps
    );
    const initialEdges = useMemo(
        () => toRFEdges(workflow.nodes, selectedEdge),
        [] // eslint-disable-line react-hooks/exhaustive-deps
    );

    const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
    const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Track multi-selection (module-level clipboard is _clipboard above)
    const selectedNodeIdsRef = useRef(new Set());

    /* ── Selection change → update selectedNodeIdsRef ── */
    const handleSelectionChange = useCallback(({ nodes: selNodes }) => {
        selectedNodeIdsRef.current = new Set((selNodes || []).map(n => n.id));
    }, []);

    // Sync store → RF when store changes
    useEffect(() => {
        const unsub = store.subscribe(() => {
            const s = store.getState();
            setRfNodes(toRFNodes(
                s.workflow.nodes,
                s.plugins,
                s.nodeStatuses,
                s.selectedNode?.id ?? s.selectedNode,
            ));
            setRfEdges(toRFEdges(s.workflow.nodes, s.selectedEdge));
        });
        return unsub;
    }, [store, setRfNodes, setRfEdges]);

    /* ── Node position change → store ── */
    const handleNodesChange = useCallback((changes) => {
        onNodesChange(changes);
        for (const ch of changes) {
            if (ch.type === "position" && ch.dragging === false) {
                // Commit final position to store
                const wf     = store.getState().workflow;
                const newNodes = wf.nodes.map(n => {
                    if (n.id !== ch.id) return n;
                    let { x, y } = ch.position ?? n.position;
                    if (snapToGrid) {
                        x = Math.round(x / gridSize) * gridSize;
                        y = Math.round(y / gridSize) * gridSize;
                    }
                    return { ...n, position: { x, y } };
                });
                store.setState({ workflow: { ...wf, nodes: newNodes } });
            }
            if (ch.type === "remove") {
                _removeNodeFromStore(ch.id, store);
            }
        }
    }, [store, onNodesChange, snapToGrid, gridSize]);

    /* ── Edge change → store ── */
    const handleEdgesChange = useCallback((changes) => {
        onEdgesChange(changes);
        for (const ch of changes) {
            if (ch.type === "remove") {
                const [srcId, tgtId] = ch.id.split("__to__");
                if (srcId && tgtId) {
                    const wf = store.getState().workflow;
                    const newNodes = wf.nodes.map(n => {
                        if (n.id !== srcId) return n;
                        return { ...n, edges: n.edges.filter(e => e !== tgtId) };
                    });
                    store.setState({ workflow: { ...wf, nodes: newNodes } });
                }
            }
            if (ch.type === "select") {
                if (ch.selected) {
                    const [src, tgt] = ch.id.split("__to__");
                    store.getState().setSelectedEdge({ source: src, target: tgt });
                } else {
                    store.getState().clearSelection();
                }
            }
        }
    }, [store, onEdgesChange]);

    /* ── New connection ── */
    const handleConnect = useCallback((connection) => {
        setRfEdges(eds => addEdge({
            ...connection,
            type:      "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            style:     { stroke: "var(--edge-default, #5a5a8a)", strokeWidth: 2 },
        }, eds));
        const wf    = store.getState().workflow;
        const srcId = connection.source;
        const tgtId = connection.target;
        const newNodes = wf.nodes.map(n => {
            if (n.id !== srcId) return n;
            if (n.edges.includes(tgtId)) return n;
            return { ...n, edges: [...n.edges, tgtId] };
        });
        store.setState({ workflow: { ...wf, nodes: newNodes } });
    }, [store, setRfEdges]);

    /* ── Node click → select ── */
    const handleNodeClick = useCallback((_ev, rfNode) => {
        const seqNode = store.getState().workflow.nodes.find(n => n.id === rfNode.id);
        if (seqNode) store.getState().setSelectedNode(seqNode);
    }, [store]);

    /* ── Edge click → select ── */
    const handleEdgeClick = useCallback((_ev, rfEdge) => {
        const [src, tgt] = rfEdge.id.split("__to__");
        store.getState().setSelectedEdge({ source: src, target: tgt });
    }, [store]);

    /* ── Background click → deselect ── */
    const handlePaneClick = useCallback(() => {
        store.getState().clearSelection();
    }, [store]);

    /* ── Drop from sidebar ── */
    const handleDrop = useCallback((ev) => {
        ev.preventDefault();
        const toolId       = ev.dataTransfer.getData("tool_id");
        const specialType  = ev.dataTransfer.getData("special_node_type");
        const rfInstance   = ev.currentTarget._rfInstance;

        // Get canvas coordinates via React Flow's screenToFlowPosition
        const canvas = ev.currentTarget;
        const rect   = canvas.getBoundingClientRect();
        // We'll use the viewport to convert
        const vp     = getViewport();
        const x      = (ev.clientX - rect.left - vp.x) / vp.zoom;
        const y      = (ev.clientY - rect.top  - vp.y) / vp.zoom;

        if (toolId) {
            addNodeFromPlugin(toolId, x, y, store, store.getState().plugins);
        } else if (specialType) {
            addSpecialNode(specialType, x, y, store);
        }
    }, [store, getViewport]);

    const handleDragOver = useCallback((ev) => { ev.preventDefault(); }, []);

    /* ── Keyboard ── */
    useEffect(() => {
        const onKey = (ev) => {
            const active = document.activeElement;
            if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;

            // Delete / Backspace — remove ALL selected nodes (or selected edge)
            if (ev.key === "Delete" || ev.key === "Backspace") {
                const selIds = selectedNodeIdsRef.current;
                if (selIds.size > 0) {
                    selIds.forEach(nid => _removeNodeFromStore(nid, store));
                    selectedNodeIdsRef.current = new Set();
                } else {
                    // Fallback: single node selected via store
                    const sel = store.getState().selectedNode;
                    if (sel) {
                        const nid = sel.id ?? sel;
                        _removeNodeFromStore(nid, store);
                    }
                }
                // Delete selected edge
                const edge = store.getState().selectedEdge;
                if (edge) {
                    const wf = store.getState().workflow;
                    const newNodes = wf.nodes.map(n => {
                        if (n.id !== edge.source) return n;
                        return { ...n, edges: n.edges.filter(e => e !== edge.target) };
                    });
                    store.setState({ workflow: { ...wf, nodes: newNodes } });
                    store.getState().clearSelection();
                }
            }

            // Ctrl+A — select all nodes
            if ((ev.ctrlKey || ev.metaKey) && ev.key === "a") {
                ev.preventDefault();
                setRfNodes(nds => {
                    const selected = nds.map(n => ({ ...n, selected: true }));
                    selectedNodeIdsRef.current = new Set(selected.map(n => n.id));
                    return selected;
                });
            }

            // Ctrl+C — copy all selected nodes (deep clone with all properties)
            if ((ev.ctrlKey || ev.metaKey) && ev.key === "c") {
                const selIds = selectedNodeIdsRef.current;
                if (selIds.size === 0) {
                    // Fallback: copy single selected node from store
                    const sel = store.getState().selectedNode;
                    if (sel) {
                        _clipboard = [JSON.parse(JSON.stringify(sel))];
                    }
                } else {
                    const wfNodes = store.getState().workflow.nodes;
                    _clipboard = wfNodes
                        .filter(n => selIds.has(n.id))
                        .map(n => JSON.parse(JSON.stringify(n)));
                }
            }

            // Ctrl+V — paste clipboard nodes onto board
            if ((ev.ctrlKey || ev.metaKey) && ev.key === "v") {
                if (_clipboard.length === 0) return;
                ev.preventDefault();
                const wf = store.getState().workflow;
                const OFFSET = 30;
                // Build ID remap for edges within the copied set
                const idMap = {};
                const newNodes = _clipboard.map(orig => {
                    const newId = "node_" + (++_nodeIdCounter) + "_" + Date.now();
                    idMap[orig.id] = newId;
                    return {
                        ...JSON.parse(JSON.stringify(orig)),
                        id:       newId,
                        position: { x: (orig.position?.x || 0) + OFFSET, y: (orig.position?.y || 0) + OFFSET },
                        edges:    [], // will be remapped below
                    };
                });
                // Remap edges: only keep edges whose target is also in the copied set
                newNodes.forEach((n, i) => {
                    const origEdges = _clipboard[i].edges || [];
                    n.edges = origEdges
                        .filter(eid => idMap[eid] !== undefined)
                        .map(eid => idMap[eid]);
                });
                store.setState({ workflow: { ...wf, nodes: [...wf.nodes, ...newNodes] } });
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [store, setRfNodes]);

    // Apply adaptive zoom on first mount
    useEffect(() => {
        setViewport({ x: 0, y: 0, zoom: getAdaptiveInitialZoom() });
    }, [setViewport]);

    return (
        <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onSelectionChange={handleSelectionChange}
            snapToGrid={snapToGrid}
            snapGrid={[gridSize, gridSize]}
            minZoom={0.15}
            maxZoom={4.0}
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={null} /* handled by our keydown above */
            style={{ width: "100%", height: "100%", background: "var(--canvas-bg)" }}
        >
            <Controls showInteractive={false} />
            {showMinimap && (
                <MiniMap
                    nodeColor={n => {
                        const cs = getComputedStyle(document.body);
                        const status = n.data?.status;
                        return status === "COMPLETED" ? (cs.getPropertyValue("--success").trim() || "#22c55e")
                            : status === "FAILED"    ? (cs.getPropertyValue("--error").trim()   || "#ef4444")
                            : status === "RUNNING"   ? (cs.getPropertyValue("--accent").trim()  || "#7c6ff7")
                            : (cs.getPropertyValue("--node-bg").trim() || "#1e2a3a");
                    }}
                    nodeBorderRadius={4}
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
                />
            )}
            <Background variant="dots" gap={gridSize} color="var(--border, #333)" />
        </ReactFlow>
    );
}

/* ════════════════════════════════════════════════════════════
   WorkflowCanvas — public component (wraps ReactFlowProvider)
   ════════════════════════════════════════════════════════════ */

export function WorkflowCanvas({ store }) {
    return (
        <ReactFlowProvider>
            <WorkflowCanvasInner store={store} />
        </ReactFlowProvider>
    );
}

/* ════════════════════════════════════════════════════════════
   Workflow mutation helpers
   ════════════════════════════════════════════════════════════ */

let _nodeIdCounter = 0;
let _clipboard     = []; // module-level clipboard for copy/paste

export function addNodeFromPlugin(toolId, x, y, store, plugins) {
    const plugin = (plugins || store.getState().plugins).find(p => p.id === toolId);
    if (!plugin) return;
    _nodeIdCounter++;
    const wf     = store.getState().workflow;
    const nodeId = "node_" + _nodeIdCounter + "_" + toolId.replace(/[^a-zA-Z0-9]/g, "_");
    const defaultX = 300 + wf.nodes.length * 40;
    const defaultY = 200 + wf.nodes.length * 40;
    const nd = {
        id:               nodeId,
        tool_id:          toolId,
        label:            plugin.name,
        node_type:        "tool",
        params:           {},
        inputs_map:       {},
        outputs_map:      {},
        edges:            [],
        position:         { x: x ?? defaultX, y: y ?? defaultY },
        enabled:          true,
        notes:            "",
        plugin_paths:     {},
        custom_command:   "",
        runtime_override: {},
    };
    store.setState({ workflow: { ...wf, nodes: [...wf.nodes, nd] } });
    store.getState().setSelectedNode(nd);
}

export function addSpecialNode(nodeType, x, y, store) {
    _nodeIdCounter++;
    const wf     = store.getState().workflow;
    const nodeId = "node_" + _nodeIdCounter + "_" + nodeType;
    const defaultX = 300 + wf.nodes.length * 40;
    const defaultY = 200 + wf.nodes.length * 40;
    const nd = {
        id:               nodeId,
        tool_id:          "__" + nodeType + "__",
        label:            nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        node_type:        nodeType,
        params:           {},
        inputs_map:       {},
        outputs_map:      {},
        edges:            [],
        position:         { x: x ?? defaultX, y: y ?? defaultY },
        enabled:          true,
        notes:            "",
        plugin_paths:     {},
        custom_command:   "",
        runtime_override: {},
    };
    store.setState({ workflow: { ...wf, nodes: [...wf.nodes, nd] } });
    store.getState().setSelectedNode(nd);
}

export function removeNode(nodeId, store) {
    _removeNodeFromStore(nodeId, store);
}

function _removeNodeFromStore(nodeId, store) {
    const wf = store.getState().workflow;
    const newNodes = wf.nodes
        .filter(n => n.id !== nodeId)
        .map(n => ({ ...n, edges: n.edges.filter(e => e !== nodeId) }));
    store.setState({ workflow: { ...wf, nodes: newNodes } });
    if ((store.getState().selectedNode?.id ?? store.getState().selectedNode) === nodeId) {
        store.getState().clearSelection();
    }
}

export default { WorkflowCanvas, addNodeFromPlugin, addSpecialNode, removeNode };
