// src/pages/admin/LandingPageEditor.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Save, Upload, X, Layout, Sliders, Grid, Share2, Info,
    Plus, Trash2, ArrowUp, ArrowDown, Edit2, Check, ExternalLink,
    Zap, Droplets, Leaf, Factory, BarChart3, Database, TrendingUp, Flame, Activity, Shield, Home, FileText,
    Settings, HelpCircle, Eye, EyeOff, CheckSquare, ChevronRight
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../services/api';
import BlockBuilder from './BlockBuilder';

// Map icon names to components for selection preview
const ICON_MAP = {
    Zap, Droplets, Leaf, Factory, BarChart3, Database, TrendingUp, Flame, Activity, Shield, Home, FileText
};

// ALL_SECTIONS is now fetched dynamically from /admin/landing-config/

function Toast({ message, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium animate-bounce
            ${type === 'success' ? 'bg-indigo-600' : 'bg-rose-500'}`}>
            {type === 'success' ? '✓' : '⚠'} {message}
        </div>
    );
}

function SectionCard({ title, isActive, onToggle, children }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">{title}</h3>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                            ${isActive ? 'bg-indigo-650' : 'bg-slate-200 dark:bg-slate-750'}`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                )}
            </div>
            <div className="p-6 space-y-5">{children}</div>
        </div>
    );
}

function Field({ label, hint, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && <p className="text-[10px] text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
    );
}

function Input({ ...props }) {
    return (
        <input {...props}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all" />
    );
}

function Select({ children, ...props }) {
    return (
        <select {...props}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all">
            {children}
        </select>
    );
}

