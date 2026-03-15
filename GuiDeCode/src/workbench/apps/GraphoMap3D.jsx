import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import { graphoLoad, graphoSave, graphoDelete } from '@/services/workbenchService';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, List, ListOrdered, AlignLeft, AlignCenter,
  AlignRight, Link2, Image as ImageIcon, Video, Code, Maximize2, Minimize2,
  Download, Upload, Play, Plus, Trash2, Eye, Edit3, Save, X, Search,
  RotateCcw, Move, ZoomIn, ZoomOut, Crosshair, Film, ChevronLeft, ChevronRight,
  Copy, Settings, Lock, Unlock, Layers, Palette, Type, Hash, ArrowRight, Tag, Link as LinkIcon,
  SkipBack, SkipForward, Pause, Square, ChevronsLeft, ChevronsRight
} from 'lucide-react';

const NODE_COLORS = ['#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8', '#cba6f7', '#fab387', '#94e2d5', '#74c7ec', '#ffffff', '#f5c2e7', '#eba0ac', '#b4befe'];
const NODE_SHAPES = ['sphere', 'box', 'cone', 'cylinder', 'torus', 'octahedron', 'dodecahedron', 'icosahedron'];
const LINK_STYLES = ['solid', 'dashed', 'dotted'];
const ARROW_STYLES = ['triangle', 'none'];
const FONT_FAMILIES = ['Arial', 'Verdana', 'Courier New', 'Georgia', 'Times New Roman', 'Trebuchet MS', 'Helvetica', 'Tahoma'];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getLinkId = (l) => {
  const sid = typeof l.source === 'object' ? l.source.id : l.source;
  const tid = typeof l.target === 'object' ? l.target.id : l.target;
  return { sid, tid };
};

