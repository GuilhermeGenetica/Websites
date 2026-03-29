/**
 * user-profile/index.jsx — User profile and security modal
 *
 * Connects to the PHP backend at AUTH_URL (/api) to:
 * - Load and update profile data
 * - Change password
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { AUTH_URL } from "../../config.js";

// ── Authenticated fetch helper ────────────────────────────────────────────────
async function authFetch(path, options = {}) {
    const token = localStorage.getItem("seqnode_access_token");
    const res = await fetch(AUTH_URL + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

// ── DiceBear Avatar Picker ────────────────────────────────────────────────────
const DICEBEAR_BASE = "https://api.dicebear.com/9.x";

const AVATAR_STYLES = [
    { id: "avataaars",  label: "Avataaars" },
    { id: "bottts",     label: "Bottts"    },
    { id: "fun-emoji",  label: "Emoji"     },
    { id: "lorelei",    label: "Lorelei"   },
    { id: "micah",      label: "Micah"     },
    { id: "pixel-art",  label: "Pixel Art" },
    { id: "adventurer", label: "Adventure" },
    { id: "notionists", label: "Notionists"},
    { id: "big-smile",  label: "Big Smile" },
    { id: "miniavs",    label: "Miniavs"   },
    { id: "open-peeps", label: "Open Peeps"},
    { id: "thumbs",     label: "Thumbs"    },
    { id: "rings",      label: "Rings"     },
    { id: "bottts-neutral", label: "Bottts N."},
];

const SEED_POOL = [
    "Felix","Lily","Alex","Sam","Jordan","Casey","Morgan","Riley","Quinn","Drew",
    "Sage","Avery","Blake","Cameron","Dana","Eden","Finley","Gray","Harper","Indigo",
    "Jesse","Kai","Lee","Mika","Nova","Orion","Piper","Rowan","Skyler","Taylor",
    "Uma","Vale","Wren","Xen","Yuki","Zara","Ace","Bay","Cleo","Dex",
];

function shuffleSeeds(n = 18) {
    const pool = [...SEED_POOL].sort(() => Math.random() - 0.5);
    return pool.slice(0, n);
}

function dicebearUrl(style, seed) {
    return `${DICEBEAR_BASE}/${style}/svg?seed=${encodeURIComponent(seed)}&size=256`;
}

function AvatarPicker({ currentUrl, onSelect, onClose }) {
    const [style,   setStyle]   = useState("avataaars");
    const [seeds,   setSeeds]   = useState(() => shuffleSeeds(18));
    const [hovered, setHovered] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div ref={ref} style={pickerStyles.overlay}>
            <div style={pickerStyles.styleTabs}>
                {AVATAR_STYLES.map(s => (
                    <button key={s.id}
                        style={{ ...pickerStyles.styleTab, ...(style === s.id ? pickerStyles.styleTabActive : {}) }}
                        onClick={() => setStyle(s.id)}>
                        {s.label}
                    </button>
                ))}
            </div>

            <div style={pickerStyles.grid}>
                {seeds.map(seed => {
                    const url = dicebearUrl(style, seed);
                    const selected = currentUrl === url;
                    const isHov = hovered === seed;
                    return (
                        <button key={seed}
                            title={seed}
                            style={{
                                ...pickerStyles.cell,
                                ...(selected ? pickerStyles.cellSelected : {}),
                                ...(isHov && !selected ? pickerStyles.cellHover : {}),
                            }}
                            onMouseEnter={() => setHovered(seed)}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => { onSelect(url); onClose(); }}>
                            <img src={url} alt={seed} style={pickerStyles.cellImg}
                                loading="lazy" />
                        </button>
                    );
                })}
            </div>

            <div style={pickerStyles.foot}>
                <button style={pickerStyles.shuffleBtn} onClick={() => setSeeds(shuffleSeeds(18))}>
                    &#x21BA; Shuffle
                </button>
                <button style={pickerStyles.closeBtn} onClick={onClose}>
                    &#x2715; Close
                </button>
            </div>
        </div>
    );
}

const pickerStyles = {
    overlay: {
        position: "absolute",
        top: 0, 
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        zIndex: 200,
        background: "var(--bg-secondary, #1f2937)",
        border: "1px solid var(--border, #374151)",
        borderRadius: 10,
        boxShadow: "0 12px 48px rgba(0,0,0,.6)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxHeight: "min(600px, 90vh)",
        overflowY: "auto",
        boxSizing: "border-box",
    },
    styleTabs: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        paddingBottom: 4,
    },
    styleTab: {
        padding: "6px 10px",
        fontSize: 11,
        fontWeight: 500,
        background: "var(--bg-tertiary, #111827)",
        border: "1px solid var(--border, #374151)",
        borderRadius: 6,
        color: "var(--text-muted, #9ca3af)",
        cursor: "pointer",
        transition: "all .2s",
    },
    styleTabActive: {
        background: "var(--accent, #3b82f6)",
        borderColor: "var(--accent, #3b82f6)",
        color: "#fff",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
        gap: 4,
        width: "100%",
    },
    cell: {
        padding: 0,
        margin: 0,
        width: "100%",
        height: "100%",
        aspectRatio: "1 / 1",
        background: "var(--bg-tertiary, #111827)",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        display: "block",
        transition: "all .15s ease-in-out",
        overflow: "hidden",
        boxSizing: "border-box",
        position: "relative",
    },
    cellSelected: {
        outline: "3px solid var(--accent, #3b82f6)",
        outlineOffset: "-3px",
        zIndex: 2,
    },
    cellHover: {
        outline: "3px solid var(--border-hover, #6b7280)",
        outlineOffset: "-3px",
        transform: "scale(1.02)",
        zIndex: 1,
    },
    cellImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    foot: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
    },
    shuffleBtn: {
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 600,
        background: "var(--bg-tertiary, #111827)",
        border: "1px solid var(--border, #374151)",
        borderRadius: 6,
        color: "var(--text, #e5e7eb)",
        cursor: "pointer",
    },
    closeBtn: {
        padding: "8px 16px",
        fontSize: 12,
        background: "transparent",
        border: "1px solid var(--border, #374151)",
        borderRadius: 6,
        color: "var(--text-muted, #9ca3af)",
        cursor: "pointer",
    },
};

// ── Grouped profile fields ────────────────────────────────────────────────────
const PROFILE_GROUPS = [
    {
        label: "Basic Information",
        fields: [
            { key: "full_name",    label: "Full Name",     type: "text",  required: true },
            { key: "display_name", label: "Display Name",  type: "text"  },
            { key: "bio",          label: "Bio",           type: "textarea" },
        ],
    },
    {
        label: "Professional Information",
        fields: [
            { key: "role", label: "User Type", type: "select",
              options: [
                { value: "",                label: "— Select —" },
                { value: "researcher",      label: "Researcher" },
                { value: "physician",       label: "Physician" },
                { value: "bioinformatician",label: "Bioinformatician" },
                { value: "student",         label: "Student" },
                { value: "university_staff",label: "University Staff" },
                { value: "institution",     label: "Institution" },
              ]
            },
            { key: "institution", label: "Institution / University", type: "text" },
            { key: "department",  label: "Department / Division",    type: "text" },
            { key: "position",    label: "Position / Role",          type: "text" },
            { key: "specialty",   label: "Specialty / Expertise",     type: "text" },
            { key: "crm",         label: "Order Registration Number",  type: "text" },
            { key: "orcid",       label: "ORCID",                    type: "text", placeholder: "0000-0000-0000-0000" },
        ],
    },
    {
        label: "Contact",
        fields: [
            { key: "phone",   label: "Phone",   type: "text" },
            { key: "country", label: "Country", type: "text" },
            { key: "city",    label: "City",    type: "text" },
            { key: "website", label: "Website", type: "url" },
        ],
    },
];

// ── Main component ────────────────────────────────────────────────────────────
export function UserProfileModal({ store, closeModal, hideFooter = false }) {
    const [tab,     setTab]    = useState("profile");
    const [profile, setProfile] = useState(null);
    const [form,    setForm]    = useState({});
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [msg,     setMsg]     = useState(null);

    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    const [pwForm, setPwForm] = useState({ current_password: "", password: "", password_confirmation: "" });
    const [pwMsg,  setPwMsg]  = useState(null);
    const [pwSaving, setPwSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        authFetch("/user/profile")
            .then(res => {
                const u = res.data || res;
                setProfile(u);
                setForm({ ...u });
            })
            .catch(e => setMsg({ type: "err", text: e.message }))
            .finally(() => setLoading(false));
    }, []);

    const handleSaveProfile = useCallback(async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const res = await authFetch("/user/profile", {
                method: "PUT",
                body: JSON.stringify(form),
            });
            const updated = res.data || res;
            setProfile(updated);
            setForm({ ...updated });
            store.getState().setAuthUser(updated);
            setMsg({ type: "ok", text: "Profile saved successfully." });
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        } finally {
            setSaving(false);
        }
    }, [form, store]);

    const handleChangePassword = useCallback(async (e) => {
        e.preventDefault();
        if (pwForm.password !== pwForm.password_confirmation) {
            setPwMsg({ type: "err", text: "Passwords do not match." });
            return;
        }
        if (pwForm.password.length < 8) {
            setPwMsg({ type: "err", text: "Password must be at least 8 characters." });
            return;
        }
        setPwSaving(true);
        setPwMsg(null);
        try {
            await authFetch("/user/change-password", {
                method: "PUT",
                body: JSON.stringify(pwForm),
            });
            setPwMsg({ type: "ok", text: "Password changed. Active sessions on other devices will be terminated." });
            setPwForm({ current_password: "", password: "", password_confirmation: "" });
        } catch (e) {
            setPwMsg({ type: "err", text: e.message });
        } finally {
            setPwSaving(false);
        }
    }, [pwForm]);

    const field = (key, value) => setForm(f => ({ ...f, [key]: value }));

    return (
        <div style={styles.root}>
            <div style={styles.tabs}>
                <button style={{ ...styles.tab, ...(tab === "profile"  ? styles.tabActive : {}) }}
                    onClick={() => setTab("profile")}>Profile</button>
                <button style={{ ...styles.tab, ...(tab === "security" ? styles.tabActive : {}) }}
                    onClick={() => setTab("security")}>Security</button>
            </div>

            {tab === "profile" && (
                <div style={styles.body}>
                    {loading && <p style={styles.muted}>Loading profile…</p>}

                    {!loading && (
                        <form id="user-profile-form" onSubmit={handleSaveProfile}>
                            <div style={{ position: "relative" }}>
                                <div style={styles.avatarRow}>
                                    <div
                                        style={{ ...styles.avatar, cursor: "pointer", outline: showAvatarPicker ? "2px solid var(--accent,#3b82f6)" : "none" }}
                                        title="Click to choose avatar"
                                        onClick={() => setShowAvatarPicker(v => !v)}>
                                        {form.avatar_url
                                            ? <img src={form.avatar_url} alt="avatar" style={styles.avatarImg} />
                                            : <span style={styles.avatarInitial}>
                                                {(form.full_name || "U")[0].toUpperCase()}
                                              </span>
                                        }
                                        <span style={styles.avatarEditBadge}>&#x270E;</span>
                                    </div>
                                    <div>
                                        <div style={styles.emailBadge}>{profile?.email}</div>
                                        <div style={styles.planBadge}>
                                            Plan: <strong>{profile?.plan || "free"}</strong>
                                            {profile?.role && <> &middot; {profile.role}</>}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted,#9ca3af)", marginTop: 4 }}>
                                            Click the avatar to choose from gallery
                                        </div>
                                    </div>
                                </div>

                                {showAvatarPicker && (
                                    <AvatarPicker
                                        currentUrl={form.avatar_url || ""}
                                        onSelect={url => field("avatar_url", url)}
                                        onClose={() => setShowAvatarPicker(false)}
                                    />
                                )}
                            </div>

                            <div style={styles.fieldRow}>
                                <label style={styles.label}>Avatar URL</label>
                                <input style={styles.input} type="url" value={form.avatar_url || ""}
                                    placeholder="https://..." onChange={e => field("avatar_url", e.target.value)} />
                            </div>

                            {PROFILE_GROUPS.map(group => (
                                <div key={group.label} style={styles.group}>
                                    <div style={styles.groupLabel}>{group.label}</div>
                                    {group.fields.map(f => (
                                        <div key={f.key} style={styles.fieldRow}>
                                            <label style={styles.label}>
                                                {f.label}{f.required && <span style={styles.req}> *</span>}
                                            </label>
                                            {f.type === "textarea" ? (
                                                <textarea style={{ ...styles.input, height: 72, resize: "vertical" }}
                                                    value={form[f.key] || ""}
                                                    onChange={e => field(f.key, e.target.value)} />
                                            ) : f.type === "select" ? (
                                                <select style={styles.input} value={form[f.key] || ""}
                                                    onChange={e => field(f.key, e.target.value)}>
                                                    {f.options.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input style={styles.input} type={f.type || "text"}
                                                    value={form[f.key] || ""}
                                                    placeholder={f.placeholder || ""}
                                                    required={f.required}
                                                    onChange={e => field(f.key, e.target.value)} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {msg && <Feedback msg={msg} />}

                            {!hideFooter && (
                            <div style={styles.footer}>
                                <button type="button" style={styles.btnSecondary} onClick={closeModal}>Close</button>
                                <button type="submit" style={styles.btnPrimary} disabled={saving}>
                                    {saving ? "Saving…" : "Save Profile"}
                                </button>
                            </div>
                            )}
                        </form>
                    )}
                </div>
            )}

            {tab === "security" && (
                <div style={styles.body}>
                    <form onSubmit={handleChangePassword}>
                        <div style={styles.group}>
                            <div style={styles.groupLabel}>Change Password</div>

                            {[
                                { key: "current_password",      label: "Current Password" },
                                { key: "password",              label: "New Password" },
                                { key: "password_confirmation", label: "Confirm New Password" },
                            ].map(f => (
                                <div key={f.key} style={styles.fieldRow}>
                                    <label style={styles.label}>{f.label}</label>
                                    <input style={styles.input} type="password"
                                        value={pwForm[f.key]}
                                        autoComplete={f.key === "current_password" ? "current-password" : "new-password"}
                                        onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                </div>
                            ))}

                            <p style={styles.hint}>
                                Password must be at least 8 characters. After changing, all active sessions on other devices will be terminated.
                            </p>
                        </div>

                        {pwMsg && <Feedback msg={pwMsg} />}

                        <div style={styles.footer}>
                            {!hideFooter && (
                                <button type="button" style={styles.btnSecondary} onClick={closeModal}>Close</button>
                            )}
                            <button type="submit" style={styles.btnPrimary} disabled={pwSaving}>
                                {pwSaving ? "Changing…" : "Change Password"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function Feedback({ msg }) {
    return (
        <div style={{
            margin: "10px 0",
            padding: "8px 12px",
            borderRadius: 5,
            fontSize: 13,
            background: msg.type === "ok" ? "var(--success-bg, #d1fae5)" : "var(--error-bg, #fee2e2)",
            color:      msg.type === "ok" ? "var(--success, #059669)"    : "var(--error, #dc2626)",
            border:     `1px solid ${msg.type === "ok" ? "var(--success, #059669)" : "var(--error, #dc2626)"}`,
        }}>
            {msg.text}
        </div>
    );
}

const styles = {
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: "min(480px, 95vw)",
        maxWidth: 620,
        color: "var(--text, #e5e7eb)",
    },
    tabs: {
        display: "flex",
        borderBottom: "1px solid var(--border, #374151)",
        marginBottom: 0,
    },
    tab: {
        padding: "9px 20px",
        background: "none",
        border: "none",
        borderBottom: "2px solid transparent",
        color: "var(--text-muted, #9ca3af)",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
    },
    tabActive: {
        borderBottomColor: "var(--accent, #3b82f6)",
        color: "var(--text, #e5e7eb)",
    },
    body: {
        overflowY: "auto",
        padding: "16px 20px",
        flex: 1,
    },
    avatarRow: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 16,
    },
    avatar: {
        position: "relative",
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: "var(--accent, #3b82f6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        flexShrink: 0,
    },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" },
    avatarInitial: { fontSize: 22, fontWeight: 700, color: "#fff" },
    avatarEditBadge: {
        position: "absolute",
        bottom: 0, right: 0,
        width: 18, height: 18,
        borderRadius: "50%",
        background: "var(--accent,#3b82f6)",
        color: "#fff",
        fontSize: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
    },
    emailBadge: { fontSize: 14, fontWeight: 600, color: "var(--text, #e5e7eb)" },
    planBadge:  { fontSize: 12, color: "var(--text-muted, #9ca3af)", marginTop: 2 },
    group: {
        marginBottom: 20,
        padding: "12px 14px",
        borderRadius: 7,
        background: "var(--bg-secondary, #1f2937)",
        border: "1px solid var(--border, #374151)",
    },
    groupLabel: {
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-muted, #9ca3af)",
        marginBottom: 10,
    },
    fieldRow: {
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        alignItems: "start",
        gap: "6px 10px",
        marginBottom: 8,
    },
    label: { fontSize: 13, paddingTop: 5, color: "var(--text, #e5e7eb)" },
    req:   { color: "var(--error, #dc2626)" },
    input: {
        width: "100%",
        padding: "5px 8px",
        background: "var(--bg-input, #111827)",
        border: "1px solid var(--border, #374151)",
        borderRadius: 5,
        color: "var(--text, #e5e7eb)",
        fontSize: 13,
        boxSizing: "border-box",
    },
    hint: {
        fontSize: 12,
        color: "var(--text-muted, #9ca3af)",
        margin: "6px 0",
        lineHeight: 1.5,
    },
    muted:  { color: "var(--text-muted, #9ca3af)", fontSize: 13 },
    footer: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        paddingTop: 12,
        borderTop: "1px solid var(--border, #374151)",
        marginTop: 12,
    },
    btnPrimary: {
        padding: "7px 18px",
        background: "var(--accent, #3b82f6)",
        color: "#fff",
        border: "none",
        borderRadius: 5,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
    },
    btnSecondary: {
        padding: "7px 18px",
        background: "var(--bg-secondary, #1f2937)",
        color: "var(--text, #e5e7eb)",
        border: "1px solid var(--border, #374151)",
        borderRadius: 5,
        cursor: "pointer",
        fontSize: 13,
    },
};