export default function LandingPageEditor() {
    const [landingConfig, setLandingConfig] = useState({ sections: [], block_types: [] });
    const ALL_SECTIONS = landingConfig.sections;
    const BLOCK_TYPES = landingConfig.block_types;
    const location = useLocation();
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Sidebar active item: 'landing', 'faqs', 'pages'
    const [activeTab, setActiveTab] = useState('landing');
    
    // Sub-tab inside Landing Page settings: 'header', 'slides', 'sectors', 'integrations'
    const [landingSubTab, setLandingSubTab] = useState('header');

    // Sub-tab inside Page Configuration: 'layout', 'sections', 'pages_list'
    const [pageSubTab, setPageSubTab] = useState('layout');

    // Section/Page Builder editing states
    const [editingSection, setEditingSection] = useState(null);
    const [editingPage, setEditingPage] = useState(null);

    // Block Builder drawer state
    const [blockBuilderOpen, setBlockBuilderOpen] = useState(false);
    const [blockBuilderInitial, setBlockBuilderInitial] = useState(null);

    // Site settings schema
    const [settings, setSettings] = useState({
        landing_header: { logo_text: '', logo_subtext: '', menu_items: [] },
        landing_body_sectors: [],
        landing_body_integrations: [],
        landing_footer: { quick_links: [], system_info: [], copyright_text: '' },
        landing_faqs: [],
        landing_page_settings: {
            show_hero_slideshow: true,
            show_sectors_grid: true,
            show_bhutan_map: true,
            show_sankey_diagram: true,
            show_energy_trends: true,
            show_faqs: true,
            hero_transition_speed: 4500,
            map_default_year: '2024',
            sankey_default_year: '2024'
        }
    });

    // Slides
    const [slides, setSlides] = useState([]);
    const [slideEditing, setSlideEditing] = useState(null);
    const [slideFile, setSlideFile] = useState(null);
    const [slidePreview, setSlidePreview] = useState('');
    const slideInputRef = useRef();

    useEffect(() => {
        // sync active tab with URL path
        const path = location.pathname;
        if (path.includes('/faqs')) {
            setActiveTab('faqs');
        } else if (path.includes('/pages')) {
            setActiveTab('pages');
        } else {
            setActiveTab('landing');
        }
    }, [location.pathname]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/site-settings/');
            const data = res && res.ok ? await res.json() : null;
            if (data) {
                setSettings({
                    landing_header: data.landing_header || { logo_text: '', logo_subtext: '', menu_items: [] },
                    landing_body_sectors: data.landing_body_sectors || [],
                    landing_body_integrations: data.landing_body_integrations || [],
                    landing_footer: data.landing_footer || { quick_links: [], system_info: [], copyright_text: '' },
                    landing_faqs: data.landing_faqs || [],
                    landing_page_settings: {
                        show_hero_slideshow: true,
                        show_sectors_grid: true,
                        show_bhutan_map: true,
                        show_sankey_diagram: true,
                        show_energy_trends: true,
                        show_faqs: true,
                        hero_transition_speed: 4500,
                        map_default_year: '2022',
                        sankey_default_year: '2022',
                        sections_order: [],
                        custom_sections: [],
                        custom_pages: [],
                        ...(data.landing_page_settings || {})
                    }
                });
            }

            const slideRes = await apiFetch('/admin/landing-slides/');
            const slideData = slideRes && slideRes.ok ? await slideRes.json() : [];
            setSlides(Array.isArray(slideData) ? slideData : (slideData?.results || []));

            const configRes = await apiFetch('/admin/landing-config/');
            const configData = configRes && configRes.ok ? await configRes.json() : { sections: [], block_types: [] };
            setLandingConfig(configData);
        } catch (e) {
            setToast({ message: 'Failed to load configurations: ' + e.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await apiFetch('/admin/site-settings/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    landing_header: settings.landing_header,
                    landing_body_sectors: settings.landing_body_sectors,
                    landing_body_integrations: settings.landing_body_integrations,
                    landing_footer: settings.landing_footer,
                    landing_faqs: settings.landing_faqs,
                    landing_page_settings: settings.landing_page_settings
                })
            });
            setToast({ message: 'Configuration saved successfully!', type: 'success' });
        } catch (e) {
            setToast({ message: 'Failed to save settings: ' + e.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // --- Header Management ---
    const updateHeaderField = (field, val) => {
        setSettings(s => ({
            ...s,
            landing_header: { ...s.landing_header, [field]: val }
        }));
    };

    const handleAddMenu = () => {
        const items = [...(settings.landing_header.menu_items || [])];
        items.push({ label: 'New Link', to: '/', icon: 'Home', exact: false });
        updateHeaderField('menu_items', items);
    };

    const handleRemoveMenu = idx => {
        const items = [...(settings.landing_header.menu_items || [])];
        items.splice(idx, 1);
        updateHeaderField('menu_items', items);
    };

    const handleUpdateMenu = (idx, field, val) => {
        const items = [...(settings.landing_header.menu_items || [])];
        items[idx] = { ...items[idx], [field]: val };
        updateHeaderField('menu_items', items);
    };

    // --- Slider/Hero ---
    const startEditSlide = (slide) => {
        setSlideEditing(slide || { title: '', tagline: '', cta_text: 'Live Dashboard', cta_link: '/public', order: slides.length });
        setSlideFile(null);
        setSlidePreview(slide ? slide.image_url : '');
    };

    const handleSaveSlide = async () => {
        if (!slideEditing) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', slideEditing.title || '');
            formData.append('tagline', slideEditing.tagline || '');
            formData.append('cta_text', slideEditing.cta_text || '');
            formData.append('cta_link', slideEditing.cta_link || '');
            formData.append('order', slideEditing.order || 0);
            if (slideFile) {
                formData.append('image', slideFile);
            }

            const url = slideEditing.id ? `/admin/landing-slides/${slideEditing.id}/` : '/admin/landing-slides/';
            const method = slideEditing.id ? 'PUT' : 'POST';

            await apiFetch(url, { method, body: formData });
            setToast({ message: 'Slide saved successfully!', type: 'success' });
            setSlideEditing(null);
            setSlideFile(null);
            setSlidePreview('');
            
            const slideRes = await apiFetch('/admin/landing-slides/');
            const slideData = slideRes && slideRes.ok ? await slideRes.json() : [];
            setSlides(Array.isArray(slideData) ? slideData : (slideData?.results || []));
        } catch (e) {
            setToast({ message: 'Failed to save slide: ' + e.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSlide = async (id) => {
        if (!window.confirm('Are you sure you want to delete this slide?')) return;
        try {
            await apiFetch(`/admin/landing-slides/${id}/`, { method: 'DELETE' });
            setToast({ message: 'Slide deleted.', type: 'success' });
            setSlides(s => s.filter(x => x.id !== id));
        } catch (e) {
            setToast({ message: 'Failed to delete: ' + e.message, type: 'error' });
        }
    };

    // --- Sectors ---
    const handleAddSector = () => {
        const list = [...settings.landing_body_sectors];
        list.push({ icon: 'Zap', label: 'New Sector', desc: 'Description of the energy sector.', color: '#2563eb', bg: '#eff6ff' });
        setSettings(s => ({ ...s, landing_body_sectors: list }));
    };

    const handleRemoveSector = idx => {
        const list = [...settings.landing_body_sectors];
        list.splice(idx, 1);
        setSettings(s => ({ ...s, landing_body_sectors: list }));
    };

    const handleUpdateSector = (idx, field, val) => {
        const list = [...settings.landing_body_sectors];
        list[idx] = { ...list[idx], [field]: val };
        setSettings(s => ({ ...s, landing_body_sectors: list }));
    };

    // --- Integrations ---
    const handleAddIntegration = () => {
        const list = [...settings.landing_body_integrations];
        list.push({ abbr: 'NEW', full: 'New Integrated System Name' });
        setSettings(s => ({ ...s, landing_body_integrations: list }));
    };

    const handleRemoveIntegration = idx => {
        const list = [...settings.landing_body_integrations];
        list.splice(idx, 1);
        setSettings(s => ({ ...s, landing_body_integrations: list }));
    };

    const handleUpdateIntegration = (idx, field, val) => {
        const list = [...settings.landing_body_integrations];
        list[idx] = { ...list[idx], [field]: val };
        setSettings(s => ({ ...s, landing_body_integrations: list }));
    };

    // --- FAQs ---
    const handleAddFAQ = () => {
        const faqs = [...settings.landing_faqs];
        faqs.push({ question: 'New Question?', answer: 'Answer content here.', is_active: true });
        setSettings(s => ({ ...s, landing_faqs: faqs }));
    };

    const handleRemoveFAQ = idx => {
        const faqs = [...settings.landing_faqs];
        faqs.splice(idx, 1);
        setSettings(s => ({ ...s, landing_faqs: faqs }));
    };

    const handleUpdateFAQ = (idx, field, val) => {
        const faqs = [...settings.landing_faqs];
        faqs[idx] = { ...faqs[idx], [field]: val };
        setSettings(s => ({ ...s, landing_faqs: faqs }));
    };

    // --- Page Settings / Toggles ---
    const updatePageToggle = (key) => {
        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                [key]: !s.landing_page_settings[key]
            }
        }));
    };

    const toggleSectionOrder = (idx) => {
        const list = [...(settings.landing_page_settings.sections_order || [])];
        if (!list[idx]) return;
        list[idx] = { ...list[idx], enabled: !list[idx].enabled };
        
        const legacyMap = {
            hero: 'show_hero_slideshow',
            sectors: 'show_sectors_grid',
            map: 'show_bhutan_map',
            sankey: 'show_sankey_diagram',
            trends: 'show_energy_trends',
            faqs: 'show_faqs'
        };
        const sectionId = list[idx].id;
        const legacyKey = legacyMap[sectionId];
        
        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                sections_order: list,
                ...(legacyKey ? { [legacyKey]: list[idx].enabled } : {})
            }
        }));
    };

    const moveSectionOrder = (idx, direction) => {
        const list = [...(settings.landing_page_settings.sections_order || [])];
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= list.length) return;
        
        const temp = list[idx];
        list[idx] = list[targetIdx];
        list[targetIdx] = temp;
        
        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                sections_order: list
            }
        }));
    };

    const updatePageField = (key, val) => {
        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                [key]: val
            }
        }));
    };

    // --- Visualization Block Builder save handler ---
    const handleSaveVisualizationBlock = (block) => {
        // Find the icon for display in section picker
        const bt = BLOCK_TYPES.find(b => b.id === block.type);
        const newSection = {
            id: block.id || ('blk_' + Date.now()),
            name: block.title,
            type: block.type,
            color: block.color,
            icon: bt?.icon || '📊',
            description: block.description || '',
            config: block,          // full block config stored here
            content: block.content || {}
        };
        const sections = [...(settings.landing_page_settings.custom_sections || []), newSection];
        setSettings(s => ({
            ...s,
            landing_page_settings: { ...s.landing_page_settings, custom_sections: sections }
        }));
        setToast({ message: `"${block.title}" block created! Save Changes to persist.`, type: 'success' });
    };

    // --- Custom Sections Management ---
    const handleSaveCustomSection = () => {
        if (!editingSection.name.trim()) {
            setToast({ message: 'Section Name is required', type: 'error' });
            return;
        }
        const sections = [...(settings.landing_page_settings.custom_sections || [])];
        if (editingSection.isNew) {
            const newSec = {
                id: 'sec_' + Date.now(),
                name: editingSection.name,
                type: editingSection.type,
                content: editingSection.content
            };
            sections.push(newSec);
        } else {
            const idx = sections.findIndex(x => x.id === editingSection.id);
            if (idx !== -1) {
                sections[idx] = {
                    id: editingSection.id,
                    name: editingSection.name,
                    type: editingSection.type,
                    content: editingSection.content
                };
            }
        }
        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                custom_sections: sections
            }
        }));
        setEditingSection(null);
        setToast({ message: 'Custom Section updated locally. Save Changes to persist.', type: 'success' });
    };

    const handleDeleteCustomSection = (secId) => {
        const sections = (settings.landing_page_settings.custom_sections || []).filter(x => x.id !== secId);
        // Also remove from landing page layout order
        const order = (settings.landing_page_settings.sections_order || []).filter(x => x.id !== secId);
        // And from any custom page layouts
        const pages = (settings.landing_page_settings.custom_pages || []).map(p => ({
            ...p,
            sections_order: (p.sections_order || []).filter(x => x.id !== secId)
        }));

        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                custom_sections: sections,
                sections_order: order,
                custom_pages: pages
            }
        }));
        setToast({ message: 'Section removed. Save Changes to persist.', type: 'success' });
    };

    const addSectionToLayout = (secId, name) => {
        const order = [...(settings.landing_page_settings.sections_order || [])];
        if (order.some(x => x.id === secId)) {
            setToast({ message: 'Section is already in layout', type: 'error' });
            return;
        }
        order.push({ id: secId, name: name, enabled: true });
        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                sections_order: order
            }
        }));
        setToast({ message: 'Added to Landing Layout', type: 'success' });
    };

    const removeSectionFromLayout = (idx) => {
        const order = [...(settings.landing_page_settings.sections_order || [])];
        order.splice(idx, 1);
        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                sections_order: order
            }
        }));
    };

    // --- Custom Pages Management ---
    const handleSaveCustomPage = () => {
        if (!editingPage.title.trim() || !editingPage.slug.trim()) {
            setToast({ message: 'Title and Slug are required', type: 'error' });
            return;
        }
        // Normalize slug
        const cleanSlug = editingPage.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        const pages = [...(settings.landing_page_settings.custom_pages || [])];
        if (editingPage.isNew) {
            if (pages.some(p => p.slug === cleanSlug)) {
                setToast({ message: 'A page with this slug already exists', type: 'error' });
                return;
            }
            const newPage = {
                id: 'page_' + Date.now(),
                title: editingPage.title,
                slug: cleanSlug,
                sections_order: editingPage.sections_order || []
            };
            pages.push(newPage);
        } else {
            const idx = pages.findIndex(x => x.id === editingPage.id);
            if (idx !== -1) {
                pages[idx] = {
                    id: editingPage.id,
                    title: editingPage.title,
                    slug: cleanSlug,
                    sections_order: editingPage.sections_order || []
                };
            }
        }
        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                custom_pages: pages
            }
        }));
        setEditingPage(null);
        setToast({ message: 'Custom Page configuration updated locally. Save Changes to persist.', type: 'success' });
    };

    const handleDeleteCustomPage = (pageId) => {
        const pages = (settings.landing_page_settings.custom_pages || []).filter(x => x.id !== pageId);
        setSettings(s => ({
            ...s,
            landing_page_settings: {
                ...s.landing_page_settings,
                custom_pages: pages
            }
        }));
        setToast({ message: 'Page deleted. Save Changes to persist.', type: 'success' });
    };

    const addSectionToPageLayout = (secId, name) => {
        const layout = [...(editingPage.sections_order || [])];
        if (layout.some(x => x.id === secId)) {
            setToast({ message: 'Section is already in layout', type: 'error' });
            return;
        }
        layout.push({ id: secId, name: name, enabled: true });
        setEditingPage(p => ({
            ...p,
            sections_order: layout
        }));
    };

    const removeSectionFromPageLayout = (idx) => {
        const layout = [...(editingPage.sections_order || [])];
        layout.splice(idx, 1);
        setEditingPage(p => ({
            ...p,
            sections_order: layout
        }));
    };

    const movePageSectionOrder = (idx, direction) => {
        const layout = [...(editingPage.sections_order || [])];
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= layout.length) return;
        const temp = layout[idx];
        layout[idx] = layout[targetIdx];
        layout[targetIdx] = temp;
        setEditingPage(p => ({
            ...p,
            sections_order: layout
        }));
    };

    const togglePageSectionOrder = (idx) => {
        const layout = [...(editingPage.sections_order || [])];
        if (!layout[idx]) return;
        layout[idx] = { ...layout[idx], enabled: !layout[idx].enabled };
        setEditingPage(p => ({
            ...p,
            sections_order: layout
        }));
    };

    const updateCardField = (cidx, key, val) => {
        setEditingSection(prev => {
            const cards = [...(prev.content?.cards || [])];
            if (cards[cidx]) {
                cards[cidx] = { ...cards[cidx], [key]: val };
            }
            return {
                ...prev,
                content: {
                    ...prev.content,
                    cards
                }
            };
        });
    };

    const deleteCard = (cidx) => {
        setEditingSection(prev => {
            const cards = (prev.content?.cards || []).filter((_, i) => i !== cidx);
            return {
                ...prev,
                content: {
                    ...prev.content,
                    cards
                }
            };
        });
    };

    const addCard = () => {
        setEditingSection(prev => {
            const cards = [...(prev.content?.cards || [])];
            cards.push({ icon: 'Zap', label: 'Feature Item', desc: 'Detail info...', color: '#10b981', link: '' });
            return {
                ...prev,
                content: {
                    ...prev.content,
                    cards
                }
            };
        });
    };

    if (loading) {
        return (
            <DashboardLayout title="Frontend Setting">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                        <p className="text-sm text-slate-500">Loading configurations...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Tab navigation handler
    const navigateTab = (tabId) => {
        if (tabId === 'landing') navigate('/admin/frontend/landing');
        else if (tabId === 'faqs') navigate('/admin/frontend/faqs');
        else if (tabId === 'pages') navigate('/admin/frontend/pages');
    };

    return (
        <DashboardLayout title="Frontend Setting">
            {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Left Sub-Sidebar Menu - EXACTLY matching the layout from the user screenshot */}
                <div className="w-full lg:w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 flex flex-col gap-2.5 shadow-sm">
                    <div className="px-4 py-3 bg-indigo-600 text-white rounded-2xl flex items-center justify-between shadow-md mb-2">
                        <div className="flex items-center gap-2">
                            <Settings className="h-4.5 w-4.5" />
                            <span className="font-extrabold text-sm tracking-wide">Frontend Setting</span>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => navigateTab('landing')}
                        className={`w-full text-left px-5 py-3 rounded-2xl text-sm font-extrabold transition-all flex items-center justify-between
                            ${activeTab === 'landing'
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400' 
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
                    >
                        <span className="flex items-center gap-2">
                            <Layout className="h-4 w-4" /> Landing Page
                        </span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>

                    <button
                        onClick={() => navigateTab('faqs')}
                        className={`w-full text-left px-5 py-3 rounded-2xl text-sm font-extrabold transition-all flex items-center justify-between
                            ${activeTab === 'faqs' 
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400' 
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
                    >
                        <span className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" /> FAQs
                        </span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>

                    <button
                        onClick={() => navigateTab('pages')}
                        className={`w-full text-left px-5 py-3 rounded-2xl text-sm font-extrabold transition-all flex items-center justify-between
                            ${activeTab === 'pages' 
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400' 
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
                    >
                        <span className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4" /> Page Settings
                        </span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>
                </div>

                {/* Right Content Column */}
                <div className="flex-1 w-full space-y-6">
                    
                    {/* Module header */}
                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-lg font-black uppercase tracking-wider">
                                {activeTab === 'landing' && 'Landing Page CMS'}
                                {activeTab === 'faqs' && 'Frequently Asked Questions'}
                                {activeTab === 'pages' && 'Page Modules & Configuration'}
                            </h2>
                            <p className="text-xs text-slate-300">
                                {activeTab === 'landing' && 'Manage crest branding, slider lists, navigation paths, and body directories.'}
                                {activeTab === 'faqs' && 'Maintain interactive list of frequently asked questions and official guidelines.'}
                                {activeTab === 'pages' && 'Enable/disable landing page segments or customize display values.'}
                            </p>
                        </div>
                        {activeTab !== 'landing' || landingSubTab !== 'slides' || !slideEditing ? (
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow transition-all hover:scale-[1.01]"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        ) : null}
                    </div>

                    {/* Content Section based on Active Tab */}
                    {activeTab === 'landing' && (
                        <div className="space-y-6">
                            {/* Nested landing page tabs */}
                            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-px overflow-x-auto">
                                {[
                                    { id: 'header', label: 'Header Branding & Navigation' },
                                    { id: 'slides', label: 'Hero Slider' },
                                    { id: 'sectors', label: 'Sectors Grid' },
                                    { id: 'integrations', label: 'Integrations' }
                                ].map(st => (
                                    <button
                                        key={st.id}
                                        onClick={() => { setLandingSubTab(st.id); setSlideEditing(null); }}
                                        className={`px-4 py-2 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex-shrink-0
                                            ${landingSubTab === st.id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>

                            {landingSubTab === 'header' && (
                                <SectionCard title="Navbar Branding & Links">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Logo Bold Title">
                                            <Input value={settings.landing_header.logo_text} onChange={e => updateHeaderField('logo_text', e.target.value)} />
                                        </Field>
                                        <Field label="Logo Subtitle Line">
                                            <Input value={settings.landing_header.logo_subtext} onChange={e => updateHeaderField('logo_subtext', e.target.value)} />
                                        </Field>
                                    </div>

                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden mt-4">
                                        <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Navigation Links</h4>
                                            <button onClick={handleAddMenu} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                                                <Plus className="h-3.5 w-3.5" /> Add
                                            </button>
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {(settings.landing_header.menu_items || []).map((item, idx) => (
                                                <div key={idx} className="p-4 flex flex-col sm:flex-row gap-3 items-center">
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                                                        <Input value={item.label} onChange={e => handleUpdateMenu(idx, 'label', e.target.value)} placeholder="Link Label" />
                                                        <div className="flex flex-col gap-1.5">
                                                            <Input value={item.to} onChange={e => handleUpdateMenu(idx, 'to', e.target.value)} placeholder="Target URL" />
                                                            {settings.landing_page_settings?.custom_pages?.length > 0 && (
                                                                <select 
                                                                    className="text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-750 p-1.5 text-slate-500 border-none outline-none focus:ring-1 focus:ring-indigo-650"
                                                                    onChange={e => { if (e.target.value) handleUpdateMenu(idx, 'to', e.target.value); }}
                                                                    value={settings.landing_page_settings.custom_pages.some(p => `/page/${p.slug}` === item.to) ? item.to : ""}
                                                                >
                                                                    <option value="">-- Quick Link Page --</option>
                                                                    {settings.landing_page_settings.custom_pages.map(cp => (
                                                                        <option key={cp.slug} value={`/page/${cp.slug}`}>{cp.title}</option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </div>
                                                        <Select value={item.icon} onChange={e => handleUpdateMenu(idx, 'icon', e.target.value)}>
                                                            {Object.keys(ICON_MAP).map(k => (
                                                                <option key={k} value={k}>{k}</option>
                                                            ))}
                                                        </Select>
                                                    </div>
                                                    <button onClick={() => handleRemoveMenu(idx)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </SectionCard>
                            )}

                            {landingSubTab === 'slides' && (
                                <div className="space-y-6">
                                    {!slideEditing ? (
                                        <SectionCard title="Interactive Slideshow Slides">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-slate-400">Sliders are animated automatically on landing page.</p>
                                                <button onClick={() => startEditSlide(null)} className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl">
                                                    <Plus className="h-4 w-4" /> Add Slide
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {slides.map(slide => (
                                                    <div key={slide.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/20 p-4 flex gap-4">
                                                        <div className="h-24 w-32 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                                                            <img src={slide.image_url} alt={slide.title} className="h-full w-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                            <div>
                                                                <h4 className="font-bold text-sm truncate">{slide.title || 'Untitled Slide'}</h4>
                                                                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{slide.tagline}</p>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                                <span className="text-[10px] font-mono text-indigo-650 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">Order: {slide.order}</span>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => startEditSlide(slide)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:text-indigo-600">
                                                                        <Edit2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteSlide(slide.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100">
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    ) : (
                                        <SectionCard title={slideEditing.id ? "Edit Slide Attributes" : "New Slider Entry"}>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500">Image Asset</label>
                                                    <div className="h-44 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center overflow-hidden relative">
                                                        {slidePreview ? (
                                                            <>
                                                                <img src={slidePreview} alt="Preview" className="h-full w-full object-cover" />
                                                                <button type="button" onClick={() => { setSlidePreview(''); setSlideFile(null); }} className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full">
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-1.5 p-4 text-center cursor-pointer" onClick={() => slideInputRef.current.click()}>
                                                                <Upload className="h-6 w-6 text-slate-350" />
                                                                <span className="text-xs font-bold text-slate-500">Choose slide file</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <input ref={slideInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setSlideFile(file);
                                                            setSlidePreview(URL.createObjectURL(file));
                                                        }
                                                    }} />
                                                </div>

                                                <div className="md:col-span-2 space-y-4">
                                                    <Field label="Slide Main Headline">
                                                        <Input value={slideEditing.title} onChange={e => setSlideEditing(s => ({ ...s, title: e.target.value }))} />
                                                    </Field>
                                                    <Field label="Tagline Description text">
                                                        <Input value={slideEditing.tagline} onChange={e => setSlideEditing(s => ({ ...s, tagline: e.target.value }))} />
                                                    </Field>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Field label="CTA Button Text">
                                                            <Input value={slideEditing.cta_text} onChange={e => setSlideEditing(s => ({ ...s, cta_text: e.target.value }))} />
                                                        </Field>
                                                        <Field label="CTA Link Path">
                                                            <Input value={slideEditing.cta_link} onChange={e => setSlideEditing(s => ({ ...s, cta_link: e.target.value }))} />
                                                        </Field>
                                                    </div>
                                                    <Field label="Ordering weight">
                                                        <Input type="number" value={slideEditing.order} onChange={e => setSlideEditing(s => ({ ...s, order: parseInt(e.target.value) || 0 }))} />
                                                    </Field>

                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => setSlideEditing(null)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold">Cancel</button>
                                                        <button onClick={handleSaveSlide} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl text-xs font-bold">Save Slide</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </SectionCard>
                                    )}
                                </div>
                            )}

                            {landingSubTab === 'sectors' && (
                                <SectionCard title="Sectors Directory Grid">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs text-slate-400">Customize sectors displayed in the grid block.</p>
                                        <button onClick={handleAddSector} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-650">
                                            <Plus className="h-3.5 w-3.5" /> Add Sector
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {settings.landing_body_sectors.map((sec, idx) => {
                                            const Icon = ICON_MAP[sec.icon] || Zap;
                                            return (
                                                <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                                    <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sec.bg, color: sec.color }}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full">
                                                        <Field label="Sector Name">
                                                            <Input value={sec.label} onChange={e => handleUpdateSector(idx, 'label', e.target.value)} />
                                                        </Field>
                                                        <Field label="Sector Icon">
                                                            <Select value={sec.icon} onChange={e => handleUpdateSector(idx, 'icon', e.target.value)}>
                                                                {Object.keys(ICON_MAP).map(k => (
                                                                    <option key={k} value={k}>{k}</option>
                                                                ))}
                                                            </Select>
                                                        </Field>
                                                        <Field label="Accent Color">
                                                            <div className="flex gap-2">
                                                                <input type="color" value={sec.color} onChange={e => handleUpdateSector(idx, 'color', e.target.value)} className="w-8 h-9 border-0 cursor-pointer rounded-lg flex-shrink-0 bg-transparent" />
                                                                <Input value={sec.color} onChange={e => handleUpdateSector(idx, 'color', e.target.value)} />
                                                            </div>
                                                        </Field>
                                                        <Field label="Background tint">
                                                            <div className="flex gap-2">
                                                                <input type="color" value={sec.bg} onChange={e => handleUpdateSector(idx, 'bg', e.target.value)} className="w-8 h-9 border-0 cursor-pointer rounded-lg flex-shrink-0 bg-transparent" />
                                                                <Input value={sec.bg} onChange={e => handleUpdateSector(idx, 'bg', e.target.value)} />
                                                            </div>
                                                        </Field>
                                                    </div>
                                                    <div className="w-full md:w-1/3">
                                                        <Field label="Short description">
                                                            <textarea value={sec.desc} onChange={e => handleUpdateSector(idx, 'desc', e.target.value)} className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 px-3 py-2 text-slate-700 dark:text-slate-200 resize-none focus:outline-none" rows={1} />
                                                        </Field>
                                                    </div>
                                                    <button onClick={() => handleRemoveSector(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl self-end md:self-auto">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </SectionCard>
                            )}

                            {landingSubTab === 'integrations' && (
                                <SectionCard title="Integrated Systems and Portals">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-slate-400">List of governmental digital frameworks currently linked to the system.</p>
                                        <button onClick={handleAddIntegration} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-650">
                                            <Plus className="h-3.5 w-3.5" /> Add
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {settings.landing_body_integrations.map((item, idx) => (
                                            <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/30 flex gap-3 items-center">
                                                <div className="w-24">
                                                    <Field label="System Code">
                                                        <Input value={item.abbr} onChange={e => handleUpdateIntegration(idx, 'abbr', e.target.value)} />
                                                    </Field>
                                                </div>
                                                <div className="flex-1">
                                                    <Field label="Full Agency System Name">
                                                        <Input value={item.full} onChange={e => handleUpdateIntegration(idx, 'full', e.target.value)} />
                                                    </Field>
                                                </div>
                                                <button onClick={() => handleRemoveIntegration(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl mt-4">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            )}
                        </div>
                    )}

                    {activeTab === 'faqs' && (
                        <SectionCard title="Frequently Asked Questions (FAQ) Directory">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-slate-400">These will appear inside an accordion drawer at the bottom section of the homepage.</p>
                                <button onClick={handleAddFAQ} className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-755 text-white px-3.5 py-2 rounded-xl transition-all">
                                    <Plus className="h-4 w-4" /> Add Question
                                </button>
                            </div>

                            <div className="space-y-5">
                                {settings.landing_faqs.map((faq, idx) => (
                                    <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-3xl p-5 bg-slate-50/30 dark:bg-slate-800/20 space-y-4">
                                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex-1 w-full">
                                                <Field label={`Question #${idx + 1}`}>
                                                    <Input value={faq.question} onChange={e => handleUpdateFAQ(idx, 'question', e.target.value)} placeholder="Type standard question..." />
                                                </Field>
                                            </div>
                                            <div className="flex items-center gap-4 self-end sm:self-auto">
                                                {/* On/Off Toggle exact matching style in screenshot */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                                                    <button
                                                        onClick={() => handleUpdateFAQ(idx, 'is_active', !faq.is_active)}
                                                        className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                                            ${faq.is_active ? 'bg-indigo-650' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                    >
                                                        <span className="sr-only">Toggle Status</span>
                                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                            ${faq.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                    <span className="text-xs font-black text-indigo-600 uppercase w-8">{faq.is_active ? 'On' : 'Off'}</span>
                                                </div>
                                                <button onClick={() => handleRemoveFAQ(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <Field label="Answer Text">
                                            <textarea value={faq.answer} onChange={e => handleUpdateFAQ(idx, 'answer', e.target.value)} className="w-full text-sm rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 px-4 py-2.5 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none" rows={3} placeholder="Provide official system answer description..." />
                                        </Field>
                                    </div>
                                ))}

                                {settings.landing_faqs.length === 0 && (
                                    <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-750 rounded-3xl">
                                        <p className="text-sm text-slate-400">No FAQ blocks registered. Click "Add Question" to begin.</p>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    )}

                    {activeTab === 'pages' && (
                        <div className="space-y-6">
                            {/* Sub-tabs header menu */}
                            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                                {['layout', 'sections', 'pages_list', 'defaults'].map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => { setPageSubTab(sub); setEditingSection(null); setEditingPage(null); }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider
                                            ${pageSubTab === sub 
                                                ? 'bg-indigo-600 text-white shadow-md' 
                                                : 'bg-white dark:bg-slate-800 text-slate-650 hover:bg-slate-50'}`}
                                    >
                                        {sub === 'layout' && 'Landing Layout'}
                                        {sub === 'sections' && 'Custom Sections'}
                                        {sub === 'pages_list' && 'Custom Pages'}
                                        {sub === 'defaults' && 'Defaults'}
                                    </button>
                                ))}
                            </div>

                            {/* 1. LANDING LAYOUT SUB-TAB */}
                            {pageSubTab === 'layout' && (
                                <SectionCard title="Landing Page Layout Builder">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                        <p className="text-xs text-slate-400">Toggle visibility or re-order sections dynamically to build your preferred landing page sequence.</p>
                                        
                                        {/* Dropdown to add custom sections if any are defined */}
                                        {(settings.landing_page_settings.custom_sections || []).length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <select id="add-sec-select" className="text-xs rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 px-3 py-2 text-slate-700 dark:text-slate-200">
                                                    <option value="">-- Add Custom Block --</option>
                                                    {(settings.landing_page_settings.custom_sections || []).map(cs => (
                                                        <option key={cs.id} value={cs.id}>{cs.name}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    onClick={() => {
                                                        const el = document.getElementById('add-sec-select');
                                                        const val = el?.value;
                                                        if (val) {
                                                            const name = (settings.landing_page_settings.custom_sections || []).find(x => x.id === val)?.name;
                                                            if (name) addSectionToLayout(val, name);
                                                        }
                                                    }}
                                                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {(settings.landing_page_settings.sections_order || [
                                            {id: "hero", name: "Hero Slideshow", enabled: settings.landing_page_settings.show_hero_slideshow !== false},
                                            {id: "map", name: "Bhutan Energy by Dzongkhag (Map)", enabled: settings.landing_page_settings.show_bhutan_map !== false},
                                            {id: "sankey", name: "Energy Sankey Diagram", enabled: settings.landing_page_settings.show_sankey_diagram !== false},
                                            {id: "trends", name: "Energy Trends 2010–2022", enabled: settings.landing_page_settings.show_energy_trends !== false},
                                            {id: "sectors", name: "All Energy Sectors", enabled: settings.landing_page_settings.show_sectors_grid !== false},
                                            {id: "faqs", name: "FAQs Accordions", enabled: settings.landing_page_settings.show_faqs !== false}
                                        ]).map((item, idx, arr) => (
                                            <div key={item.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/10 hover:shadow-sm transition-all duration-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button 
                                                            disabled={idx === 0} 
                                                            onClick={() => moveSectionOrder(idx, -1)}
                                                            className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 ${idx === 0 ? 'cursor-not-allowed' : ''}`}
                                                        >
                                                            <ArrowUp className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button 
                                                            disabled={idx === arr.length - 1} 
                                                            onClick={() => moveSectionOrder(idx, 1)}
                                                            className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 ${idx === arr.length - 1 ? 'cursor-not-allowed' : ''}`}
                                                        >
                                                            <ArrowDown className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{item.name}</h4>
                                                            {item.id.startsWith('sec_') && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">Custom</span>}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400">Position {idx + 1} of {arr.length}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleSectionOrder(idx)}
                                                        className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                                            ${item.enabled ? 'bg-indigo-650' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                            ${item.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                    {item.id.startsWith('sec_') && (
                                                        <button onClick={() => removeSectionFromLayout(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg">
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            )}

                            {/* 2. CUSTOM SECTIONS SUB-TAB */}
                            {pageSubTab === 'sections' && (
                                <div className="space-y-6">
                                    {!editingSection ? (
                                        <SectionCard title="Manage Custom Layout Blocks">
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="text-xs text-slate-400">Create re-usable layout sections containing rich content, banners, or card arrays.</p>
                                                <button 
                                                    onClick={() => setEditingSection({
                                                        isNew: true,
                                                        name: 'New Custom Block',
                                                        type: 'rich_text',
                                                        content: { title: '', subtitle: '', body: '', bg_color: '', cards: [], cta_text: '', cta_link: '' }
                                                    })}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 inline-flex items-center gap-1.5"
                                                >
                                                    <Plus className="h-4 w-4" /> Create Block
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(settings.landing_page_settings.custom_sections || []).map(sec => (
                                                    <div key={sec.id} className="border border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/10 p-5 flex flex-col justify-between gap-4">
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{sec.name}</h4>
                                                                <span className="text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 px-2.5 py-1 rounded-full">
                                                                    {sec.type === 'rich_text' && 'Rich Text'}
                                                                    {sec.type === 'feature_grid' && 'Feature Grid'}
                                                                    {sec.type === 'banner' && 'Banner'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{sec.content?.body || sec.content?.subtitle || 'No content description'}</p>
                                                        </div>
                                                        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700/50 pt-3">
                                                            <button 
                                                                onClick={() => setEditingSection({ ...sec, isNew: false })}
                                                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-200 inline-flex items-center gap-1"
                                                            >
                                                                <Edit2 className="h-3 w-3" /> Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteCustomSection(sec.id)}
                                                                className="px-3 py-1.5 bg-rose-50 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-100 inline-flex items-center gap-1"
                                                            >
                                                                <Trash2 className="h-3 w-3" /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {(settings.landing_page_settings.custom_sections || []).length === 0 && (
                                                    <div className="col-span-2 text-center py-12 border border-dashed border-slate-200 rounded-3xl">
                                                        <p className="text-sm text-slate-400">No custom sections defined yet. Click "Create Block" to add one.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </SectionCard>
                                    ) : (
                                        <SectionCard title={editingSection.isNew ? "Create Custom Layout Block" : `Edit Section - ${editingSection.name}`}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Field label="Section Display Name" required>
                                                    <Input value={editingSection.name} onChange={e => setEditingSection({ ...editingSection, name: e.target.value })} placeholder="Internal configuration identifier..." />
                                                </Field>
                                                <Field label="Block Render Type" required>
                                                    <Select 
                                                        disabled={!editingSection.isNew} 
                                                        value={editingSection.type} 
                                                        onChange={e => setEditingSection({ 
                                                            ...editingSection, 
                                                            type: e.target.value,
                                                            content: { title: '', subtitle: '', body: '', bg_color: '', cards: [], cta_text: '', cta_link: '' }
                                                        })}
                                                    >
                                                        <option value="rich_text">Rich Text & Information Block</option>
                                                        <option value="feature_grid">Feature Cards Matrix</option>
                                                        <option value="banner">Call-to-Action Banner</option>
                                                    </Select>
                                                </Field>
                                            </div>

                                            {/* RICH TEXT CONFIGURATION */}
                                            {editingSection.type === 'rich_text' && (
                                                <div className="space-y-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                                                    <Field label="Sub-header / Category Tag">
                                                        <Input value={editingSection.content.subtitle} onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, subtitle: e.target.value } })} placeholder="e.g. SYSTEM ANNOUNCEMENTS" />
                                                    </Field>
                                                    <Field label="Main Header Title">
                                                        <Input value={editingSection.content.title} onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, title: e.target.value } })} placeholder="Main heading displayed to users..." />
                                                    </Field>
                                                    <Field label="Information Body Text" required>
                                                        <textarea 
                                                            rows={6} 
                                                            value={editingSection.content.body} 
                                                            onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, body: e.target.value } })} 
                                                            className="w-full text-sm rounded-xl bg-slate-50 dark:bg-slate-755 border border-slate-200 dark:border-slate-650 px-4 py-2.5 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none"
                                                            placeholder="Type description content..."
                                                        />
                                                    </Field>
                                                </div>
                                            )}

                                            {/* CALL TO ACTION BANNER */}
                                            {editingSection.type === 'banner' && (
                                                <div className="space-y-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                                                    <Field label="Banner Primary Title">
                                                        <Input value={editingSection.content.title} onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, title: e.target.value } })} placeholder="Big Title..." />
                                                    </Field>
                                                    <Field label="Subtitle Description text">
                                                        <Input value={editingSection.content.subtitle} onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, subtitle: e.target.value } })} placeholder="Brief line..." />
                                                    </Field>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <Field label="Button CTA Text">
                                                            <Input value={editingSection.content.cta_text} onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, cta_text: e.target.value } })} placeholder="e.g. Register Now" />
                                                        </Field>
                                                        <Field label="Button Target Route">
                                                            <Input value={editingSection.content.cta_link} onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, cta_link: e.target.value } })} placeholder="e.g. /public" />
                                                        </Field>
                                                        <Field label="Custom Background Color CSS">
                                                            <Input value={editingSection.content.bg_color} onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, bg_color: e.target.value } })} placeholder="e.g. linear-gradient(135deg, #15803d, #166534)" />
                                                        </Field>
                                                    </div>
                                                </div>
                                            )}

                                            {/* FEATURE CARDS MATRIX */}
                                            {editingSection.type === 'feature_grid' && (
                                                <div className="space-y-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                                                    <Field label="Matrix Header Title">
                                                        <Input value={editingSection.content.title} onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, title: e.target.value } })} placeholder="Section Header title..." />
                                                    </Field>
                                                    <Field label="Matrix Subtitle Category">
                                                        <Input value={editingSection.content.subtitle} onChange={e => setEditingSection({ ...editingSection, content: { ...editingSection.content, subtitle: e.target.value } })} placeholder="e.g. KEY METRICS" />
                                                    </Field>
                                                    
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <h5 className="text-xs font-bold text-slate-500 uppercase">Interactive Grid Cards</h5>
                                                            <button 
                                                                onClick={addCard}
                                                                className="text-xs font-bold text-indigo-650 inline-flex items-center gap-1"
                                                            >
                                                                <Plus className="h-3 w-3" /> Add Card
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {(editingSection.content.cards || []).map((card, cidx) => (
                                                                <div key={cidx} className="border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3 relative bg-slate-50/40">
                                                                    <button 
                                                                        onClick={() => deleteCard(cidx)}
                                                                        className="absolute top-2 right-2 p-1 text-rose-500 hover:bg-rose-50 rounded"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <Field label="Card Label">
                                                                            <Input value={card.label} onChange={e => updateCardField(cidx, 'label', e.target.value)} />
                                                                        </Field>
                                                                        <Field label="Card Icon">
                                                                            <Select value={card.icon} onChange={e => updateCardField(cidx, 'icon', e.target.value)}>
                                                                                {Object.keys(ICON_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                                                                            </Select>
                                                                        </Field>
                                                                    </div>
                                                                    <Field label="Card Description">
                                                                        <Input value={card.desc} onChange={e => updateCardField(cidx, 'desc', e.target.value)} />
                                                                    </Field>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <Field label="Hex Color">
                                                                            <Input value={card.color} onChange={e => updateCardField(cidx, 'color', e.target.value)} />
                                                                        </Field>
                                                                        <Field label="Target Route">
                                                                            <Input value={card.link} onChange={e => updateCardField(cidx, 'link', e.target.value)} />
                                                                        </Field>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-6">
                                                <button onClick={() => setEditingSection(null)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200">
                                                    Cancel
                                                </button>
                                                <button onClick={handleSaveCustomSection} className="px-4 py-2 bg-indigo-650 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">
                                                    Apply Changes
                                                </button>
                                            </div>
                                        </SectionCard>
                                    )}
                                </div>
                            )}

                            {/* 3. CUSTOM PAGES SUB-TAB — Full Page Builder */}
                            {pageSubTab === 'pages_list' && (
                                <div className="space-y-6">
                                    {!editingPage ? (
                                        /* ── PAGE LIST VIEW ─────────────────────────────────── */
                                        <div>
                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                <div>
                                                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Custom Pages</h3>
                                                    <p className="text-xs text-slate-400 mt-0.5">Each page has its own URL at <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600">/page/&lt;slug&gt;</code> and can use any combination of sections.</p>
                                                </div>
                                                <button
                                                    onClick={() => setEditingPage({
                                                        isNew: true,
                                                        title: '',
                                                        slug: '',
                                                        description: '',
                                                        sections_order: []
                                                    })}
                                                    className="flex-shrink-0 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                                                >
                                                    <Plus className="h-4 w-4" /> Create New Page
                                                </button>
                                            </div>

                                            {/* Page cards */}
                                            {(settings.landing_page_settings.custom_pages || []).length === 0 ? (
                                                <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/30">
                                                    <div className="text-5xl mb-4">📄</div>
                                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No custom pages yet</p>
                                                    <p className="text-xs text-slate-400 mt-1 mb-6">Create a page and pick which sections to display on it.</p>
                                                    <button
                                                        onClick={() => setEditingPage({ isNew: true, title: '', slug: '', description: '', sections_order: [] })}
                                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 inline-flex items-center gap-2"
                                                    >
                                                        <Plus className="h-4 w-4" /> Create Your First Page
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                                    {(settings.landing_page_settings.custom_pages || []).map(p => {
                                                        const activeSecs = (p.sections_order || []).filter(s => s.enabled !== false);
                                                        const totalSecs = (p.sections_order || []).length;
                                                        return (
                                                            <div key={p.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                                                {/* Color bar */}
                                                                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                                                                <div className="p-5">
                                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                                        <div>
                                                                            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-tight">{p.title}</h4>
                                                                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                                                <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">/page/{p.slug}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {/* Section pills */}
                                                                    <div className="flex flex-wrap gap-1.5 mb-4 min-h-[32px]">
                                                                        {(p.sections_order || []).slice(0, 5).map(s => {
                                                                            const def = ALL_SECTIONS.find(x => x.id === s.id);
                                                                            return (
                                                                                <span key={s.id}
                                                                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                                                                        s.enabled !== false
                                                                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border-emerald-200 dark:border-emerald-800'
                                                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 line-through'
                                                                                    }`}>
                                                                                    {def?.icon} {def?.name || s.name}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                        {totalSecs > 5 && <span className="text-[9px] font-bold text-slate-400">+{totalSecs - 5} more</span>}
                                                                        {totalSecs === 0 && <span className="text-[10px] text-slate-400 italic">No sections added</span>}
                                                                    </div>
                                                                    {/* Stats row */}
                                                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-4">
                                                                        <span className="font-semibold">{totalSecs} sections</span>
                                                                        <span>·</span>
                                                                        <span className="font-semibold text-emerald-600">{activeSecs.length} active</span>
                                                                    </div>
                                                                    {/* Actions */}
                                                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                                                        <button
                                                                            onClick={() => setEditingPage({ ...p, isNew: false })}
                                                                            className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl hover:bg-indigo-100 inline-flex items-center justify-center gap-1.5 transition-all"
                                                                        >
                                                                            <Edit2 className="h-3 w-3" /> Edit Layout
                                                                        </button>
                                                                        <a
                                                                            href={`/page/${p.slug}`} target="_blank" rel="noopener noreferrer"
                                                                            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 inline-flex items-center gap-1 transition-all"
                                                                        >
                                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                                        </a>
                                                                        <button
                                                                            onClick={() => { if(window.confirm(`Delete "${p.title}"?`)) handleDeleteCustomPage(p.id); }}
                                                                            className="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-bold rounded-xl hover:bg-rose-100 inline-flex items-center gap-1 transition-all"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* ── PAGE BUILDER VIEW ─────────────────────────────── */
                                        <div>
                                            {/* Builder Header */}
                                            <div className="flex items-center gap-3 mb-6">
                                                <button onClick={() => setEditingPage(null)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all">
                                                    <ArrowUp className="h-4 w-4 rotate-[-90deg]" />
                                                </button>
                                                <div>
                                                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                                                        {editingPage.isNew ? '✨ Create New Page' : `🔨 Editing: ${editingPage.title}`}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">Pick sections, reorder them, toggle on/off — then save.</p>
                                                </div>
                                            </div>

                                            {/* Two-column builder */}
                                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">

                                                {/* LEFT: Metadata + Section Picker + Order */}
                                                <div className="xl:col-span-3 space-y-5">

                                                    {/* Page Metadata */}
                                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                                                        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">Page Details</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <Field label="Page Title" required>
                                                                <Input
                                                                    value={editingPage.title}
                                                                    onChange={e => setEditingPage(p => ({ ...p, title: e.target.value }))}
                                                                    placeholder="e.g. Bhutan Energy Overview"
                                                                />
                                                            </Field>
                                                            <Field label="URL Slug" required hint="Will be at /page/<slug>">
                                                                <div className="flex items-center">
                                                                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 border border-r-0 border-slate-200 dark:border-slate-600 rounded-l-xl px-3 py-2.5 font-mono">/page/</span>
                                                                    <input
                                                                        value={editingPage.slug}
                                                                        onChange={e => setEditingPage(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') }))}
                                                                        placeholder="energy-overview"
                                                                        className="flex-1 rounded-r-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                                                    />
                                                                </div>
                                                            </Field>
                                                        </div>
                                                    </div>

                                                    {/* Section Picker */}
                                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Available Sections</h4>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">Click a section to add it to your page</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-semibold">
                                                                    {(editingPage.sections_order || []).length} added
                                                                </span>
                                                                <button
                                                                    onClick={() => { setBlockBuilderInitial(null); setBlockBuilderOpen(true); }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
                                                                >
                                                                    <Plus className="h-3 w-3" /> Create Visualization Block
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {[
                                                                ...ALL_SECTIONS,
                                                                ...(settings.landing_page_settings.custom_sections || []).map(cs => {
                                                                    const bt = BLOCK_TYPES.find(b => b.id === cs.type);
                                                                    return {
                                                                        id: cs.id,
                                                                        name: cs.name,
                                                                        icon: cs.icon || bt?.icon || (cs.type === 'rich_text' ? '📝' : cs.type === 'banner' ? '🏷️' : '🃏'),
                                                                        desc: cs.description || cs.content?.subtitle || cs.content?.body?.slice(0, 60) || bt?.desc || 'Custom block',
                                                                        color: cs.color || bt?.color || '#6366f1',
                                                                        isCustom: true,
                                                                        blockType: cs.type,
                                                                        onEdit: () => { setBlockBuilderInitial(cs.config || cs); setBlockBuilderOpen(true); }
                                                                    };
                                                                })
                                                            ].map(sec => {
                                                                const alreadyAdded = (editingPage.sections_order || []).some(x => x.id === sec.id);
                                                                return (
                                                                    <button
                                                                        key={sec.id}
                                                                        onClick={() => {
                                                                            if (alreadyAdded) {
                                                                                setToast({ message: `"${sec.name}" is already on this page`, type: 'error' });
                                                                                return;
                                                                            }
                                                                            addSectionToPageLayout(sec.id, sec.name);
                                                                        }}
                                                                        className={`text-left p-3.5 rounded-2xl border-2 transition-all duration-200 group ${
                                                                            alreadyAdded
                                                                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 cursor-default'
                                                                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 bg-slate-50 dark:bg-slate-800/50'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                            <span className="text-xl">{sec.icon}</span>
                                                                            {alreadyAdded
                                                                                ? <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded-full">✓ Added</span>
                                                                                : <Plus className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                                            }
                                                                        </div>
                                                                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight">{sec.name}</p>
                                                                        <p className="text-[9px] text-slate-400 mt-0.5 leading-tight line-clamp-2">{sec.desc}</p>
                                                                        {sec.isCustom && <span className="mt-1.5 inline-block text-[8px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">Custom</span>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Current Section Order */}
                                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                                                        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">Page Section Order</h4>
                                                        {(editingPage.sections_order || []).length === 0 ? (
                                                            <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                                                <p className="text-3xl mb-2">👆</p>
                                                                <p className="text-xs text-slate-400">Click sections above to add them to this page</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {(editingPage.sections_order || []).map((item, idx, arr) => {
                                                                    const def = ALL_SECTIONS.find(x => x.id === item.id);
                                                                    return (
                                                                        <div
                                                                            key={item.id + idx}
                                                                            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                                                                                item.enabled !== false
                                                                                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 opacity-60'
                                                                            }`}
                                                                        >
                                                                            {/* Position badge */}
                                                                            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black flex items-center justify-center">
                                                                                {idx + 1}
                                                                            </span>
                                                                            {/* Icon + name */}
                                                                            <span className="text-lg flex-shrink-0">{def?.icon || '📦'}</span>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                                                                                <p className="text-[9px] text-slate-400">
                                                                                    {item.enabled !== false ? '● Visible' : '○ Hidden'}
                                                                                </p>
                                                                            </div>
                                                                            {/* Controls */}
                                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                                {/* Up */}
                                                                                <button
                                                                                    disabled={idx === 0}
                                                                                    onClick={() => movePageSectionOrder(idx, -1)}
                                                                                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 transition-all"
                                                                                    title="Move up"
                                                                                >
                                                                                    <ArrowUp className="h-3.5 w-3.5" />
                                                                                </button>
                                                                                {/* Down */}
                                                                                <button
                                                                                    disabled={idx === arr.length - 1}
                                                                                    onClick={() => movePageSectionOrder(idx, 1)}
                                                                                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 transition-all"
                                                                                    title="Move down"
                                                                                >
                                                                                    <ArrowDown className="h-3.5 w-3.5" />
                                                                                </button>
                                                                                {/* Toggle visible */}
                                                                                <button
                                                                                    onClick={() => togglePageSectionOrder(idx)}
                                                                                    className={`p-1.5 rounded-lg transition-all ${
                                                                                        item.enabled !== false
                                                                                            ? 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                                                                            : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                                                    }`}
                                                                                    title={item.enabled !== false ? 'Hide section' : 'Show section'}
                                                                                >
                                                                                    {item.enabled !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                                                                </button>
                                                                                {/* Remove */}
                                                                                <button
                                                                                    onClick={() => removeSectionFromPageLayout(idx)}
                                                                                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                                                                    title="Remove from page"
                                                                                >
                                                                                    <X className="h-3.5 w-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* RIGHT: Live Preview Panel */}
                                                <div className="xl:col-span-2">
                                                    <div className="sticky top-24 space-y-4">
                                                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                                            {/* Preview header */}
                                                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="h-3 w-3 rounded-full bg-rose-400"/>
                                                                    <span className="h-3 w-3 rounded-full bg-amber-400"/>
                                                                    <span className="h-3 w-3 rounded-full bg-emerald-400"/>
                                                                    <span className="ml-2 text-[10px] text-slate-400 font-mono truncate">/page/{editingPage.slug || 'your-slug'}</span>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Page Preview</p>
                                                                <p className="text-sm font-extrabold text-white mt-0.5 truncate">{editingPage.title || 'Untitled Page'}</p>
                                                            </div>

                                                            {/* Section stack preview */}
                                                            <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
                                                                {(editingPage.sections_order || []).length === 0 ? (
                                                                    <div className="text-center py-10">
                                                                        <p className="text-3xl mb-2">🏗️</p>
                                                                        <p className="text-xs text-slate-400">Add sections to see preview</p>
                                                                    </div>
                                                                ) : (
                                                                    (editingPage.sections_order || []).map((item, idx) => {
                                                                        const def = ALL_SECTIONS.find(x => x.id === item.id);
                                                                        const isVisible = item.enabled !== false;
                                                                        return (
                                                                            <div
                                                                                key={item.id + idx}
                                                                                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                                                                                    isVisible
                                                                                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30'
                                                                                        : 'border-slate-200 dark:border-slate-700 bg-slate-100/60 opacity-50'
                                                                                }`}
                                                                            >
                                                                                <span className="text-base flex-shrink-0">{def?.icon || '📦'}</span>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                                                                                    <p className="text-[9px] text-slate-400 truncate">{def?.desc || ''}</p>
                                                                                </div>
                                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                                                                    isVisible
                                                                                        ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50'
                                                                                        : 'text-slate-400 bg-slate-200'
                                                                                }`}>
                                                                                    {isVisible ? 'ON' : 'OFF'}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>

                                                            {/* Summary row */}
                                                            {(editingPage.sections_order || []).length > 0 && (
                                                                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                                                                    <span className="text-[10px] text-slate-500">
                                                                        {(editingPage.sections_order || []).filter(s => s.enabled !== false).length} of {(editingPage.sections_order || []).length} sections visible
                                                                    </span>
                                                                    {editingPage.slug && !editingPage.isNew && (
                                                                        <a
                                                                            href={`/page/${editingPage.slug}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-[10px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                                                                        >
                                                                            Open Live <ExternalLink className="h-3 w-3" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Save / Cancel */}
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => setEditingPage(null)}
                                                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={handleSaveCustomPage}
                                                                className="flex-1 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-2xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-1.5"
                                                            >
                                                                <Check className="h-3.5 w-3.5" /> Save Page
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 text-center">Remember to click <strong>Save Changes</strong> in the top bar to persist to the server.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 4. GENERAL INTERACTIVE DEFAULTS TAB */}
                            {pageSubTab === 'defaults' && (
                                <SectionCard title="General Interactive Defaults">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Field label="Slideshow transition duration (ms)">
                                            <Input type="number" value={settings.landing_page_settings.hero_transition_speed || 4500} onChange={e => updatePageField('hero_transition_speed', parseInt(e.target.value) || 4500)} />
                                        </Field>
                                        <Field label="Map initial year select">
                                            <Select value={settings.landing_page_settings.map_default_year || '2024'} onChange={e => updatePageField('map_default_year', e.target.value)}>
                                                <option value="2024">2024</option>
                                                <option value="2022">2022</option>
                                                <option value="2020">2020</option>
                                            </Select>
                                        </Field>
                                        <Field label="Sankey initial year select">
                                            <Select value={settings.landing_page_settings.sankey_default_year || '2024'} onChange={e => updatePageField('sankey_default_year', e.target.value)}>
                                                <option value="2024">2024</option>
                                                <option value="2022">2022</option>
                                                <option value="2020">2020</option>
                                            </Select>
                                        </Field>
                                    </div>
                                </SectionCard>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* ── Visualization Block Builder Drawer ── */}
            <BlockBuilder
                blockTypes={BLOCK_TYPES}
                open={blockBuilderOpen}
                onClose={() => { setBlockBuilderOpen(false); setBlockBuilderInitial(null); }}
                onSave={handleSaveVisualizationBlock}
                initialBlock={blockBuilderInitial}
            />
        </DashboardLayout>
    );
}