const createTextSprite = (text, color = '#ffffff', fontSize = 28, fontFamily = 'Arial', isHovered, isActive) => {
  if (!text) return null;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `bold ${fontSize}px ${fontFamily}`;
  const textWidth = context.measureText(text).width;
  canvas.width = textWidth + 30;
  canvas.height = fontSize + 30;
  context.font = `bold ${fontSize}px ${fontFamily}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  if (isActive || isHovered) {
    context.shadowColor = isActive ? '#d4af37' : '#ffffff';
    context.shadowBlur = 15;
  }
  context.strokeStyle = 'rgba(0,0,0,0.8)';
  context.lineWidth = 3;
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillStyle = color;
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(canvas.width / 4, canvas.height / 4, 1);
  return sprite;
};

const createPlainLabelSprite = (text, bgColor = '#0a0a1a') => {
  if (!text) return null;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const fontSize = 20;
  context.font = `bold ${fontSize}px Arial`;
  const textWidth = context.measureText(text).width;
  const padX = 12;
  const padY = 8;
  canvas.width = textWidth + padX * 2;
  canvas.height = fontSize + padY * 2;
  context.font = `bold ${fontSize}px Arial`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = 'rgba(0,0,0,0.65)';
  const rx = 6;
  const w = canvas.width;
  const h = canvas.height;
  context.beginPath();
  context.moveTo(rx, 0);
  context.lineTo(w - rx, 0);
  context.quadraticCurveTo(w, 0, w, rx);
  context.lineTo(w, h - rx);
  context.quadraticCurveTo(w, h, w - rx, h);
  context.lineTo(rx, h);
  context.quadraticCurveTo(0, h, 0, h - rx);
  context.lineTo(0, rx);
  context.quadraticCurveTo(0, 0, rx, 0);
  context.closePath();
  context.fill();
  context.fillStyle = '#ffffff';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(canvas.width / 4, canvas.height / 4, 1);
  return sprite;
};

const getNodeRadius = (node) => {
  const size = node.val || 8;
  switch (node.shape) {
    case 'box': return size * 0.866;
    case 'cone': return size * 0.75;
    case 'cylinder': return size * 0.75;
    case 'torus': return size / 1.5 + size / 4;
    case 'octahedron': return size / 1.2;
    case 'dodecahedron': return size / 1.2;
    case 'icosahedron': return size / 1.2;
    case 'sphere': default: return size / 1.5;
  }
};

const EditorToolbar = ({ editor, isMaximized, toggleMaximize, htmlMode, setHtmlMode }) => {
  if (!editor && htmlMode === 'rich') return null;
  const btnStyle = (active) => ({
    background: active ? '#d4af37' : 'transparent', color: active ? '#000' : '#cdd6f4',
    border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  });
  const addImage = () => { const url = window.prompt('Image URL:'); if (url) editor.chain().focus().setImage({ src: url }).run(); };
  const addVideo = () => { const url = window.prompt('Youtube URL:'); if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run(); };
  const addLink = () => { const url = window.prompt('Link URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); };

  return (
    <div style={{ display: 'flex', gap: '4px', padding: '8px', background: '#1e1e2e', borderBottom: '1px solid #313244', flexWrap: 'wrap', alignItems: 'center' }}>
      <button style={btnStyle(htmlMode === 'raw')} onClick={() => setHtmlMode(htmlMode === 'raw' ? 'rich' : 'raw')} title="Toggle HTML Code"><Code size={16} /></button>
      <div style={{ width: '1px', background: '#313244', margin: '0 4px', height: '20px' }} />
      {htmlMode === 'rich' && (
        <>
          <button style={btnStyle(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></button>
          <button style={btnStyle(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></button>
          <button style={btnStyle(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></button>
          <button style={btnStyle(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></button>
          <div style={{ width: '1px', background: '#313244', margin: '0 4px', height: '20px' }} />
          <button style={btnStyle(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={16} /></button>
          <button style={btnStyle(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></button>
          <button style={btnStyle(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></button>
          <button style={btnStyle(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></button>
          <div style={{ width: '1px', background: '#313244', margin: '0 4px', height: '20px' }} />
          <button style={btnStyle(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={16} /></button>
          <button style={btnStyle(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={16} /></button>
          <button style={btnStyle(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={16} /></button>
          <div style={{ width: '1px', background: '#313244', margin: '0 4px', height: '20px' }} />
          <button style={btnStyle(editor.isActive('link'))} onClick={addLink}><Link2 size={16} /></button>
          <button style={btnStyle()} onClick={addImage}><ImageIcon size={16} /></button>
          <button style={btnStyle()} onClick={addVideo}><Video size={16} /></button>
        </>
      )}
      <div style={{ flex: 1 }} />
      <button style={btnStyle(false)} onClick={toggleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
        {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
};

const NavigationGizmo = ({ fgRef }) => {
  const mountRef = useRef(null);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const [dragState, setDragState] = useState(null);
  const sphereMatRef = useRef(null);
  const ringMatRef = useRef(null);
  const hoverZoneRef = useRef(null);
  const pressingRef = useRef(false);

  const updateMaterials = (zone, pressing) => {
    if (sphereMatRef.current) {
      if (pressing && zone === 'ORBIT') {
        sphereMatRef.current.color.set(0x5599ff);
        sphereMatRef.current.opacity = 0.55;
      } else if (zone === 'ORBIT') {
        sphereMatRef.current.color.set(0x5588cc);
        sphereMatRef.current.opacity = 0.35;
      } else {
        sphereMatRef.current.color.set(0x555555);
        sphereMatRef.current.opacity = 0.15;
      }
    }
    if (ringMatRef.current) {
      if (pressing && zone === 'ROLL') {
        ringMatRef.current.color.set(0xffe066);
        ringMatRef.current.opacity = 1;
      } else if (zone === 'ROLL') {
        ringMatRef.current.color.set(0xd4af37);
        ringMatRef.current.opacity = 1;
      } else {
        ringMatRef.current.color.set(0x888888);
        ringMatRef.current.opacity = 1;
      }
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = 120;
    const height = 120;
    const scene = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 1000);
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    const gizmoGroup = new THREE.Group();
    scene.add(gizmoGroup);

    const sphereGeo = new THREE.SphereGeometry(35, 8, 8);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true, transparent: true, opacity: 0.15 });
    sphereMatRef.current = sphereMat;
    gizmoGroup.add(new THREE.Mesh(sphereGeo, sphereMat));

    const ringGeo = new THREE.TorusGeometry(48, 1.5, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 1 });
    ringMatRef.current = ringMat;
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    let animationFrameId;
    const animate = () => {
      if (fgRef.current) {
        const mainCam = fgRef.current.camera();
        if (mainCam) {
          gizmoGroup.quaternion.copy(mainCam.quaternion).invert();
        }
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [fgRef]);

  const getZone = (e) => {
    if (!mountRef.current) return null;
    const rect = mountRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    if (dist > 40) return 'ROLL';
    return 'ORBIT';
  };

  const handleMouseDown = (e) => {
    const zone = getZone(e);
    prevMousePos.current = { x: e.clientX, y: e.clientY };
    setDragState(zone);
    pressingRef.current = true;
    updateMaterials(zone, true);
  };

  const handleMouseMove = (e) => {
    if (!dragState) {
      const zone = getZone(e);
      if (zone !== hoverZoneRef.current) {
        hoverZoneRef.current = zone;
        updateMaterials(zone, false);
      }
      return;
    }

    if (!fgRef.current) return;
    const mainCam = fgRef.current.camera();
    const controls = fgRef.current.controls();
    if (!mainCam || !controls) return;

    if (dragState === 'ORBIT') {
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;
      const offset = new THREE.Vector3().subVectors(mainCam.position, controls.target);
      const qYaw = new THREE.Quaternion().setFromAxisAngle(mainCam.up, -deltaX * 0.015);
      const forward = new THREE.Vector3().copy(offset).normalize();
      const right = new THREE.Vector3().crossVectors(mainCam.up, forward).normalize();
      const angleToUp = forward.angleTo(mainCam.up);
      let pitchAngle = -deltaY * 0.015;
      const minAngle = 0.1;
      const maxAngle = Math.PI - 0.1;
      if (angleToUp + pitchAngle < minAngle) pitchAngle = minAngle - angleToUp;
      if (angleToUp + pitchAngle > maxAngle) pitchAngle = maxAngle - angleToUp;
      const qPitch = new THREE.Quaternion().setFromAxisAngle(right, pitchAngle);
      offset.applyQuaternion(qYaw);
      offset.applyQuaternion(qPitch);
      mainCam.position.copy(controls.target).add(offset);
      mainCam.lookAt(controls.target);
    } else if (dragState === 'ROLL') {
      const rect = mountRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const prevAngle = Math.atan2(prevMousePos.current.y - cy, prevMousePos.current.x - cx);
      const currAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
      let deltaAngle = currAngle - prevAngle;
      if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
      const fwd = new THREE.Vector3().subVectors(controls.target, mainCam.position).normalize();
      mainCam.up.applyAxisAngle(fwd, -deltaAngle);
      mainCam.lookAt(controls.target);
    }
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setDragState(null);
    pressingRef.current = false;
    updateMaterials(hoverZoneRef.current, false);
  };

  const handleMouseLeave = () => {
    setDragState(null);
    pressingRef.current = false;
    hoverZoneRef.current = null;
    updateMaterials(null, false);
  };

  const getCursor = () => {
    if (dragState === 'ROLL') return 'alias';
    if (dragState === 'ORBIT') return 'grabbing';
    return 'crosshair';
  };

  return (
    <div
      style={{
        position: 'absolute', top: '45px', right: '20px', width: '120px', height: '120px',
        borderRadius: '50%', cursor: getCursor(), zIndex: 9, background: 'transparent'
      }}
      title="Center = Orbit X/Y  |  Ring = Roll (Z Rotation)"
      ref={mountRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
};

const GraphoMap3D = ({ winId }) => {
  const fgRef = useRef();
  const containerRef = useRef();
  const { addNotification, updateWindowSize, updateWindowPosition, subscriptionType, isAdmin } = useWorkbench();

  const canEdit = isAdmin || subscriptionType === 'complete';
  const canView = canEdit || subscriptionType === 'basic';

  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const isMobile = winWidth < 768;

  const [maps, setMaps] = useState([]);
  const [currentMapId, setCurrentMapId] = useState('');
  const [mapName, setMapName] = useState('New Concept Map');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const [scenes, setScenes] = useState([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState('auto');
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [skipCount, setSkipCount] = useState(1);
  const autoPlayTimerRef = useRef(null);
  const isAutoPausedRef = useRef(false);
  const currentSceneIndexRef = useRef(-1);
  const scenesRef = useRef([]);
  const playModeRef = useRef('auto');

  const [mode, setMode] = useState('view');
  const [activeNode, setActiveNode] = useState(null);
  const [activeLink, setActiveLink] = useState(null);
  const [prevCamPos, setPrevCamPos] = useState(null);
  const [showBgSettings, setShowBgSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showScenePanel, setShowScenePanel] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNodeList, setShowNodeList] = useState(false);
  const [showGraphStats, setShowGraphStats] = useState(false);
  const [showAllLabels, setShowAllLabels] = useState(false);

  const [hoverNode, setHoverNode] = useState(null);
  const [hoverLink, setHoverLink] = useState(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);

  const [bgConfig, setBgConfig] = useState({ type: 'color', value: '#0a0a1a', opacity: 1 });

  const [editFormData, setEditFormData] = useState({});
  const [editFormLink, setEditFormLink] = useState({});
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const [htmlMode, setHtmlMode] = useState('rich');
  const [rawHtmlContent, setRawHtmlContent] = useState('');

  const [graphMeta, setGraphMeta] = useState({ description: '', author: '', tags: '', createdAt: '', version: '1.0' });
  const [linkAnchors, setLinkAnchors] = useState([]);
  const anchorTickRef = useRef(null);

  const linkAnchorsRef = useRef([]);
  const graphDataRef = useRef({ nodes: [], links: [] });
  const skipOrphanCleanupRef = useRef(false);

  useEffect(() => { linkAnchorsRef.current = linkAnchors; }, [linkAnchors]);
  useEffect(() => { graphDataRef.current = graphData; }, [graphData]);
  useEffect(() => { isAutoPausedRef.current = isAutoPaused; }, [isAutoPaused]);
  useEffect(() => { currentSceneIndexRef.current = currentSceneIndex; }, [currentSceneIndex]);
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { playModeRef.current = playMode; }, [playMode]);

  const editor = useEditor({
    extensions: [
      StarterKit, Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image, Link.configure({ openOnClick: false }), Table, TableRow, TableCell, TableHeader,
      Youtube, Color, TextStyle, FontFamily
    ],
    content: '',
    onUpdate: ({ editor }) => { setRawHtmlContent(editor.getHTML()); }
  });

  useEffect(() => {
    if (winId) {
      const w = window.innerWidth * 0.88;
      const h = window.innerHeight * 0.88;
      const x = (window.innerWidth - w) / 2;
      const y = (window.innerHeight - h) / 2;
      updateWindowSize(winId, w, h);
      updateWindowPosition(winId, x, y);
    }
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [winId, updateWindowSize, updateWindowPosition]);

  useEffect(() => {
    const down = (e) => { if (e.key === 'Control') setIsCtrlPressed(true); };
    const up = (e) => { if (e.key === 'Control') setIsCtrlPressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    const handleKeys = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (isPlaying) return;
      if (e.key === 'Delete' && activeNode && mode === 'edit') {
        deleteNode();
      }
      if (e.key === 'Escape') {
        closePanels();
        setShowSearch(false);
        setShowNodeList(false);
        setShowExportMenu(false);
        setShowScenePanel(false);
        setShowBgSettings(false);
        setShowGraphStats(false);
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setShowSearch(s => !s);
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveMap();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [activeNode, mode, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    const handlePresentationKeys = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      const idx = currentSceneIndexRef.current;
      const sc = scenesRef.current;
      const pm = playModeRef.current;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (pm === 'auto') {
            toggleAutoPause();
          } else {
            navigateScene(idx + 1);
          }
          break;
        case 'Backspace':
          e.preventDefault();
          navigateScene(idx - 1);
          break;
        case 'Home':
          e.preventDefault();
          navigateScene(0);
          break;
        case 'End':
          e.preventDefault();
          navigateScene(sc.length - 1);
          break;
        case 'PageUp':
          e.preventDefault();
          navigateScene(idx + skipCount);
          break;
        case 'PageDown':
          e.preventDefault();
          navigateScene(idx - skipCount);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateScene(idx + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateScene(idx - 1);
          break;
        case 'Escape':
          e.preventDefault();
          stopPresentation();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handlePresentationKeys);
    return () => window.removeEventListener('keydown', handlePresentationKeys);
  }, [isPlaying, skipCount]);

  useEffect(() => {
    if (fgRef.current) {
      const fg = fgRef.current;
      if (fg.d3Force('link')) {
        fg.d3Force('link')
          .distance(link => link.distance || 30)
          .strength(link => link.strength || 0.6);
      }
      if (fg.d3Force('charge')) {
        fg.d3Force('charge').strength(-50).distanceMax(400);
      }
      if (fg.d3Force('center')) {
        fg.d3Force('center').strength(0.05);
      }
    }
  }, [graphData]);

  useEffect(() => {
    // const timer = setTimeout(() => {
    //   if (fgRef.current && typeof fgRef.current.refresh === 'function') {
    //     fgRef.current.refresh();
    //   }
    // }, 80);
    // return () => clearTimeout(timer);
    
    setGraphData(prev => ({
      nodes: prev.nodes.map(n => ({ ...n })),
      links: prev.links.map(l => ({
        ...l,
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target
      }))
    }));
  }, [showAllLabels, bgConfig]);

  useEffect(() => {
    if (anchorTickRef.current) cancelAnimationFrame(anchorTickRef.current);

    if (skipOrphanCleanupRef.current) {
      skipOrphanCleanupRef.current = false;
    } else {
      const orphanAnchors = linkAnchors.filter(anchor => {
        const targetLinkExists = graphData.links.some(l => l.id === anchor.targetLinkId);
        const anchorNodeExists = graphData.nodes.some(n => n.id === anchor.anchorNodeId);
        const sourceNodeExists = graphData.nodes.some(n => n.id === anchor.sourceNodeId);
        const connectorLinkExists = graphData.links.some(l => l.id === anchor.connectorLinkId);
        return !targetLinkExists || !anchorNodeExists || !sourceNodeExists || !connectorLinkExists;
      });

      if (orphanAnchors.length > 0) {
        const orphanAnchorNodeIds = new Set(orphanAnchors.map(a => a.anchorNodeId));
        const orphanConnectorIds = new Set(orphanAnchors.map(a => a.connectorLinkId));
        setGraphData(prev => ({
          nodes: prev.nodes.filter(n => !orphanAnchorNodeIds.has(n.id)),
          links: prev.links.filter(l => {
            if (orphanConnectorIds.has(l.id)) return false;
            const { sid, tid } = getLinkId(l);
            if (orphanAnchorNodeIds.has(sid) || orphanAnchorNodeIds.has(tid)) return false;
            return true;
          })
        }));
        setLinkAnchors(prev => prev.filter(a => !orphanAnchorNodeIds.has(a.anchorNodeId)));
      }
    }

    const tickAnchors = () => {
      const currentAnchors = linkAnchorsRef.current;
      const currentData = graphDataRef.current;
      if (currentAnchors.length > 0 && currentData.nodes.length > 0) {
        currentAnchors.forEach(anchor => {
          const targetLink = currentData.links.find(l => l.id === anchor.targetLinkId);
          if (!targetLink) return;
          const srcNode = typeof targetLink.source === 'object' ? targetLink.source : currentData.nodes.find(n => n.id === targetLink.source);
          const tgtNode = typeof targetLink.target === 'object' ? targetLink.target : currentData.nodes.find(n => n.id === targetLink.target);
          if (!srcNode || !tgtNode) return;
          const anchorNode = typeof targetLink.source === 'object'
            ? currentData.nodes.find(n => n.id === anchor.anchorNodeId)
            : currentData.nodes.find(n => n.id === anchor.anchorNodeId);
          if (!anchorNode) return;

          const midX = ((srcNode.x || 0) + (tgtNode.x || 0)) / 2;
          const midY = ((srcNode.y || 0) + (tgtNode.y || 0)) / 2;
          const midZ = ((srcNode.z || 0) + (tgtNode.z || 0)) / 2;

          anchorNode.x = midX;
          anchorNode.y = midY;
          anchorNode.z = midZ;
          anchorNode.fx = midX;
          anchorNode.fy = midY;
          anchorNode.fz = midZ;
        });
      }
      anchorTickRef.current = requestAnimationFrame(tickAnchors);
    };

    anchorTickRef.current = requestAnimationFrame(tickAnchors);

    return () => {
      if (anchorTickRef.current) cancelAnimationFrame(anchorTickRef.current);
    };
  }, [linkAnchors, graphData]);

  const loadMapsList = async () => {
    const res = await graphoLoad();
    if (res.success) setMaps(res.maps || []);
  };

  useEffect(() => { loadMapsList(); }, []);

  const handleLoadMap = async (mapId) => {
    if (!mapId) return;
    const res = await graphoLoad(mapId);
    if (res.success && res.map) {
      setCurrentMapId(res.map.id);
      setMapName(res.map.name);
      const data = res.map.data || { nodes: [], links: [] };
      skipOrphanCleanupRef.current = true;
      setGraphData({ nodes: data.nodes || [], links: data.links || [] });
      if (data.bgConfig) setBgConfig(data.bgConfig);
      if (data.scenes) setScenes(data.scenes);
      if (data.meta) setGraphMeta(prev => ({ ...prev, ...data.meta }));
      if (data.linkAnchors) setLinkAnchors(data.linkAnchors);
      else setLinkAnchors([]);
      addNotification('Map loaded.', 'success');
      closePanels();
      setTimeout(() => {
        if (fgRef.current) fgRef.current.zoomToFit(800, 60);
      }, 500);
    }
  };

  const handleSaveMap = async () => {
    if (!canEdit) {
      addNotification('Complete subscription required to save maps.', 'error');
      return;
    }
    const currentNodes = graphDataRef.current.nodes;
    const currentLinks = graphDataRef.current.links;
    const currentAnchors = linkAnchorsRef.current;

    currentAnchors.forEach(anchor => {
      const targetLink = currentLinks.find(l => l.id === anchor.targetLinkId);
      if (!targetLink) return;
      const srcNode = typeof targetLink.source === 'object' ? targetLink.source : currentNodes.find(n => n.id === targetLink.source);
      const tgtNode = typeof targetLink.target === 'object' ? targetLink.target : currentNodes.find(n => n.id === targetLink.target);
      if (!srcNode || !tgtNode) return;
      const anchorNode = currentNodes.find(n => n.id === anchor.anchorNodeId);
      if (!anchorNode) return;
      const midX = ((srcNode.x || 0) + (tgtNode.x || 0)) / 2;
      const midY = ((srcNode.y || 0) + (tgtNode.y || 0)) / 2;
      const midZ = ((srcNode.z || 0) + (tgtNode.z || 0)) / 2;
      anchorNode.x = midX; anchorNode.y = midY; anchorNode.z = midZ;
      anchorNode.fx = midX; anchorNode.fy = midY; anchorNode.fz = midZ;
    });

    const nodesToSave = currentNodes.map(n => ({
      id: n.id, name: n.name, val: n.val, color: n.color, shape: n.shape,
      htmlContent: n.htmlContent, showLabel: n.showLabel, labelColor: n.labelColor,
      labelFontSize: n.labelFontSize, labelFontFamily: n.labelFontFamily,
      notes: n.notes, tags: n.tags, opacity: n.opacity,
      x: n.x, y: n.y, z: n.z, fx: n.fx, fy: n.fy, fz: n.fz,
      isAnchor: n.isAnchor, anchoredToLink: n.anchoredToLink
    }));
    const linksToSave = currentLinks.map(l => ({
      id: l.id,
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
      weight: l.weight, distance: l.distance, strength: l.strength,
      directional: l.directional, arrowStyle: l.arrowStyle, lineStyle: l.lineStyle,
      color: l.color, label: l.label, labelColor: l.labelColor,
      labelFontSize: l.labelFontSize, labelFontFamily: l.labelFontFamily, curvature: l.curvature,
      opacity: l.opacity, direction: l.direction,
      isConnectorLink: l.isConnectorLink
    }));
    const dataToSave = { nodes: nodesToSave, links: linksToSave, bgConfig, scenes, meta: { ...graphMeta, updatedAt: new Date().toISOString() }, linkAnchors: currentAnchors };
    const res = await graphoSave({ mapId: currentMapId, name: mapName, data: dataToSave });
    if (res.success) {
      setCurrentMapId(res.mapId);
      addNotification('Map saved successfully!', 'success');
      loadMapsList();
    } else {
      addNotification(res.error || 'Error saving map.', 'error');
    }
  };

  const handleDeleteMap = async () => {
    if (!currentMapId) return;
    if (!window.confirm('Delete this map permanently?')) return;
    const res = await graphoDelete(currentMapId);
    if (res.success) {
      setCurrentMapId('');
      setMapName('New Concept Map');
      setGraphData({ nodes: [], links: [] });
      setScenes([]);
      setLinkAnchors([]);
      setGraphMeta({ description: '', author: '', tags: '', createdAt: '', version: '1.0' });
      addNotification('Map deleted.', 'success');
      loadMapsList();
    }
  };

  const handleNewMap = () => {
    setCurrentMapId('');
    setMapName('New Concept Map');
    setGraphData({ nodes: [], links: [] });
    setScenes([]);
    setLinkAnchors([]);
    setGraphMeta({ description: '', author: '', tags: '', createdAt: new Date().toISOString(), version: '1.0' });
    closePanels();
  };

  const getNodeConnections = useCallback((nodeId) => {
    if (!nodeId) return { directLinks: [], connectorLinks: [] };
    const directLinks = graphData.links.filter(l => {
      if (l.isConnectorLink) return false;
      const { sid, tid } = getLinkId(l);
      return sid === nodeId || tid === nodeId;
    });
    const connectorAnchors = linkAnchors.filter(a => a.sourceNodeId === nodeId);
    const connectorLinks = connectorAnchors.map(a => {
      const cl = graphData.links.find(l => l.id === a.connectorLinkId);
      const tl = graphData.links.find(l => l.id === a.targetLinkId);
      return { anchor: a, connectorLink: cl, targetLink: tl };
    }).filter(c => c.connectorLink && c.targetLink);
    return { directLinks, connectorLinks };
  }, [graphData, linkAnchors]);

  const getTargetLinkLabel = useCallback((targetLink) => {
    if (!targetLink) return '?↔?';
    const sn = typeof targetLink.source === 'object' ? targetLink.source.name : (graphData.nodes.find(n => n.id === targetLink.source)?.name || '?');
    const tn = typeof targetLink.target === 'object' ? targetLink.target.name : (graphData.nodes.find(n => n.id === targetLink.target)?.name || '?');
    return `${sn}↔${tn}`;
  }, [graphData.nodes]);

  const handleNodeClick = useCallback((node) => {
    if (node.isAnchor) return;
    if (!activeNode && !activeLink) setPrevCamPos(fgRef.current.cameraPosition());
    setActiveLink(null);
    setSelectedNodes([]);

    const distance = 80;
    const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
    const newPos = { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio };
    if (newPos.x === 0 && newPos.y === 0 && newPos.z === 0) newPos.z = distance;

    fgRef.current.cameraPosition(newPos, node, 1200);

    setTimeout(() => {
      setActiveNode(node);
      if (mode === 'edit' && canEdit) {
        setEditFormData({ ...node });
        const html = node.htmlContent || '';
        setRawHtmlContent(html);
        if (editor) editor.commands.setContent(html);
      }
    }, 1200);
  }, [activeNode, activeLink, mode, editor, canEdit]);

  const handleLinkClick = useCallback((link) => {
    if (mode !== 'edit' || !canEdit) return;
    if (!activeNode && !activeLink) setPrevCamPos(fgRef.current.cameraPosition());
    setActiveNode(null);

    const start = typeof link.source === 'object' ? link.source : { x: 0, y: 0, z: 0 };
    const end = typeof link.target === 'object' ? link.target : { x: 0, y: 0, z: 0 };
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const midZ = (start.z + end.z) / 2;

    fgRef.current.cameraPosition({ x: midX, y: midY, z: midZ + 100 }, { x: midX, y: midY, z: midZ }, 1200);

    const srcNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
    const tgtNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
    let realDistance = 0;
    if (srcNode && tgtNode) {
      const dx = (tgtNode.x || 0) - (srcNode.x || 0);
      const dy = (tgtNode.y || 0) - (srcNode.y || 0);
      const dz = (tgtNode.z || 0) - (srcNode.z || 0);
      realDistance = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
    }

    setTimeout(() => {
      setActiveLink(link);
      setEditFormLink({
        ...link,
        sourceId: typeof link.source === 'object' ? link.source.id : link.source,
        targetId: typeof link.target === 'object' ? link.target.id : link.target,
        opacity: link.opacity !== undefined ? link.opacity : 1,
        direction: link.direction || 'forward',
        distance: realDistance || link.distance || 50,
        weight: link.weight || 2,
        strength: link.strength || 0.6,
        lineStyle: link.lineStyle || 'solid',
        arrowStyle: link.arrowStyle || 'triangle',
        directional: link.directional !== undefined ? link.directional : true,
        color: link.color || 'rgba(255,255,255,0.5)',
        curvature: link.curvature || 0,
        label: link.label || '',
        labelColor: link.labelColor || '#ffffff',
        labelFontSize: link.labelFontSize || 24,
        labelFontFamily: link.labelFontFamily || 'Arial'
      });
    }, 1200);
  }, [activeNode, activeLink, mode, canEdit, graphData.nodes]);

  const closePanels = () => {
    if (prevCamPos && fgRef.current) {
      fgRef.current.cameraPosition(prevCamPos, { x: 0, y: 0, z: 0 }, 1200);
    }
    setActiveNode(null);
    setActiveLink(null);
    setPrevCamPos(null);
    setIsEditorMaximized(false);
    setSelectedNodes([]);
  };

  const centerGraph = () => {
    if (fgRef.current) fgRef.current.zoomToFit(800, 60);
  };

  const handleNodeDragEnd = useCallback((node) => {
    if (isCtrlPressed) {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
      addNotification('Node pinned.', 'info');
    }
  }, [isCtrlPressed, addNotification]);

  const unpinNode = (nodeId) => {
    const targetId = nodeId || activeNode?.id;
    setGraphData(prev => ({
      links: prev.links,
      nodes: prev.nodes.map(n => {
        if (n.id === targetId) {
          const { fx, fy, fz, ...rest } = n;
          return rest;
        }
        return n;
      })
    }));
    if (fgRef.current) fgRef.current.d3ReheatSimulation();
    addNotification('Node unpinned.', 'info');
  };

  const unpinAllNodes = () => {
    setGraphData(prev => ({
      links: prev.links,
      nodes: prev.nodes.map(n => {
        if (n.isAnchor) return n;
        const { fx, fy, fz, ...rest } = n;
        return rest;
      })
    }));
    if (fgRef.current) fgRef.current.d3ReheatSimulation();
    addNotification('All nodes unpinned.', 'info');
  };

  
  const nodeThreeObject = useCallback((node) => {
    let geometry;
    const size = node.val || 8;
    if (node.isAnchor) {
      const anchorGeo = new THREE.SphereGeometry(1.2, 12, 12);
      const anchorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(node.color || '#d4af37'), transparent: true, opacity: 0.35 });
      return new THREE.Mesh(anchorGeo, anchorMat);
    }

    switch (node.shape) {
      case 'box': geometry = new THREE.BoxGeometry(size, size, size); break;
      case 'cone': geometry = new THREE.ConeGeometry(size / 1.5, size * 1.5, 16); break;
      case 'cylinder': geometry = new THREE.CylinderGeometry(size / 1.5, size / 1.5, size * 1.5, 16); break;
      case 'torus': geometry = new THREE.TorusGeometry(size / 1.5, size / 4, 12, 24); break;
      case 'octahedron': geometry = new THREE.OctahedronGeometry(size / 1.2); break;
      case 'dodecahedron': geometry = new THREE.DodecahedronGeometry(size / 1.2); break;
      case 'icosahedron': geometry = new THREE.IcosahedronGeometry(size / 1.2); break;
      case 'sphere': default: geometry = new THREE.SphereGeometry(size / 1.5, 24, 24); break;
    }

    const isHovered = hoverNode === node;
    const isActive = activeNode === node;
    const baseColor = new THREE.Color(node.color || '#89b4fa');
    const nodeOpacity = node.opacity !== undefined ? node.opacity : 1;

    const material = new THREE.MeshPhongMaterial({
      color: baseColor,
      transparent: true,
      opacity: isActive ? Math.min(nodeOpacity, 1) : (isHovered ? Math.min(nodeOpacity, 0.95) : nodeOpacity * 0.85),
      emissive: baseColor,
      emissiveIntensity: isActive ? 0.6 : (isHovered ? 0.35 : 0.05),
      shininess: 80,
      specular: new THREE.Color('#444444')
    });

    const mesh = new THREE.Mesh(geometry, material);

if (node.showLabel !== false && node.name) {
      if (showAllLabels) {
        const labelSprite = createTextSprite(
          node.name,
          node.labelColor || '#ffffff',
          node.labelFontSize || 22,
          node.labelFontFamily || 'Arial',
          isHovered, isActive
        );
        if (labelSprite) {
          labelSprite.position.set(0, -(size / 1.5 + 5), 0);
          mesh.add(labelSprite);
        }
      }
    }

    return mesh;
  }, [hoverNode, activeNode, showAllLabels]);

  const linkThreeObject = useCallback((link) => {
    if (!link.label || link.isConnectorLink) return null;
    const isHovered = hoverLink === link;
    const isActive = activeLink === link;
    const color = link.labelColor || (isActive ? '#d4af37' : (isHovered ? '#ffffff' : '#e2e8f0'));
    const fontSize = link.labelFontSize || 24;
    const fontFamily = link.labelFontFamily || 'Arial';
    return createTextSprite(link.label, color, fontSize, fontFamily, isHovered, isActive);
  }, [hoverLink, activeLink]);

  const linkPositionUpdate = useCallback((sprite, { start, end }) => {
    if (!sprite || !sprite.position) return;
    const middlePos = {
      x: start.x + (end.x - start.x) / 2,
      y: start.y + (end.y - start.y) / 2,
      z: start.z + (end.z - start.z) / 2
    };
    Object.assign(sprite.position, middlePos);
  }, []);

  const handleAddNode = () => {
    if (!canEdit) return;
    const cam = fgRef.current ? fgRef.current.cameraPosition() : { x: 0, y: 0, z: 0 };
    const basePos = activeNode || { x: cam.x * 0.2, y: cam.y * 0.2, z: cam.z * 0.2 };
    const offsetRange = 20;
    const nx = basePos.x + (Math.random() * offsetRange * 2 - offsetRange);
    const ny = basePos.y + (Math.random() * offsetRange * 2 - offsetRange);
    const nz = basePos.z + (Math.random() * offsetRange * 2 - offsetRange);
    const newNode = {
      id: `node-${uid()}`,
      name: `Node ${graphData.nodes.filter(n => !n.isAnchor).length + 1}`,
      val: 8,
      color: NODE_COLORS[graphData.nodes.filter(n => !n.isAnchor).length % NODE_COLORS.length],
      shape: 'sphere',
      htmlContent: '<h2>New Concept</h2><p>Add details here...</p>',
      showLabel: true,
      labelColor: '#ffffff',
      labelFontSize: 22,
      labelFontFamily: 'Arial',
      notes: '',
      tags: '',
      opacity: 1,
      x: nx, y: ny, z: nz
    };
    setGraphData(prev => ({ nodes: [...prev.nodes, newNode], links: [...prev.links] }));
    addNotification('New node created.', 'success');
  };

  const saveNodeEdits = () => {
    const finalHtml = htmlMode === 'raw' ? rawHtmlContent : (editor ? editor.getHTML() : '');
    setGraphData(prev => ({
      links: prev.links,
      nodes: prev.nodes.map(n => n.id === activeNode.id ? { ...n, ...editFormData, htmlContent: finalHtml } : n)
    }));
    addNotification('Node updated.', 'success');
    closePanels();
  };

  const deleteNode = () => {
    if (!activeNode) return;
    if (!window.confirm(`Delete "${activeNode.name}" and all its connections?`)) return;

    const nodeId = activeNode.id;

    const anchorsBySourceNode = linkAnchors.filter(a => a.sourceNodeId === nodeId);
    const anchorsByConnectorEndpoint = linkAnchors.filter(a => {
      const cl = graphData.links.find(l => l.id === a.connectorLinkId);
      if (!cl) return false;
      const { sid, tid } = getLinkId(cl);
      return sid === nodeId || tid === nodeId;
    });

    const allAnchorRecords = [...new Map([...anchorsBySourceNode, ...anchorsByConnectorEndpoint].map(a => [a.anchorNodeId, a])).values()];
    const anchorNodeIdsToRemove = new Set(allAnchorRecords.map(a => a.anchorNodeId));
    const connectorLinkIdsToRemove = new Set(allAnchorRecords.map(a => a.connectorLinkId));

    skipOrphanCleanupRef.current = true;
    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId && !anchorNodeIdsToRemove.has(n.id)),
      links: prev.links.filter(l => {
        const { sid, tid } = getLinkId(l);
        if (sid === nodeId || tid === nodeId) return false;
        if (connectorLinkIdsToRemove.has(l.id)) return false;
        if (anchorNodeIdsToRemove.has(sid) || anchorNodeIdsToRemove.has(tid)) return false;
        return true;
      })
    }));
    setLinkAnchors(prev => prev.filter(a => !anchorNodeIdsToRemove.has(a.anchorNodeId)));
    closePanels();
  };

  const duplicateNode = () => {
    if (!activeNode) return;
    const { fx, fy, fz, ...rest } = activeNode;
    const newNode = {
      ...rest,
      id: `node-${uid()}`,
      name: `${activeNode.name} (copy)`,
      x: (activeNode.x || 0) + 15,
      y: (activeNode.y || 0) + 15,
      z: (activeNode.z || 0) + 15
    };
    setGraphData(prev => ({ nodes: [...prev.nodes, newNode], links: [...prev.links] }));
    addNotification('Node duplicated.', 'success');
  };

  const createAnchorOnLink = (targetLinkId) => {
    const targetLink = graphData.links.find(l => l.id === targetLinkId);
    if (!targetLink) return null;

    const srcNode = typeof targetLink.source === 'object' ? targetLink.source : graphData.nodes.find(n => n.id === targetLink.source);
    const tgtNode = typeof targetLink.target === 'object' ? targetLink.target : graphData.nodes.find(n => n.id === targetLink.target);
    if (!srcNode || !tgtNode) return null;

    const midX = ((srcNode.x || 0) + (tgtNode.x || 0)) / 2;
    const midY = ((srcNode.y || 0) + (tgtNode.y || 0)) / 2;
    const midZ = ((srcNode.z || 0) + (tgtNode.z || 0)) / 2;

    const anchorId = `anchor-${uid()}`;

    const anchorNode = {
      id: anchorId,
      name: '',
      val: 1.5,
      color: '#d4af37',
      shape: 'sphere',
      htmlContent: '',
      showLabel: false,
      labelColor: '#ffffff',
      labelFontSize: 16,
      labelFontFamily: 'Arial',
      notes: '',
      tags: '',
      opacity: 0.35,
      isAnchor: true,
      anchoredToLink: targetLinkId,
      x: midX, y: midY, z: midZ,
      fx: midX, fy: midY, fz: midZ
    };

    return { anchorNode, anchorId, midX, midY, midZ };
  };

  const handleAddLinkToLink = (targetLinkId) => {
    if (!canEdit || !activeNode || !targetLinkId) return;

    const existing = linkAnchors.find(a => a.sourceNodeId === activeNode.id && a.targetLinkId === targetLinkId);
    if (existing) { addNotification('This connection already exists.', 'error'); return; }

    const result = createAnchorOnLink(targetLinkId);
    if (!result) { addNotification('Edge not found.', 'error'); return; }

    const { anchorNode, anchorId } = result;

    const connectorLink = {
      id: `link-${uid()}`,
      source: activeNode.id,
      target: anchorId,
      weight: 2,
      distance: 30,
      strength: 0.8,
      directional: true,
      arrowStyle: 'triangle',
      lineStyle: 'solid',
      color: 'rgba(212,175,55,0.7)',
      label: '',
      labelColor: '#ffffff',
      labelFontSize: 24,
      labelFontFamily: 'Arial',
      curvature: 0,
      opacity: 1,
      direction: 'forward',
      isConnectorLink: true
    };

    const newAnchor = {
      targetLinkId: targetLinkId,
      anchorNodeId: anchorId,
      connectorLinkId: connectorLink.id,
      sourceNodeId: activeNode.id
    };

    skipOrphanCleanupRef.current = true;
    setGraphData(prev => ({
      nodes: [...prev.nodes, anchorNode],
      links: [...prev.links, connectorLink]
    }));

    setLinkAnchors(prev => [...prev, newAnchor]);
    addNotification('Node connected to edge midpoint.', 'success');
  };

  const handleAddLinkToLinkFromLink = (sourceLinkId, targetLinkId) => {
    if (!canEdit || !sourceLinkId || !targetLinkId || sourceLinkId === targetLinkId) return;

    const existing = linkAnchors.find(a => a.sourceIsLink === sourceLinkId && a.targetLinkId === targetLinkId);
    if (existing) { addNotification('This edge↔edge connection already exists.', 'error'); return; }

    const resultSource = createAnchorOnLink(sourceLinkId);
    const resultTarget = createAnchorOnLink(targetLinkId);
    if (!resultSource || !resultTarget) { addNotification('Edge not found.', 'error'); return; }

    const bridgeLink = {
      id: `link-${uid()}`,
      source: resultSource.anchorId,
      target: resultTarget.anchorId,
      weight: 2,
      distance: 30,
      strength: 0.8,
      directional: true,
      arrowStyle: 'triangle',
      lineStyle: 'dashed',
      color: 'rgba(203,166,247,0.7)',
      label: '',
      labelColor: '#ffffff',
      labelFontSize: 24,
      labelFontFamily: 'Arial',
      curvature: 0,
      opacity: 1,
      direction: 'forward',
      isConnectorLink: true
    };

    const anchorRecordSource = {
      targetLinkId: sourceLinkId,
      anchorNodeId: resultSource.anchorId,
      connectorLinkId: bridgeLink.id,
      sourceNodeId: resultSource.anchorId,
      sourceIsLink: sourceLinkId,
      isBridge: true
    };

    const anchorRecordTarget = {
      targetLinkId: targetLinkId,
      anchorNodeId: resultTarget.anchorId,
      connectorLinkId: bridgeLink.id,
      sourceNodeId: resultTarget.anchorId,
      sourceIsLink: targetLinkId,
      isBridge: true
    };

    skipOrphanCleanupRef.current = true;
    setGraphData(prev => ({
      nodes: [...prev.nodes, resultSource.anchorNode, resultTarget.anchorNode],
      links: [...prev.links, bridgeLink]
    }));

    setLinkAnchors(prev => [...prev, anchorRecordSource, anchorRecordTarget]);
    addNotification('Edges connected to each other.', 'success');
  };

  const handleAddLink = (targetId) => {
    if (!canEdit || !targetId || targetId === activeNode.id) return;
    const exists = graphData.links.find(l => {
      const { sid, tid } = getLinkId(l);
      return (sid === activeNode.id && tid === targetId) || (sid === targetId && tid === activeNode.id);
    });
    if (exists) { addNotification('Link already exists.', 'error'); return; }
    const newLink = {
      id: `link-${uid()}`,
      source: activeNode.id,
      target: targetId,
      weight: 2,
      distance: 50,
      strength: 0.6,
      directional: true,
      arrowStyle: 'triangle',
      lineStyle: 'solid',
      color: 'rgba(255,255,255,0.5)',
      label: '',
      labelColor: '#ffffff',
      labelFontSize: 24,
      labelFontFamily: 'Arial',
      curvature: 0,
      opacity: 1,
      direction: 'forward'
    };
    setGraphData(prev => ({ nodes: prev.nodes, links: [...prev.links, newLink] }));
    addNotification('Link created.', 'success');
  };

  const saveLinkEdits = () => {
    const isConnector = activeLink.isConnectorLink;

    setGraphData(prev => ({
      nodes: prev.nodes,
      links: prev.links.map(l => {
        if (l.id !== activeLink.id) return l;

        let finalSource = editFormLink.sourceId;
        let finalTarget = editFormLink.targetId;
        if (!isConnector && editFormLink.direction === 'reverse') {
          finalSource = editFormLink.targetId;
          finalTarget = editFormLink.sourceId;
        }

        return {
          ...l,
          source: finalSource,
          target: finalTarget,
          weight: editFormLink.weight,
          distance: isConnector ? (editFormLink.distance || 30) : (editFormLink.distance || 50),
          strength: editFormLink.strength,
          directional: editFormLink.directional,
          arrowStyle: editFormLink.arrowStyle,
          lineStyle: editFormLink.lineStyle,
          color: editFormLink.color,
          label: editFormLink.label,
          labelColor: editFormLink.labelColor,
          labelFontSize: editFormLink.labelFontSize,
          labelFontFamily: editFormLink.labelFontFamily,
          curvature: editFormLink.curvature,
          opacity: editFormLink.opacity !== undefined ? editFormLink.opacity : 1,
          direction: isConnector ? 'forward' : (editFormLink.direction || 'forward')
        };
      })
    }));
    if (fgRef.current) {
      fgRef.current.d3Force('link')
        .distance(link => link.distance || 50)
        .strength(link => link.strength || 0.6);
      fgRef.current.d3ReheatSimulation();
    }
    addNotification('Edge updated.', 'success');
    closePanels();
  };

  const deleteLink = () => {
    if (!activeLink) return;
    const linkId = activeLink.id;

    const anchorsWhereThisIsConnector = linkAnchors.filter(a => a.connectorLinkId === linkId);
    const anchorsWhereThisIsTarget = linkAnchors.filter(a => a.targetLinkId === linkId);

    const allAnchorRecordsToRemove = [...anchorsWhereThisIsConnector, ...anchorsWhereThisIsTarget];
    const anchorNodeIdsToRemove = new Set(allAnchorRecordsToRemove.map(a => a.anchorNodeId));
    const connectorLinkIdsToRemove = new Set(allAnchorRecordsToRemove.map(a => a.connectorLinkId));
    const anchorRecordKeys = new Set(allAnchorRecordsToRemove.map(a => a.anchorNodeId));

    skipOrphanCleanupRef.current = true;
    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => !anchorNodeIdsToRemove.has(n.id)),
      links: prev.links.filter(l => {
        if (l.id === linkId) return false;
        if (connectorLinkIdsToRemove.has(l.id)) return false;
        const { sid, tid } = getLinkId(l);
        if (anchorNodeIdsToRemove.has(sid) || anchorNodeIdsToRemove.has(tid)) return false;
        return true;
      })
    }));
    setLinkAnchors(prev => prev.filter(a => !anchorRecordKeys.has(a.anchorNodeId)));
    closePanels();
  };

  const deleteConnectorLink = (connectorLinkId) => {
    const anchor = linkAnchors.find(a => a.connectorLinkId === connectorLinkId);
    if (!anchor) return;

    skipOrphanCleanupRef.current = true;
    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== anchor.anchorNodeId),
      links: prev.links.filter(l => {
        if (l.id === connectorLinkId) return false;
        const { sid, tid } = getLinkId(l);
        if (sid === anchor.anchorNodeId || tid === anchor.anchorNodeId) return false;
        return true;
      })
    }));
    setLinkAnchors(prev => prev.filter(a => a.connectorLinkId !== connectorLinkId));
  };

  const removeNodeConnection = (linkId) => {
    const link = graphData.links.find(l => l.id === linkId);
    if (!link) return;

    if (link.isConnectorLink) {
      deleteConnectorLink(linkId);
      addNotification('Edge connection removed.', 'success');
    } else {
      skipOrphanCleanupRef.current = true;
      const anchorsOnThisLink = linkAnchors.filter(a => a.targetLinkId === linkId);
      const anchorNodeIds = new Set(anchorsOnThisLink.map(a => a.anchorNodeId));
      const connectorIds = new Set(anchorsOnThisLink.map(a => a.connectorLinkId));

      setGraphData(prev => ({
        nodes: prev.nodes.filter(n => !anchorNodeIds.has(n.id)),
        links: prev.links.filter(l => {
          if (l.id === linkId) return false;
          if (connectorIds.has(l.id)) return false;
          const { sid, tid } = getLinkId(l);
          if (anchorNodeIds.has(sid) || anchorNodeIds.has(tid)) return false;
          return true;
        })
      }));
      setLinkAnchors(prev => prev.filter(a => !anchorNodeIds.has(a.anchorNodeId)));
      addNotification('Link removed.', 'success');
    }
  };

  const goToScene = (scene) => {
    if (!fgRef.current || !scene) return;
    const lookAt = scene.lookAt || { x: 0, y: 0, z: 0 };
    fgRef.current.cameraPosition(scene.cameraPosition, lookAt, scene.duration || 3000);
  };

const captureScene = () => {
    if (!fgRef.current) return;
    const camPos = fgRef.current.cameraPosition();
    const controls = fgRef.current.controls();
    const lookAtTarget = controls && controls.target
      ? { x: controls.target.x, y: controls.target.y, z: controls.target.z }
      : { x: 0, y: 0, z: 0 };
    const scene = {
      id: `scene-${uid()}`,
      name: `Scene ${scenes.length + 1}`,
      cameraPosition: { x: camPos.x, y: camPos.y, z: camPos.z },
      lookAt: lookAtTarget,
      duration: 3000,
      notes: ''
    };
    setScenes(prev => [...prev, scene]);
    addNotification('Scene captured.', 'success');
  };

  const navigateScene = useCallback((targetIdx) => {
    const sc = scenesRef.current;
    if (sc.length === 0) return;
    const clamped = Math.max(0, Math.min(targetIdx, sc.length - 1));
    setCurrentSceneIndex(clamped);
    currentSceneIndexRef.current = clamped;
    goToScene(sc[clamped]);

    if (playModeRef.current === 'auto' && !isAutoPausedRef.current) {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      scheduleAutoAdvance(clamped);
    }
  }, []);

  const scheduleAutoAdvance = useCallback((fromIdx) => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    const sc = scenesRef.current;
    if (fromIdx >= sc.length - 1) {
      autoPlayTimerRef.current = setTimeout(() => {
        stopPresentation();
      }, (sc[fromIdx]?.duration || 3000) + 500);
      return;
    }
    const dur = sc[fromIdx]?.duration || 3000;
    autoPlayTimerRef.current = setTimeout(() => {
      if (isAutoPausedRef.current) return;
      const nextIdx = fromIdx + 1;
      if (nextIdx >= sc.length) {
        stopPresentation();
        return;
      }
      setCurrentSceneIndex(nextIdx);
      currentSceneIndexRef.current = nextIdx;
      goToScene(sc[nextIdx]);
      scheduleAutoAdvance(nextIdx);
    }, dur + 500);
  }, []);

  const playPresentation = () => {
    if (scenes.length === 0) { addNotification('No scenes created.', 'error'); return; }
    setIsPlaying(true);
    setIsAutoPaused(false);
    isAutoPausedRef.current = false;
    setCurrentSceneIndex(0);
    currentSceneIndexRef.current = 0;
    goToScene(scenes[0]);
    if (playMode === 'auto') {
      scheduleAutoAdvance(0);
    }
  };

  const toggleAutoPause = () => {
    if (isAutoPausedRef.current) {
      setIsAutoPaused(false);
      isAutoPausedRef.current = false;
      scheduleAutoAdvance(currentSceneIndexRef.current);
    } else {
      setIsAutoPaused(true);
      isAutoPausedRef.current = true;
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    }
  };

  const stopPresentation = () => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    setIsPlaying(false);
    setIsAutoPaused(false);
    isAutoPausedRef.current = false;
    setCurrentSceneIndex(-1);
    currentSceneIndexRef.current = -1;
  };

  const deleteScene = (sceneId) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId));
  };

  const moveScene = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= scenes.length) return;
    setScenes(prev => {
      const arr = [...prev];
      const temp = arr[idx];
      arr[idx] = arr[newIdx];
      arr[newIdx] = temp;
      return arr;
    });
  };

  const exportGraph = (format) => {
    const data = {
      meta: { ...graphMeta, name: mapName, exportedAt: new Date().toISOString(), format },
      nodes: graphData.nodes.map(n => ({
        id: n.id, name: n.name, val: n.val, color: n.color, shape: n.shape,
        htmlContent: n.htmlContent, showLabel: n.showLabel, labelColor: n.labelColor,
        labelFontSize: n.labelFontSize, labelFontFamily: n.labelFontFamily,
        notes: n.notes, tags: n.tags, opacity: n.opacity,
        x: n.x, y: n.y, z: n.z, fx: n.fx, fy: n.fy, fz: n.fz,
        isAnchor: n.isAnchor, anchoredToLink: n.anchoredToLink
      })),
      links: graphData.links.map(l => ({
        id: l.id,
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        weight: l.weight, distance: l.distance, strength: l.strength,
        directional: l.directional, arrowStyle: l.arrowStyle, lineStyle: l.lineStyle,
        color: l.color, label: l.label, labelColor: l.labelColor,
        labelFontSize: l.labelFontSize, labelFontFamily: l.labelFontFamily, curvature: l.curvature,
        opacity: l.opacity, direction: l.direction,
        isConnectorLink: l.isConnectorLink
      })),
      scenes,
      bgConfig,
      linkAnchors
    };

    let content, filename, mimeType;
    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      filename = `${mapName.replace(/\s+/g, '_')}.grapho.json`;
      mimeType = 'application/json';
    } else if (format === 'xml') {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<grapho>\n';
      xml += `  <meta><name>${mapName}</name><exportedAt>${data.meta.exportedAt}</exportedAt></meta>\n`;
      xml += '  <nodes>\n';
      data.nodes.forEach(n => {
        xml += `    <node id="${n.id}" name="${n.name}" color="${n.color}" shape="${n.shape}" val="${n.val}" x="${n.x}" y="${n.y}" z="${n.z}">\n`;
        xml += `      <htmlContent><![CDATA[${n.htmlContent || ''}]]></htmlContent>\n`;
        xml += `      <notes><![CDATA[${n.notes || ''}]]></notes>\n`;
        xml += `      <tags>${n.tags || ''}</tags>\n`;
        xml += `    </node>\n`;
      });
      xml += '  </nodes>\n  <links>\n';
      data.links.forEach(l => {
        xml += `    <link id="${l.id}" source="${l.source}" target="${l.target}" weight="${l.weight}" distance="${l.distance}" label="${l.label || ''}" lineStyle="${l.lineStyle}" arrowStyle="${l.arrowStyle}" directional="${l.directional}" />\n`;
      });
      xml += '  </links>\n  <scenes>\n';
      data.scenes.forEach(s => {
        xml += `    <scene id="${s.id}" name="${s.name}" duration="${s.duration}" cx="${s.cameraPosition.x}" cy="${s.cameraPosition.y}" cz="${s.cameraPosition.z}" />\n`;
      });
      xml += '  </scenes>\n</grapho>';
      content = xml;
      filename = `${mapName.replace(/\s+/g, '_')}.grapho.xml`;
      mimeType = 'application/xml';
    } else if (format === 'csv') {
      let csv = 'type,id,name,color,shape,val,x,y,z,source,target,weight,distance,label,htmlContent,notes,tags\n';
      data.nodes.forEach(n => {
        csv += `node,"${n.id}","${(n.name || '').replace(/"/g, '""')}","${n.color}","${n.shape}",${n.val},${n.x || 0},${n.y || 0},${n.z || 0},,,,,"${(n.htmlContent || '').replace(/"/g, '""')}","${(n.notes || '').replace(/"/g, '""')}","${(n.tags || '').replace(/"/g, '""')}"\n`;
      });
      data.links.forEach(l => {
        csv += `link,"${l.id}",,,,,,,,"${l.source}","${l.target}",${l.weight},${l.distance},"${(l.label || '').replace(/"/g, '""')}",,,\n`;
      });
      content = csv;
      filename = `${mapName.replace(/\s+/g, '_')}.csv`;
      mimeType = 'text/csv';
    } else {
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    addNotification(`Exported as ${format.toUpperCase()}`, 'success');
  };

  const importGraph = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.grapho.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.nodes && data.links) {
            skipOrphanCleanupRef.current = true;
            setGraphData({ nodes: data.nodes, links: data.links });
            if (data.scenes) setScenes(data.scenes);
            if (data.bgConfig) setBgConfig(data.bgConfig);
            if (data.linkAnchors) setLinkAnchors(data.linkAnchors);
            else setLinkAnchors([]);
            if (data.meta) {
              setGraphMeta(prev => ({ ...prev, ...data.meta }));
              if (data.meta.name) setMapName(data.meta.name);
            }
            addNotification('Graph imported successfully!', 'success');
            setTimeout(() => { if (fgRef.current) fgRef.current.zoomToFit(800, 60); }, 500);
          } else {
            addNotification('Invalid file format.', 'error');
          }
        } catch (err) {
          addNotification('Error reading file: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const userVisibleLinks = useMemo(() => {
    return graphData.links.filter(l => !l.isConnectorLink);
  }, [graphData.links]);

  const searchNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return graphData.nodes.filter(n =>
      !n.isAnchor &&
      ((n.name || '').toLowerCase().includes(q) ||
      (n.tags || '').toLowerCase().includes(q) ||
      (n.notes || '').toLowerCase().includes(q))
    );
  }, [searchQuery, graphData.nodes]);

  const focusOnNode = (node) => {
    if (!fgRef.current) return;
    const distance = 60;
    const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
    const newPos = { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio };
    if (newPos.x === 0 && newPos.y === 0 && newPos.z === 0) newPos.z = distance;
    fgRef.current.cameraPosition(newPos, node, 1000);
  };

  const graphStats = useMemo(() => {
    const nodeCount = graphData.nodes.filter(n => !n.isAnchor).length;
    const linkCount = graphData.links.filter(l => !l.isConnectorLink).length;
    const pinnedCount = graphData.nodes.filter(n => n.fx !== undefined && !n.isAnchor).length;
    const isolatedCount = graphData.nodes.filter(n => {
      if (n.isAnchor) return false;
      return !graphData.links.some(l => {
        const { sid, tid } = getLinkId(l);
        return sid === n.id || tid === n.id;
      });
    }).length;
    return { nodeCount, linkCount, pinnedCount, isolatedCount, sceneCount: scenes.length };
  }, [graphData, scenes]);

  const computeLinkColor = useCallback((link) => {
    if (link.isConnectorLink) {
      if (link === activeLink) return '#d4af37';
      const baseColor = link.color || 'rgba(212,175,55,0.7)';
      const linkOpacity = link.opacity !== undefined ? link.opacity : 1;
      if (baseColor.startsWith('rgba')) {
        const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) return `rgba(${match[1]},${match[2]},${match[3]},${linkOpacity})`;
      }
      return baseColor;
    }
    if (link === activeLink) return '#d4af37';
    if (link === hoverLink) return '#ffffff';
    const baseColor = link.color || 'rgba(255,255,255,0.5)';
    const linkOpacity = link.opacity !== undefined ? link.opacity : 1;
    if (linkOpacity >= 1) return baseColor;
    if (baseColor.startsWith('rgba')) {
      const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) return `rgba(${match[1]},${match[2]},${match[3]},${linkOpacity})`;
    }
    if (baseColor.startsWith('#')) {
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${linkOpacity})`;
    }
    return baseColor;
  }, [activeLink, hoverLink]);

  const computeArrowLength = useCallback((link) => {
    if (link.directional === false || link.arrowStyle === 'none') return 0;
    return 5;
  }, []);

  const computeArrowRelPos = useCallback((link) => {
    if (link.directional === false || link.arrowStyle === 'none') return 1;
    const targetNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
    if (!targetNode) return 1;
    const sourceNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
    if (!sourceNode) return 1;
    const dx = (targetNode.x || 0) - (sourceNode.x || 0);
    const dy = (targetNode.y || 0) - (sourceNode.y || 0);
    const dz = (targetNode.z || 0) - (sourceNode.z || 0);
    const totalDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (totalDist < 0.01) return 1;
    const targetRadius = targetNode.isAnchor ? 1.2 : getNodeRadius(targetNode);
    const offset = targetRadius + 1;
    const relPos = 1 - (offset / totalDist);
    return Math.max(0.1, Math.min(relPos, 1));
  }, [graphData.nodes]);

  const renderBackground = () => {
    if (bgConfig.type === 'color') return <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: bgConfig.value, opacity: bgConfig.opacity }} />;
    if (bgConfig.type === 'image') return <img src={bgConfig.value} alt="" style={{ position: 'absolute', inset: 0, zIndex: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: bgConfig.opacity }} />;
    if (bgConfig.type === 'video') return <video src={bgConfig.value} autoPlay loop muted style={{ position: 'absolute', inset: 0, zIndex: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: bgConfig.opacity }} />;
    return null;
  };

  const S = {
    wrapper: { display: 'flex', flexDirection: 'column', height: '100%', background: '#000', color: '#cdd6f4', fontFamily: "'Segoe UI', sans-serif", position: 'relative' },
    toolbar: { padding: '8px 10px', background: '#11111b', borderBottom: '1px solid #313244', display: 'flex', gap: '6px', alignItems: 'center', zIndex: 10, flexWrap: 'wrap', fontSize: '12px' },
    input: { background: '#181825', border: '1px solid #313244', color: '#fff', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' },
    btn: (primary, disabled) => ({
      background: disabled ? '#45475a' : (primary ? '#d4af37' : '#313244'),
      color: disabled ? '#6c7086' : (primary ? '#000' : '#cdd6f4'),
      border: 'none', padding: '5px 12px', borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '11px',
      display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
    }),
    iconBtn: (active) => ({
      background: active ? '#d4af37' : 'transparent', color: active ? '#000' : '#a6adc8',
      border: '1px solid #313244', padding: '5px', borderRadius: '4px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }),
    canvasArea: { flex: 1, position: 'relative', overflow: 'hidden' },
    overlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
    panel: {
      width: '92%', maxWidth: '1100px', height: '88%', minHeight: '400px', minWidth: '300px',
      background: 'rgba(24, 24, 37, 0.97)', border: '1px solid rgba(212,175,55,0.3)',
      borderRadius: '8px', display: 'flex', flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)', resize: 'both', overflow: 'hidden'
    },
    panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #313244', background: '#11111b', flexShrink: 0 },
    panelBody: { flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    splitLayout: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', gap: '16px', overflow: 'hidden' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
    formLabel: { display: 'block', fontSize: '11px', color: '#a6adc8', marginBottom: '3px' },
    scaleHUD: {
      position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.85)',
      border: '1px solid #313244', padding: '8px 12px', borderRadius: '6px', fontSize: '10px',
      color: '#a6adc8', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)', maxWidth: '220px'
    },
    floatingPanel: (top, right, width) => ({
      position: 'absolute', top: top || '50px', right: right || '10px',
      background: '#181825', border: '1px solid #313244', padding: '12px',
      borderRadius: '8px', zIndex: 20, width: width || '260px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.5)', maxHeight: '80vh', overflowY: 'auto'
    }),
    badge: (color) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '10px',
      fontWeight: 'bold', background: color || '#313244', color: '#fff', marginRight: '4px'
    })
  };

  const sep = <div style={{ width: '1px', height: '22px', background: '#313244', margin: '0 2px', flexShrink: 0 }} />;

  const navBtnStyle = (disabled) => ({
    background: disabled ? '#1e1e2e' : '#313244',
    color: disabled ? '#45475a' : '#cdd6f4',
    border: '1px solid #45475a',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    gap: '3px',
    fontWeight: 'bold'
  });

  const renderLinkEditFields = () => (
    <>
      <div style={S.formGrid}>
        <div>
          <label style={S.formLabel}>Thickness: {editFormLink.weight || 2}</label>
          <input type="range" min="0.5" max="10" step="0.5" style={{ width: '100%' }} value={editFormLink.weight || 2} onChange={e => setEditFormLink({ ...editFormLink, weight: parseFloat(e.target.value) })} />
        </div>
        <div>
          <label style={S.formLabel}>Line Color</label>
          <input type="color" style={{ ...S.input, width: '100%', padding: '0 4px' }} value={editFormLink.color || '#ffffff'} onChange={e => setEditFormLink({ ...editFormLink, color: e.target.value })} />
        </div>
        <div>
          <label style={S.formLabel}>Line Opacity: {editFormLink.opacity !== undefined ? editFormLink.opacity : 1}</label>
          <input type="range" min="0.05" max="1" step="0.05" style={{ width: '100%' }} value={editFormLink.opacity !== undefined ? editFormLink.opacity : 1} onChange={e => setEditFormLink({ ...editFormLink, opacity: parseFloat(e.target.value) })} />
        </div>
        <div>
          <label style={S.formLabel}>Line Style</label>
          <select style={{ ...S.input, width: '100%' }} value={editFormLink.lineStyle || 'solid'} onChange={e => setEditFormLink({ ...editFormLink, lineStyle: e.target.value })}>
            {LINK_STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={S.formLabel}>Arrow</label>
          <select style={{ ...S.input, width: '100%' }} value={editFormLink.arrowStyle || 'triangle'} onChange={e => setEditFormLink({ ...editFormLink, arrowStyle: e.target.value })}>
            {ARROW_STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={S.formLabel}>Curvature: {editFormLink.curvature || 0}</label>
          <input type="range" min="0" max="1" step="0.05" style={{ width: '100%' }} value={editFormLink.curvature || 0} onChange={e => setEditFormLink({ ...editFormLink, curvature: parseFloat(e.target.value) })} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
          <input type="checkbox" id="directional" checked={editFormLink.directional ?? true} onChange={e => setEditFormLink({ ...editFormLink, directional: e.target.checked })} />
          <label htmlFor="directional" style={{ color: '#cdd6f4', fontSize: '12px' }}>Directional</label>
        </div>
      </div>
    </>
  );

  return (
    <div style={S.wrapper} ref={containerRef}>
      <div style={S.toolbar}>
        <select style={{ ...S.input, maxWidth: '160px' }} value={currentMapId} onChange={(e) => handleLoadMap(e.target.value)}>
          <option value="">-- Maps --</option>
          {maps.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button style={S.btn(false)} onClick={handleNewMap} title="New Map"><Plus size={14} /></button>
        {currentMapId && <button style={S.btn(false)} onClick={handleDeleteMap} title="Delete Map"><Trash2 size={14} /></button>}
        {sep}
        <input style={{ ...S.input, flex: 1, minWidth: '100px' }} type="text" value={mapName} onChange={e => setMapName(e.target.value)} placeholder="Graph Name" />
        <button style={S.btn(true, !canEdit)} onClick={handleSaveMap} disabled={!canEdit} title="Save (Ctrl+S)"><Save size={14} /> Save</button>
        {sep}
        <div style={{ display: 'flex', background: '#181825', borderRadius: '4px', overflow: 'hidden', border: '1px solid #313244' }}>
          <button style={{ ...S.btn(mode === 'view'), borderRadius: 0, border: 'none' }} onClick={() => setMode('view')}><Eye size={13} /> View</button>
          <button style={{ ...S.btn(mode === 'edit' && canEdit, !canEdit), borderRadius: 0, border: 'none' }} onClick={() => canEdit && setMode('edit')} disabled={!canEdit}><Edit3 size={13} /> Edit</button>
        </div>
        {sep}
        {mode === 'edit' && canEdit && <button style={{ ...S.btn(false), background: '#89b4fa', color: '#000' }} onClick={handleAddNode}><Plus size={13} /> Node</button>}
        <button style={S.iconBtn(showSearch)} onClick={() => setShowSearch(!showSearch)} title="Search (Ctrl+F)"><Search size={14} /></button>
        <button style={S.iconBtn(showNodeList)} onClick={() => setShowNodeList(!showNodeList)} title="Node List"><Layers size={14} /></button>
        <button style={S.iconBtn(showGraphStats)} onClick={() => setShowGraphStats(!showGraphStats)} title="Statistics"><Hash size={14} /></button>
        <button style={S.iconBtn(showScenePanel)} onClick={() => setShowScenePanel(!showScenePanel)} title="Scenes / Presentation"><Film size={14} /></button>
        {sep}
        <button style={S.iconBtn(showAllLabels)} onClick={() => setShowAllLabels(!showAllLabels)} title="Show/Hide All Labels"><Tag size={14} /></button>
        <button style={S.iconBtn(showExportMenu)} onClick={() => setShowExportMenu(!showExportMenu)} title="Export / Import"><Download size={14} /></button>
        <button style={S.iconBtn(showBgSettings)} onClick={() => setShowBgSettings(!showBgSettings)} title="Background Settings"><Settings size={14} /></button>
      </div>

      {showSearch && (
        <div style={{ padding: '6px 10px', background: '#11111b', borderBottom: '1px solid #313244', display: 'flex', gap: '8px', alignItems: 'center', zIndex: 15, position: 'relative' }}>
          <Search size={14} style={{ color: '#a6adc8' }} />
          <input style={{ ...S.input, flex: 1 }} placeholder="Search nodes by name, tags or notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
          <button style={S.iconBtn(false)} onClick={() => { setShowSearch(false); setSearchQuery(''); }}><X size={14} /></button>
          {searchQuery && searchNodes.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: '10px', background: '#181825', border: '1px solid #313244', borderRadius: '8px', zIndex: 25, width: '350px', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
              {searchNodes.map(n => (
                <div key={n.id} onClick={() => { focusOnNode(n); setShowSearch(false); setSearchQuery(''); }}
                  style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e1e2e'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: n.color || '#89b4fa' }} />
                  <span style={{ fontSize: '12px' }}>{n.name}</span>
                  {n.tags && <span style={S.badge('#45475a')}>{n.tags.split(',')[0]}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showBgSettings && (
        <div style={S.floatingPanel('50px', '10px', '260px')}>
          <h4 style={{ margin: '0 0 10px', color: '#d4af37', fontSize: '13px' }}>Space Background</h4>
          <select style={{ ...S.input, width: '100%', marginBottom: '8px' }} value={bgConfig.type} onChange={e => setBgConfig({ ...bgConfig, type: e.target.value })}>
            <option value="color">Solid Color</option>
            <option value="image">Image (URL)</option>
            <option value="video">Video (URL)</option>
          </select>
          <input type={bgConfig.type === 'color' ? 'color' : 'text'} style={{ ...S.input, width: '100%', marginBottom: '8px' }} value={bgConfig.value} onChange={e => setBgConfig({ ...bgConfig, value: e.target.value })} />
          <label style={S.formLabel}>Opacity: {bgConfig.opacity}</label>
          <input type="range" min="0" max="1" step="0.05" style={{ width: '100%' }} value={bgConfig.opacity} onChange={e => setBgConfig({ ...bgConfig, opacity: parseFloat(e.target.value) })} />
        </div>
      )}

      {showExportMenu && (
        <div style={S.floatingPanel('50px', '70px', '200px')}>
          <h4 style={{ margin: '0 0 10px', color: '#d4af37', fontSize: '13px' }}>Export / Import</h4>
          <button style={{ ...S.btn(false), width: '100%', marginBottom: '6px', justifyContent: 'flex-start' }} onClick={() => exportGraph('json')}><Download size={13} /> JSON (.grapho.json)</button>
          <button style={{ ...S.btn(false), width: '100%', marginBottom: '6px', justifyContent: 'flex-start' }} onClick={() => exportGraph('xml')}><Download size={13} /> XML (.grapho.xml)</button>
          <button style={{ ...S.btn(false), width: '100%', marginBottom: '6px', justifyContent: 'flex-start' }} onClick={() => exportGraph('csv')}><Download size={13} /> CSV (.csv)</button>
          <div style={{ height: '1px', background: '#313244', margin: '8px 0' }} />
          <button style={{ ...S.btn(false), width: '100%', justifyContent: 'flex-start' }} onClick={importGraph}><Upload size={13} /> Import JSON</button>
        </div>
      )}

      {showScenePanel && (
        <div style={{ ...S.floatingPanel('50px', '120px', '340px'), maxHeight: '85vh' }}>
          <h4 style={{ margin: '0 0 10px', color: '#d4af37', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Scenes / Presentation
            <button style={S.iconBtn(false)} onClick={captureScene} title="Capture current scene"><Plus size={14} /></button>
          </h4>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', color: '#a6adc8', whiteSpace: 'nowrap' }}>Mode:</label>
            <select style={{ ...S.input, flex: 1, fontSize: '11px', padding: '3px 6px' }} value={playMode} onChange={e => setPlayMode(e.target.value)}>
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {playMode === 'manual' && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', color: '#a6adc8', whiteSpace: 'nowrap' }}>Skip (PgUp/PgDn):</label>
              <input type="number" min="1" max="10" style={{ ...S.input, width: '55px', fontSize: '11px', padding: '3px 6px' }} value={skipCount} onChange={e => setSkipCount(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
          )}

          {scenes.length === 0 && <p style={{ color: '#6c7086', fontSize: '11px' }}>Navigate the graph and capture scenes to create a presentation.</p>}
          {scenes.map((scene, idx) => (
            <div key={scene.id} style={{
              padding: '6px 8px', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: '4px',
              background: currentSceneIndex === idx ? 'rgba(212,175,55,0.15)' : 'transparent'
            }}>
              <span style={{ fontSize: '11px', color: '#d4af37', width: '20px', flexShrink: 0 }}>{idx + 1}.</span>
              <input style={{ ...S.input, flex: 1, fontSize: '11px', padding: '3px 6px' }} value={scene.name}
                onChange={e => setScenes(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))} />
              {playMode === 'auto' && (
                <input type="number" min="500" step="500" style={{ ...S.input, width: '50px', fontSize: '10px', padding: '3px 4px' }}
                  title="Duration (ms)" value={scene.duration || 3000}
                  onChange={e => setScenes(prev => prev.map((s, i) => i === idx ? { ...s, duration: Math.max(500, parseInt(e.target.value) || 3000) } : s))} />
              )}
              <button style={S.iconBtn(false)} onClick={() => moveScene(idx, -1)} title="Move Up"><ChevronLeft size={11} /></button>
              <button style={S.iconBtn(false)} onClick={() => moveScene(idx, 1)} title="Move Down"><ChevronRight size={11} /></button>
              <button style={S.iconBtn(false)} onClick={() => goToScene(scene)} title="Go to scene"><Eye size={12} /></button>
              <button style={S.iconBtn(false)} onClick={() => deleteScene(scene.id)} title="Remove"><Trash2 size={12} /></button>
            </div>
          ))}
          {scenes.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
              {!isPlaying ? (
                <button style={{ ...S.btn(true), flex: 1, justifyContent: 'center' }} onClick={playPresentation}><Play size={13} /> Play</button>
              ) : (
                <button style={{ ...S.btn(false), flex: 1, justifyContent: 'center', background: '#f38ba8', color: '#000' }} onClick={stopPresentation}><Square size={13} /> Stop</button>
              )}
            </div>
          )}

          {playMode === 'manual' && scenes.length > 0 && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(137,180,250,0.08)', borderRadius: '6px', border: '1px solid rgba(137,180,250,0.2)' }}>
              <p style={{ fontSize: '10px', color: '#a6adc8', margin: 0 }}>
                <strong style={{ color: '#89b4fa' }}>Keyboard Shortcuts:</strong><br/>
                Space / → = Next &nbsp;|&nbsp; Backspace / ← = Previous<br/>
                Home = First &nbsp;|&nbsp; End = Last<br/>
                PgUp = Skip Forward &nbsp;|&nbsp; PgDn = Skip Backward<br/>
                Esc = Stop
              </p>
            </div>
          )}
          {playMode === 'auto' && scenes.length > 0 && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(137,180,250,0.08)', borderRadius: '6px', border: '1px solid rgba(137,180,250,0.2)' }}>
              <p style={{ fontSize: '10px', color: '#a6adc8', margin: 0 }}>
                <strong style={{ color: '#89b4fa' }}>Keyboard Shortcuts:</strong><br/>
                Space = Pause/Resume &nbsp;|&nbsp; → = Next &nbsp;|&nbsp; ← = Previous<br/>
                Home = First &nbsp;|&nbsp; End = Last &nbsp;|&nbsp; Esc = Stop
              </p>
            </div>
          )}
        </div>
      )}

      {showNodeList && (
        <div style={S.floatingPanel('50px', '170px', '280px')}>
          <h4 style={{ margin: '0 0 8px', color: '#d4af37', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            Nodes ({graphStats.nodeCount})
            {graphData.nodes.some(n => n.fx !== undefined && !n.isAnchor) && (
              <button style={{ ...S.btn(false), fontSize: '10px', padding: '2px 8px' }} onClick={unpinAllNodes}><Unlock size={11} /> Unpin All</button>
            )}
          </h4>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {graphData.nodes.filter(n => !n.isAnchor).map(n => (
              <div key={n.id} onClick={() => focusOnNode(n)}
                style={{ padding: '5px 8px', cursor: 'pointer', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e1e2e'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color || '#89b4fa', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
                {n.fx !== undefined && <Lock size={10} style={{ color: '#f38ba8' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {showGraphStats && (
        <div style={S.floatingPanel('50px', '210px', '220px')}>
          <h4 style={{ margin: '0 0 10px', color: '#d4af37', fontSize: '13px' }}>Statistics</h4>
          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Nodes:</span><strong>{graphStats.nodeCount}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Edges:</span><strong>{graphStats.linkCount}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pinned:</span><strong>{graphStats.pinnedCount}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Isolated:</span><strong>{graphStats.isolatedCount}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scenes:</span><strong>{graphStats.sceneCount}</strong></div>
          </div>
        </div>
      )}

      <div style={S.canvasArea}>
        {renderBackground()}
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeThreeObject={nodeThreeObject}
          nodeLabel={node => node.isAnchor ? '' : `<div style="background:rgba(0,0,0,0.85);color:#fff;padding:4px 10px;border-radius:4px;font-size:12px;border:1px solid #d4af37">${node.name || ''}</div>`}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoverNode}
          onNodeDragEnd={handleNodeDragEnd}
          enableNodeDrag={mode === 'edit' && canEdit && isCtrlPressed}
          linkWidth={link => link.weight || 2}
          linkDirectionalArrowLength={computeArrowLength}
          linkDirectionalArrowRelPos={computeArrowRelPos}
          linkDirectionalArrowColor={link => {
            if (link.directional === false || link.arrowStyle === 'none') return 'rgba(0,0,0,0)';
            return computeLinkColor(link);
          }}
          linkColor={computeLinkColor}

          linkLabel={link => {
            if (link.isConnectorLink) {
              const anchor = linkAnchors.find(a => a.connectorLinkId === link.id);
              if (anchor) {
                const tl = graphData.links.find(l => l.id === anchor.targetLinkId);
                if (tl) {
                  const sn = typeof tl.source === 'object' ? tl.source.name : (graphData.nodes.find(n => n.id === tl.source)?.name || '?');
                  const tn = typeof tl.target === 'object' ? tl.target.name : (graphData.nodes.find(n => n.id === tl.target)?.name || '?');
                  return `<div style="background:rgba(0,0,0,0.85);color:#d4af37;padding:3px 8px;border-radius:4px;font-size:11px">Connector → ${sn}↔${tn}</div>`;
                }
              }
              return '';
            }
            return link.label ? `<div style="background:rgba(0,0,0,0.85);color:#fff;padding:3px 8px;border-radius:4px;font-size:11px">${link.label}</div>` : '';
          }}

          linkLineDash={link => {
            if (link.lineStyle === 'dashed') return [6, 3];
            if (link.lineStyle === 'dotted') return [2, 2];
            return null;
          }}
          linkCurvature={link => link.curvature || 0}
          onLinkHover={setHoverLink}
          onLinkClick={handleLinkClick}
          linkThreeObjectExtend={true}
          linkThreeObject={linkThreeObject}
          linkPositionUpdate={linkPositionUpdate}
          backgroundColor="rgba(0,0,0,0)"
          d3AlphaDecay={0.03}
          d3VelocityDecay={0.4}
          warmupTicks={100}
          cooldownTime={3000}
        />

        <NavigationGizmo fgRef={fgRef} />

        <div style={S.scaleHUD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '11px' }}>Controls</span>
            <button style={{ background: 'transparent', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 0, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }} onClick={centerGraph}>
              <Crosshair size={12} /> Center
            </button>
          </div>
          <div style={{ height: '1px', background: '#313244', width: '100%' }} />
          <span>🖱️ Drag = Rotate space</span>
          <span>📜 Scroll = Zoom</span>
          <span>🖱️ Click node = Open panel</span>
          {mode === 'edit' && <span>⌨️ Ctrl + Drag node = Move node</span>}
          {!canEdit && <span style={{ color: '#f9e2af' }}>🔒 Read-only mode</span>}
        </div>

        {isPlaying && (
          <div style={{
            position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.9)', border: '1px solid #d4af37', padding: '8px 16px',
            borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 30
          }}>
            <button style={navBtnStyle(currentSceneIndex <= 0)} onClick={() => navigateScene(0)} title="First (Home)">
              <SkipBack size={14} />
            </button>
            <button style={navBtnStyle(currentSceneIndex <= 0)} onClick={() => navigateScene(currentSceneIndex - 1)} title="Previous (←)">
              <ChevronsLeft size={14} />
            </button>
            {playMode === 'auto' ? (
              <button style={{ ...navBtnStyle(false), background: isAutoPaused ? '#a6e3a1' : '#f9e2af', color: '#000', border: '1px solid #d4af37' }}
                onClick={toggleAutoPause} title={isAutoPaused ? 'Resume (Space)' : 'Pause (Space)'}>
                {isAutoPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            ) : (
              <button style={{ ...navBtnStyle(currentSceneIndex >= scenes.length - 1), background: '#89b4fa', color: '#000', border: '1px solid #d4af37' }}
                onClick={() => navigateScene(currentSceneIndex + 1)} title="Next (Space)">
                <Play size={14} />
              </button>
            )}
            <button style={{ ...navBtnStyle(false), background: '#f38ba8', color: '#000', border: '1px solid #f38ba8' }}
              onClick={stopPresentation} title="Stop (Esc)">
              <Square size={14} />
            </button>
            <button style={navBtnStyle(currentSceneIndex >= scenes.length - 1)} onClick={() => navigateScene(currentSceneIndex + 1)} title="Next (→)">
              <ChevronsRight size={14} />
            </button>
            <button style={navBtnStyle(currentSceneIndex >= scenes.length - 1)} onClick={() => navigateScene(scenes.length - 1)} title="Last (End)">
              <SkipForward size={14} />
            </button>
            <div style={{ width: '1px', height: '20px', background: '#45475a' }} />
            <span style={{ fontSize: '12px', color: '#d4af37', whiteSpace: 'nowrap' }}>
              {currentSceneIndex + 1} / {scenes.length}
            </span>
            {isAutoPaused && playMode === 'auto' && (
              <span style={{ fontSize: '10px', color: '#f9e2af', fontWeight: 'bold' }}>PAUSED</span>
            )}
            {playMode === 'manual' && (
              <span style={{ fontSize: '10px', color: '#89b4fa', fontWeight: 'bold' }}>MANUAL</span>
            )}
          </div>
        )}

        {(activeNode || activeLink) && (
          <div style={S.overlay}>

            {activeNode && (
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#d4af37', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: activeNode.color }} />
                    {mode === 'edit' ? 'Edit:' : ''} {activeNode.name}
                  </h2>
                  <button onClick={closePanels} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}>×</button>
                </div>

                <div style={S.panelBody}>
                  {mode === 'view' ? (
                    <div style={{ overflowY: 'auto', height: '100%' }}>
                      {activeNode.tags && (
                        <div style={{ marginBottom: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {activeNode.tags.split(',').map((t, i) => <span key={i} style={S.badge('#45475a')}>{t.trim()}</span>)}
                        </div>
                      )}
                      {activeNode.notes && <p style={{ color: '#a6adc8', fontSize: '12px', marginBottom: '12px', fontStyle: 'italic' }}>{activeNode.notes}</p>}

                      {(() => {
                        const conns = getNodeConnections(activeNode.id);
                        const hasConnections = conns.directLinks.length > 0 || conns.connectorLinks.length > 0;
                        if (!hasConnections) return null;
                        return (
                          <div style={{ marginBottom: '16px', padding: '10px', background: 'rgba(137,180,250,0.08)', borderRadius: '6px', border: '1px solid rgba(137,180,250,0.2)' }}>
                            <h4 style={{ color: '#89b4fa', fontSize: '12px', margin: '0 0 8px' }}>Node Connections</h4>
                            {conns.directLinks.map(l => {
                              const { sid, tid } = getLinkId(l);
                              const otherNodeId = sid === activeNode.id ? tid : sid;
                              const otherNode = graphData.nodes.find(n => n.id === otherNodeId);
                              return (
                                <div key={l.id} style={{ fontSize: '11px', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: otherNode?.color || '#89b4fa' }} />
                                  <span>{sid === activeNode.id ? '→' : '←'} {otherNode?.name || '?'}</span>
                                  {l.label && <span style={S.badge('#45475a')}>{l.label}</span>}
                                </div>
                              );
                            })}
                            {conns.connectorLinks.map(c => (
                              <div key={c.anchor.connectorLinkId} style={{ fontSize: '11px', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37' }} />
                                <span>↔ [Edge: {getTargetLinkLabel(c.targetLink)}]</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: activeNode.htmlContent || '<em>No content.</em>' }} />
                    </div>
                  ) : (
                    <div style={S.splitLayout}>
                      {!isEditorMaximized && (
                        <div style={{ flex: isMobile ? 'none' : '0 0 340px', overflowY: 'auto', paddingRight: '8px' }}>
                          <div style={S.formGrid}>
                            <div>
                              <label style={S.formLabel}>Reference Name</label>
                              <input style={{ ...S.input, width: '100%' }} value={editFormData.name || ''} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                            </div>
                            <div>
                              <label style={S.formLabel}>Geometry</label>
                              <select style={{ ...S.input, width: '100%' }} value={editFormData.shape || 'sphere'} onChange={e => setEditFormData({ ...editFormData, shape: e.target.value })}>
                                {NODE_SHAPES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={S.formLabel}>Node Color</label>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {NODE_COLORS.map(c => (
                                  <div key={c} onClick={() => setEditFormData({ ...editFormData, color: c })}
                                    style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer', border: editFormData.color === c ? '2px solid #d4af37' : '2px solid transparent' }} />
                                ))}
                                <input type="color" style={{ width: 20, height: 20, padding: 0, border: 'none', cursor: 'pointer' }} value={editFormData.color || '#89b4fa'} onChange={e => setEditFormData({ ...editFormData, color: e.target.value })} />
                              </div>
                            </div>
                            <div>
                              <label style={S.formLabel}>Size: {editFormData.val || 8}</label>
                              <input type="range" min="2" max="30" step="1" style={{ width: '100%' }} value={editFormData.val || 8} onChange={e => setEditFormData({ ...editFormData, val: Number(e.target.value) })} />
                            </div>
                          </div>

                          <div style={S.formGrid}>
                            <div>
                              <label style={S.formLabel}>Node Opacity: {editFormData.opacity !== undefined ? editFormData.opacity : 1}</label>
                              <input type="range" min="0.05" max="1" step="0.05" style={{ width: '100%' }} value={editFormData.opacity !== undefined ? editFormData.opacity : 1} onChange={e => setEditFormData({ ...editFormData, opacity: parseFloat(e.target.value) })} />
                            </div>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <label style={S.formLabel}>Tags (comma separated)</label>
                            <input style={{ ...S.input, width: '100%' }} value={editFormData.tags || ''} onChange={e => setEditFormData({ ...editFormData, tags: e.target.value })} placeholder="genetics, molecular, ..." />
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={S.formLabel}>Quick Notes</label>
                            <textarea style={{ ...S.input, width: '100%', minHeight: '50px', resize: 'vertical' }} value={editFormData.notes || ''} onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })} />
                          </div>

                          <div style={S.formGrid}>
                            <div>
                              <label style={S.formLabel}>Label Color</label>
                              <input type="color" style={{ ...S.input, width: '100%', padding: '0 4px' }} value={editFormData.labelColor || '#ffffff'} onChange={e => setEditFormData({ ...editFormData, labelColor: e.target.value })} />
                            </div>
                            <div>
                              <label style={S.formLabel}>Show Label</label>
                              <select style={{ ...S.input, width: '100%' }} value={editFormData.showLabel !== false ? 'true' : 'false'} onChange={e => setEditFormData({ ...editFormData, showLabel: e.target.value === 'true' })}>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            </div>
                          </div>

                          {(editFormData.fx !== undefined) && (
                            <button style={{ ...S.btn(false), width: '100%', background: '#45475a', marginBottom: '12px', justifyContent: 'center' }} onClick={() => unpinNode()}>
                              <Unlock size={13} /> Unpin Node
                            </button>
                          )}

                          {(() => {
                            const conns = getNodeConnections(activeNode.id);
                            const hasConnections = conns.directLinks.length > 0 || conns.connectorLinks.length > 0;
                            if (!hasConnections) return null;
                            return (
                              <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(137,180,250,0.08)', borderRadius: '6px', border: '1px solid rgba(137,180,250,0.2)' }}>
                                <h4 style={{ color: '#89b4fa', fontSize: '12px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <LinkIcon size={12} /> Existing Connections ({conns.directLinks.length + conns.connectorLinks.length})
                                </h4>
                                {conns.directLinks.map(l => {
                                  const { sid, tid } = getLinkId(l);
                                  const otherNodeId = sid === activeNode.id ? tid : sid;
                                  const otherNode = graphData.nodes.find(n => n.id === otherNodeId);
                                  return (
                                    <div key={l.id} style={{ fontSize: '11px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: otherNode?.color || '#89b4fa', flexShrink: 0 }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sid === activeNode.id ? '→' : '←'} {otherNode?.name || '?'}</span>
                                        {l.label && <span style={S.badge('#45475a')}>{l.label}</span>}
                                      </div>
                                      <button style={{ background: 'transparent', border: 'none', color: '#f38ba8', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                                        onClick={() => removeNodeConnection(l.id)} title="Remove link"><X size={11} /></button>
                                    </div>
                                  );
                                })}
                                {conns.connectorLinks.map(c => (
                                  <div key={c.anchor.connectorLinkId} style={{ fontSize: '11px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37', flexShrink: 0 }} />
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>↔ [Edge: {getTargetLinkLabel(c.targetLink)}]</span>
                                    </div>
                                    <button style={{ background: 'transparent', border: 'none', color: '#f38ba8', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                                      onClick={() => { deleteConnectorLink(c.anchor.connectorLinkId); addNotification('Edge connection removed.', 'success'); }} title="Break connection"><X size={11} /></button>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          <h4 style={{ color: '#89b4fa', fontSize: '12px', borderBottom: '1px solid #313244', paddingBottom: '4px', marginBottom: '8px' }}>Connect to another Node</h4>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                            <select id="linkTarget" style={{ ...S.input, flex: 1 }}>
                              <option value="">Select target...</option>
                              {graphData.nodes.filter(n => n.id !== activeNode.id && !n.isAnchor).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                            </select>
                            <button style={S.btn(false)} onClick={() => handleAddLink(document.getElementById('linkTarget').value)}><ArrowRight size={13} /></button>
                          </div>
                          <h4 style={{ color: '#cba6f7', fontSize: '12px', borderBottom: '1px solid #313244', paddingBottom: '4px', marginBottom: '8px' }}>Connect to an Edge (Pedigree)</h4>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                            <select id="linkToLinkTarget" style={{ ...S.input, flex: 1 }}>
                              <option value="">Select edge...</option>
                              {userVisibleLinks.map(l => {
                                const sName = typeof l.source === 'object' ? l.source.name : (graphData.nodes.find(n => n.id === l.source)?.name || l.source);
                                const tName = typeof l.target === 'object' ? l.target.name : (graphData.nodes.find(n => n.id === l.target)?.name || l.target);
                                return <option key={l.id} value={l.id}>{sName} → {tName}{l.label ? ` (${l.label})` : ''}</option>;
                              })}
                            </select>
                            <button style={S.btn(false)} onClick={() => handleAddLinkToLink(document.getElementById('linkToLinkTarget').value)} title="Connect node to edge midpoint"><ArrowRight size={13} /></button>
                          </div>
                          <button style={{ ...S.btn(false), width: '100%', justifyContent: 'center', marginBottom: '6px' }} onClick={duplicateNode}><Copy size={13} /> Duplicate Node</button>
                        </div>
                      )}

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #313244', borderRadius: '6px', overflow: 'hidden', minHeight: '280px' }}>
                        <EditorToolbar editor={editor} isMaximized={isEditorMaximized} toggleMaximize={() => setIsEditorMaximized(!isEditorMaximized)} htmlMode={htmlMode} setHtmlMode={setHtmlMode} />
                        {htmlMode === 'rich' ? (
                          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: '#fff', color: '#000' }}>
                            <EditorContent editor={editor} />
                          </div>
                        ) : (
                          <textarea
                            style={{ flex: 1, width: '100%', background: '#11111b', color: '#a6e3a1', padding: '12px', border: 'none', resize: 'none', fontFamily: 'monospace', fontSize: '12px' }}
                            value={rawHtmlContent}
                            onChange={(e) => setRawHtmlContent(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {mode === 'edit' && canEdit && (
                  <div style={{ padding: '12px 18px', background: '#11111b', borderTop: '1px solid #313244', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                    <button style={{ ...S.btn(false), color: '#f38ba8' }} onClick={deleteNode}><Trash2 size={13} /> Delete</button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={S.btn(false)} onClick={closePanels}>Cancel</button>
                      <button style={S.btn(true)} onClick={saveNodeEdits}><Save size={13} /> Confirm</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeLink && mode === 'edit' && canEdit && (
              <div style={{ ...S.panel, maxWidth: '650px', height: '85%', minHeight: '300px', maxHeight: '85%' }}>
                <div style={S.panelHeader}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#d4af37' }}>
                    {activeLink.isConnectorLink ? 'Node↔Edge Connector' : 'Edge Editor'}
                  </h2>
                  <button onClick={closePanels} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ ...S.panelBody, overflowY: 'auto' }}>
                  <p style={{ color: '#a6adc8', marginBottom: '16px', fontSize: '12px' }}>
                    <strong>{activeLink.source?.name || (graphData.nodes.find(n => n.id === (typeof activeLink.source === 'object' ? activeLink.source.id : activeLink.source))?.name) || '?'}</strong>
                    {' '}<ArrowRight size={12} style={{ verticalAlign: 'middle' }} />{' '}
                    <strong>
                      {activeLink.isConnectorLink
                        ? (() => {
                            const anchor = linkAnchors.find(a => a.connectorLinkId === activeLink.id);
                            if (anchor) {
                              const tl = graphData.links.find(l => l.id === anchor.targetLinkId);
                              if (tl) {
                                return `[Edge: ${getTargetLinkLabel(tl)}]`;
                              }
                            }
                            return '[Edge]';
                          })()
                        : (activeLink.target?.name || (graphData.nodes.find(n => n.id === (typeof activeLink.target === 'object' ? activeLink.target.id : activeLink.target))?.name) || '?')
                      }
                    </strong>
                  </p>

                  {activeLink.isConnectorLink && (
                    <div style={{ padding: '12px', background: 'rgba(212,175,55,0.1)', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.3)', marginBottom: '16px' }}>
                      <p style={{ color: '#d4af37', fontSize: '12px', margin: '0 0 6px' }}>
                        This is a connector between a node and an edge (pedigree).
                      </p>
                      <p style={{ color: '#a6adc8', fontSize: '11px', margin: 0 }}>
                        To remove this connection, click "Break" below. The source node and target edge will be preserved.
                      </p>
                    </div>
                  )}

                  <h4 style={{ color: '#89b4fa', fontSize: '12px', borderBottom: '1px solid #313244', paddingBottom: '4px', marginBottom: '12px' }}>Line Properties</h4>
                  {renderLinkEditFields()}

                  {activeLink.isConnectorLink && (
                    <div style={S.formGrid}>
                      <div>
                        <label style={S.formLabel}>Arrow Direction</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#cdd6f4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(() => {
                              const sNode = graphData.nodes.find(n => n.id === editFormLink.sourceId);
                              const tNode = graphData.nodes.find(n => n.id === editFormLink.targetId);
                              const sLabel = sNode ? (sNode.isAnchor ? '[Anchor]' : sNode.name) : 'Source';
                              const tLabel = tNode ? (tNode.isAnchor ? '[Anchor]' : tNode.name) : 'Target';
                              return `${sLabel} → ${tLabel}`;
                            })()}
                          </span>
                          <button style={{ ...S.btn(false), background: '#cba6f7', color: '#000', padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => setEditFormLink(prev => ({
                              ...prev,
                              sourceId: prev.targetId,
                              targetId: prev.sourceId
                            }))}
                            title="Invert arrow direction">
                            <RotateCcw size={12} /> Invert
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!activeLink.isConnectorLink && (
                    <>
                      <div style={S.formGrid}>
                        <div>
                          <label style={S.formLabel}>Distance (3D units): {editFormLink.distance || 50}</label>
                          <input type="number" min="1" step="1" style={{ ...S.input, width: '100%' }} value={editFormLink.distance || 50} onChange={e => setEditFormLink({ ...editFormLink, distance: Math.max(1, parseFloat(e.target.value) || 1) })} />
                        </div>
                        <div>
                          <label style={S.formLabel}>Link Strength: {editFormLink.strength || 0.6}</label>
                          <input type="range" min="0.1" max="2" step="0.1" style={{ width: '100%' }} value={editFormLink.strength || 0.6} onChange={e => setEditFormLink({ ...editFormLink, strength: parseFloat(e.target.value) })} />
                        </div>
                        <div>
                          <label style={S.formLabel}>Arrow Direction</label>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#cdd6f4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {(() => {
                                const sNode = graphData.nodes.find(n => n.id === editFormLink.sourceId);
                                const tNode = graphData.nodes.find(n => n.id === editFormLink.targetId);
                                return `${sNode?.name || 'Source'} → ${tNode?.name || 'Target'}`;
                              })()}
                            </span>
                            <button style={{ ...S.btn(false), background: '#cba6f7', color: '#000', padding: '4px 10px', fontSize: '11px' }}
                              onClick={() => setEditFormLink(prev => ({
                                ...prev,
                                sourceId: prev.targetId,
                                targetId: prev.sourceId,
                                direction: prev.direction === 'reverse' ? 'forward' : 'reverse'
                              }))}
                              title="Invert arrow direction">
                              <RotateCcw size={12} /> Invert
                            </button>
                          </div>
                        </div>
                      </div>

                      <h4 style={{ color: '#89b4fa', fontSize: '12px', borderBottom: '1px solid #313244', paddingBottom: '4px', marginTop: '8px', marginBottom: '8px' }}>Label on Line</h4>
                      <div style={S.formGrid}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={S.formLabel}>Text</label>
                          <input style={{ ...S.input, width: '100%' }} value={editFormLink.label || ''} onChange={e => setEditFormLink({ ...editFormLink, label: e.target.value })} placeholder="E.g.: Causes, Results in..." />
                        </div>
                        <div>
                          <label style={S.formLabel}>Color</label>
                          <input type="color" style={{ ...S.input, width: '100%', padding: '0 4px' }} value={editFormLink.labelColor || '#ffffff'} onChange={e => setEditFormLink({ ...editFormLink, labelColor: e.target.value })} />
                        </div>
                        <div>
                          <label style={S.formLabel}>Size</label>
                          <input type="number" style={{ ...S.input, width: '100%' }} value={editFormLink.labelFontSize || 24} onChange={e => setEditFormLink({ ...editFormLink, labelFontSize: parseInt(e.target.value, 10) })} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={S.formLabel}>Font</label>
                          <select style={{ ...S.input, width: '100%' }} value={editFormLink.labelFontFamily || 'Arial'} onChange={e => setEditFormLink({ ...editFormLink, labelFontFamily: e.target.value })}>
                            {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>

                      <h4 style={{ color: '#cba6f7', fontSize: '12px', borderBottom: '1px solid #313244', paddingBottom: '4px', marginTop: '8px', marginBottom: '8px' }}>Connect this Edge to another Edge</h4>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        <select id="linkToLinkFromLink" style={{ ...S.input, flex: 1 }}>
                          <option value="">Select target edge...</option>
                          {userVisibleLinks.filter(l => l.id !== activeLink.id).map(l => {
                            const sName = typeof l.source === 'object' ? l.source.name : (graphData.nodes.find(n => n.id === l.source)?.name || l.source);
                            const tName = typeof l.target === 'object' ? l.target.name : (graphData.nodes.find(n => n.id === l.target)?.name || l.target);
                            return <option key={l.id} value={l.id}>{sName} → {tName}{l.label ? ` (${l.label})` : ''}</option>;
                          })}
                        </select>
                        <button style={S.btn(false)} onClick={() => {
                          const targetVal = document.getElementById('linkToLinkFromLink')?.value;
                          if (targetVal) handleAddLinkToLinkFromLink(activeLink.id, targetVal);
                        }} title="Connect edge to edge"><ArrowRight size={13} /></button>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ padding: '12px 18px', background: '#11111b', borderTop: '1px solid #313244', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                  <button style={{ ...S.btn(false), color: '#f38ba8' }} onClick={deleteLink}><Trash2 size={13} /> Break</button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={S.btn(false)} onClick={closePanels}>Cancel</button>
                    <button style={S.btn(true)} onClick={saveLinkEdits}><Save size={13} /> Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphoMap3D;