/**
 * pages/InteractiveDiagram.jsx
 */

import React, { useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const GenomicNode = ({ data }) => {
    // Define a posição dos conectores com base na orientação
    const isVertical = data.orientation === 'vertical';
    const targetPos = isVertical ? Position.Top : Position.Left;
    const sourcePos = isVertical ? Position.Bottom : Position.Right;

    return (
        <div style={{
            background: 'var(--bg-tertiary, #1c1c2a)',
            border: `1px solid ${data.color || 'var(--border, #2a2a3e)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            color: 'var(--text-primary, #eeeef8)',
            minWidth: '180px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontFamily: 'var(--font-ui, sans-serif)',
        }}>
            <Handle type="target" position={targetPos} style={{ background: data.color || '#888', width: '8px', height: '8px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>{data.icon}</span>
                <strong style={{ color: data.color || 'inherit', fontSize: '13px', fontWeight: '700' }}>{data.label}</strong>
            </div>
            {data.desc && <div style={{ fontSize: '11px', color: 'var(--text-secondary, #8888aa)', lineHeight: '1.4' }}>{data.desc}</div>}
            <Handle type="source" position={sourcePos} style={{ background: data.color || '#888', width: '8px', height: '8px' }} />
        </div>
    );
};

const nodeTypes = { genomicNode: GenomicNode };

export default function InteractiveDiagram({ nodes: initialNodes, edges: initialEdges, height = '400px', orientation = 'horizontal' }) {
    const adaptedNodes = useMemo(() => {
        return initialNodes.map(node => ({
            id: node.id,
            type: 'genomicNode',
            position: { x: node.x, y: node.y },
            data: { ...node, orientation },
        }));
    }, [initialNodes, orientation]);

    const adaptedEdges = useMemo(() => {
        return initialEdges.map(edge => ({
            ...edge,
            animated: true,
            style: { stroke: edge.color || 'var(--edge-default, #5a5a8a)', strokeWidth: 2 },
        }));
    }, [initialEdges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(adaptedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(adaptedEdges);

    return (
        <div style={{ 
            width: '100%', 
            height, 
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: '1px solid var(--border, #2a2a3e)', 
            background: 'var(--bg-secondary, #13131e)' 
        }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
                panOnDrag={true}
                panOnScroll={true}
                zoomOnScroll={true}
                nodesDraggable={true}
                attributionPosition="bottom-right"
            >
                <Background variant="dots" gap={20} size={1} color="var(--text-disabled, #4a4a66)" />
                <Controls showInteractive={false} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} />
            </ReactFlow>
        </div>
    );
}