#!/usr/bin/env python3
"""Lead Gen Dashboard — Streamlit + Supabase · Apple-inspired design system."""

from __future__ import annotations

import base64
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import pandas as pd
import streamlit as st
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent / ".env")

ROOT = Path(__file__).parent
AUDITS_DIR = ROOT / "audits"
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
BRAND_NAME = os.getenv("BRAND_NAME", "Salah Iddine Lahmouche")
BRAND_TITLE = os.getenv("BRAND_TITLE", "Expert Digital & AI Marketing")

BRAND_CITY = os.getenv("BRAND_CITY", "Agadir")

# ── Design tokens (Moroccan Warmth)
DS = {
    "bg": "#FAF7F2",
    "surface": "#FFFDF9",
    "surface_warm": "#FFF8F0",
    "text": "#1A1209",
    "text_secondary": "#7A5C2E",
    "text_tertiary": "#C4A96A",
    "primary": "#E8700A",
    "primary_soft": "#FFF3E8",
    "purple": "#7C3AED",
    "purple_soft": "#EDE9FE",
    "orange": "#D97706",
    "orange_soft": "#FEF3C7",
    "green": "#15803D",
    "green_soft": "#DCFCE7",
    "red": "#DC2626",
    "red_soft": "#FEE2E2",
    "border": "#E5D5C0",
    "border_light": "#F0E8D8",
    "shadow": "0 1px 4px rgba(120,60,0,0.07)",
    "shadow_hover": "0 6px 20px rgba(120,60,0,0.13)",
    "radius": "12px",
    "radius_lg": "16px",
}

STATUS_META = {
    "new":     {"label": "جديد",     "color": DS["primary"],  "soft": DS["primary_soft"],  "icon": "sparkles"},
    "audited": {"label": "مأوديت",   "color": DS["purple"],   "soft": DS["purple_soft"],   "icon": "clipboard-check"},
    "sent":    {"label": "مرسل",     "color": DS["orange"],   "soft": DS["orange_soft"],   "icon": "send"},
    "replied": {"label": "جاوب",     "color": DS["green"],    "soft": DS["green_soft"],    "icon": "message-circle"},
    "failed":  {"label": "فشل",      "color": DS["red"],      "soft": DS["red_soft"],      "icon": "alert-circle"},
}

# Lucide icon paths (stroke icons — no emoji)
_ICON_PATHS: dict[str, str] = {
    "home": '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "send": '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    "settings": '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    "sparkles": '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
    "clipboard-check": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "alert-circle": '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    "star": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    "refresh": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "bar-chart": '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
    "target": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "layout-grid": '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
}


def svg_icon(name: str, size: int = 18, color: str = "currentColor", stroke: float = 2) -> str:
    path = _ICON_PATHS.get(name, _ICON_PATHS["target"])
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{stroke}" '
        f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>'
    )


st.set_page_config(
    page_title="Lead Gen",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)


def inject_css() -> None:
    d = DS
    st.markdown(
        f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

    html, body, [class*="css"], .stApp {{
        font-family: 'Plus Jakarta Sans', 'IBM Plex Sans Arabic', -apple-system, sans-serif !important;
    }}

    .block-container {{
        padding-top: 1.5rem !important;
        padding-bottom: 2rem !important;
        max-width: 1320px !important;
    }}

    #MainMenu, footer, header[data-testid="stHeader"] {{
        visibility: hidden;
    }}

    /* ── Sidebar */
    section[data-testid="stSidebar"] {{
        border-right: 1.5px solid {d['border_light']};
    }}
    section[data-testid="stSidebar"] hr {{
        border-color: {d['border_light']} !important;
        margin: 0.6rem 0 !important;
    }}

    /* ── Typography */
    h1 {{
        font-size: 1.9rem !important;
        font-weight: 800 !important;
        letter-spacing: -0.03em !important;
        color: {d['text']} !important;
        line-height: 1.15 !important;
        margin-bottom: 0.2rem !important;
    }}
    h4 {{
        font-size: 0.72rem !important;
        font-weight: 700 !important;
        color: {d['text_tertiary']} !important;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        margin-bottom: 0.75rem !important;
    }}

    /* ── KPI bento cards */
    .bento-card {{
        background: {d['surface']};
        border-radius: {d['radius_lg']};
        padding: 1.4rem 1.5rem 1.2rem;
        border: 1.5px solid {d['border_light']};
        box-shadow: {d['shadow']};
        transition: transform 0.18s ease, box-shadow 0.18s ease;
        height: 100%;
        position: relative;
        overflow: hidden;
    }}
    .bento-card::before {{
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: var(--card-accent, {d['primary']});
        border-radius: {d['radius_lg']} {d['radius_lg']} 0 0;
    }}
    .bento-card:hover {{
        transform: translateY(-3px);
        box-shadow: {d['shadow_hover']};
    }}
    .bento-icon {{
        width: 42px; height: 42px;
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 1rem;
    }}
    .bento-value {{
        font-size: 2.1rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1;
        color: {d['text']};
        font-variant-numeric: tabular-nums;
    }}
    .bento-label {{
        font-size: 0.8rem;
        color: {d['text_secondary']};
        margin-top: 0.35rem;
        font-weight: 500;
    }}

    /* ── Pipeline */
    .pipeline-wrap {{
        background: {d['surface']};
        border: 1.5px solid {d['border_light']};
        border-radius: {d['radius_lg']};
        overflow: hidden;
        box-shadow: {d['shadow']};
        display: grid;
        grid-template-columns: repeat(4, 1fr);
    }}
    .pipeline-cell {{
        padding: 1.4rem 1rem 1.1rem;
        text-align: center;
        border-left: 1px solid {d['border_light']};
        position: relative;
    }}
    .pipeline-cell:first-child {{ border-left: none; }}
    .pipeline-stage {{
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
    }}
    .pipeline-n {{
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        font-variant-numeric: tabular-nums;
        line-height: 1;
    }}
    .pipeline-track {{
        height: 5px;
        border-radius: 3px;
        margin: 0.6rem auto 0.4rem;
        max-width: 70%;
        background: {d['border_light']};
        overflow: hidden;
    }}
    .pipeline-fill {{
        height: 100%;
        border-radius: 3px;
        transition: width 0.5s ease;
    }}
    .pipeline-pct {{
        font-size: 0.7rem;
        color: {d['text_tertiary']};
        font-weight: 500;
    }}

    /* ── Detail / section boxes */
    .detail-box {{
        background: {d['surface']};
        border-radius: {d['radius']};
        padding: 1.1rem 1.2rem;
        border: 1.5px solid {d['border_light']};
        box-shadow: {d['shadow']};
    }}
    .score-badge {{
        display: inline-flex;
        align-items: center;
        padding: 5px 14px;
        border-radius: 999px;
        font-weight: 800;
        font-size: 1rem;
        font-variant-numeric: tabular-nums;
    }}
    .status-pill {{
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 11px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
    }}

    /* ── Page header */
    .page-header {{
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1.5px solid {d['border_light']};
    }}
    .page-header .subtitle {{
        color: {d['text_secondary']};
        font-size: 0.9rem;
        margin-top: 0.2rem;
    }}

    /* ── Metric cards */
    div[data-testid="stMetric"] {{
        border: 1.5px solid {d['border_light']};
        border-radius: {d['radius']};
        padding: 0.9rem 1rem;
        box-shadow: {d['shadow']};
    }}

    /* ── Buttons */
    .stButton > button {{
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 0.88rem !important;
        transition: all 0.15s ease !important;
    }}
    .stButton > button:hover {{
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(232,112,10,0.2) !important;
    }}

    /* ── DataFrame */
    div[data-testid="stDataFrame"] {{
        border: 1.5px solid {d['border_light']};
        border-radius: {d['radius']};
        overflow: hidden;
        box-shadow: {d['shadow']};
    }}

    /* ── Tabs */
    .stTabs [data-baseweb="tab-list"] {{
        gap: 4px;
        border-radius: 10px;
        padding: 4px;
    }}
    .stTabs [data-baseweb="tab"] {{
        border-radius: 7px !important;
        font-weight: 600 !important;
        font-size: 0.88rem !important;
    }}

    @media (prefers-reduced-motion: reduce) {{
        .bento-card {{ transition: none !important; }}
        .bento-card:hover {{ transform: none; }}
    }}
    </style>
    """,
        unsafe_allow_html=True,
    )


def bento_card(value: int | str, label: str, icon_name: str, color: str, soft: str) -> str:
    return f"""
    <div class="bento-card" style="--card-accent:{color}">
        <div class="bento-icon" style="background:{soft}">{svg_icon(icon_name, 20, color)}</div>
        <div class="bento-value">{value}</div>
        <div class="bento-label">{label}</div>
    </div>
    """


def page_header(title: str, subtitle: str = "") -> None:
    sub = f'<div class="subtitle">{subtitle}</div>' if subtitle else ""
    st.markdown(
        f"""
        <div class="page-header">
            <h1>{title}</h1>
            {sub}
        </div>
        """,
        unsafe_allow_html=True,
    )


@st.cache_resource
def get_client():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@st.cache_data(ttl=20)
def load_leads() -> pd.DataFrame:
    sb = get_client()
    data = sb.table("leads").select("*").order("id", desc=True).execute().data or []
    return pd.DataFrame(data)


def extract_score(problems: str) -> int | None:
    m = re.search(r"\[(\d+)/100\]", problems or "")
    return int(m.group(1)) if m else None


def enrich_df(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["score"] = out.get("problems_found", pd.Series(dtype=str)).apply(
        lambda x: extract_score(str(x)) if pd.notna(x) else None
    )
    out["has_phone"] = out.get("phone", pd.Series(dtype=str)).apply(
        lambda x: bool(x and str(x).strip())
    )
    out["has_website"] = out.get("website", pd.Series(dtype=str)).apply(
        lambda x: bool(x and str(x).strip())
    )
    out["has_pdf"] = out.get("audit_pdf_path", pd.Series(dtype=str)).apply(
        lambda x: bool(x and Path(str(x)).exists())
    )
    if "rating" in out.columns:
        out["rating"] = pd.to_numeric(out["rating"], errors="coerce")
    return out


def wa_link(phone: str, message: str = "") -> str:
    digits = "".join(c for c in str(phone or "") if c.isdigit())
    if not digits:
        return ""
    url = f"https://wa.me/{digits}"
    if message:
        url += f"?text={quote(message)}"
    return url


def screenshot_for_lead(lead_id: int, business_name: str) -> Path | None:
    if not AUDITS_DIR.exists():
        return None
    slug = re.sub(r"[^a-z0-9]+", "_", business_name.lower())[:40].strip("_")
    for pattern in [f"{lead_id}_*.png", f"{lead_id}_{slug}.png"]:
        matches = list(AUDITS_DIR.glob(pattern))
        if matches:
            return matches[0]
    return None


def update_lead_status(lead_id: int, status: str) -> bool:
    try:
        sb = get_client()
        payload: dict = {"status": status}
        if status == "replied":
            payload["replied_at"] = datetime.now(timezone.utc).isoformat()
        sb.table("leads").update(payload).eq("id", lead_id).execute()
        load_leads.clear()
        return True
    except Exception as e:
        st.error(f"خطأ Supabase: {e}")
        return False


def render_pipeline(counts: dict[str, int]) -> None:
    order = ["new", "audited", "sent", "replied"]
    top = max(counts.get(order[0], 0), 1)
    cells = []
    for i, key in enumerate(order):
        meta = STATUS_META.get(key, {"label": key, "color": DS["text_secondary"]})
        n = counts.get(key, 0)
        pct = int(n / top * 100)
        fill = max(pct, 4)
        cells.append(f"""
        <div class="pipeline-cell">
            <div class="pipeline-stage" style="color:{meta['color']}">{meta['label']}</div>
            <div class="pipeline-n" style="color:{meta['color']}">{n}</div>
            <div class="pipeline-track">
                <div class="pipeline-fill" style="width:{fill}%;background:{meta['color']}"></div>
            </div>
            <div class="pipeline-pct">{pct}% من البداية</div>
        </div>""")
    st.markdown(f'<div class="pipeline-wrap">{"".join(cells)}</div>', unsafe_allow_html=True)


def render_overview(df: pd.DataFrame) -> None:
    counts = df["status"].value_counts().to_dict() if "status" in df.columns else {}
    total = len(df)
    replied = counts.get("replied", 0)
    sent_or_more = counts.get("sent", 0) + replied
    conv_rate = f"{(replied / sent_or_more * 100):.0f}%" if sent_or_more else "—"
    avg_score = df["score"].dropna().mean()
    with_pdf = int(df["has_pdf"].sum()) if "has_pdf" in df.columns else 0

    c1, c2, c3, c4, c5, c6 = st.columns(6)
    cards = [
        (c1, total, "إجمالي Leads", "users", DS["primary"], DS["primary_soft"]),
        (c2, counts.get("new", 0), "بانتظار المعالجة", "sparkles", DS["primary"], DS["primary_soft"]),
        (c3, counts.get("audited", 0), "جاهز للإرسال", "clipboard-check", DS["purple"], DS["purple_soft"]),
        (c4, counts.get("sent", 0), "مرسل", "send", DS["orange"], DS["orange_soft"]),
        (c5, counts.get("replied", 0), f"جاوب ({conv_rate})", "message-circle", DS["green"], DS["green_soft"]),
        (c6, with_pdf, "PDF أوديت", "file-text", DS["primary"], DS["primary_soft"]),
    ]
    for col, val, lbl, icon_name, color, soft in cards:
        col.markdown(bento_card(val, lbl, icon_name, color, soft), unsafe_allow_html=True)

    st.markdown("<div style='height:1.25rem'></div>", unsafe_allow_html=True)
    st.markdown("#### Pipeline")
    render_pipeline(counts)

    st.markdown("<div style='height:1.25rem'></div>", unsafe_allow_html=True)
    left, right = st.columns([1, 1])

    with left:
        st.markdown("#### توزيع الحالة")
        if counts:
            chart_df = pd.DataFrame({
                "status": [STATUS_META.get(k, {}).get("label", k) for k in counts],
                "count": list(counts.values()),
            })
            st.bar_chart(chart_df.set_index("status"), height=280, color=DS["primary"])
        else:
            st.caption("ما كاينش بيانات")

    with right:
        st.markdown("#### إحصائيات سريعة")
        m1, m2 = st.columns(2)
        m1.metric("متوسط Score", f"{avg_score:.0f}/100" if pd.notna(avg_score) else "—")
        m2.metric("متوسط التقييم", f"{df['rating'].dropna().mean():.1f}/5" if df["rating"].notna().any() else "—")
        m3, m4 = st.columns(2)
        m3.metric("بلا موقع", int((~df["has_website"]).sum()))
        m4.metric("بلا تلفون", int((~df["has_phone"]).sum()))


def apply_filters(df: pd.DataFrame, sidebar: bool = True) -> pd.DataFrame:
    container = st.sidebar if sidebar else st
    container.markdown("#### فلاتر")

    statuses = sorted(df["status"].dropna().unique()) if "status" in df.columns else []
    status_filter = container.multiselect(
        "الحالة",
        options=statuses,
        default=statuses,
        format_func=lambda x: STATUS_META.get(x, {}).get("label", x),
    )

    search = container.text_input("بحث", placeholder="اسم، عنوان، تلفون...")
    min_rating = container.slider("تقييم Google أدنى", 0.0, 5.0, 0.0, 0.5)
    max_score = container.slider("Score أقصى", 0, 100, 100, 5)

    container.markdown("---")
    only_no_site = container.checkbox("بلا موقع فقط")
    only_has_phone = container.checkbox("عندهم تلفون فقط")
    only_has_pdf = container.checkbox("عندهم PDF فقط")
    only_ready = container.checkbox("جاهز للإرسال (audited)")

    out = df.copy()
    if status_filter:
        out = out[out["status"].isin(status_filter)]
    if search:
        q = search.lower()
        mask = (
            out["business_name"].astype(str).str.lower().str.contains(q, na=False)
            | out["address"].astype(str).str.lower().str.contains(q, na=False)
            | out["phone"].astype(str).str.contains(q, na=False)
        )
        out = out[mask]
    if min_rating > 0:
        out = out[out["rating"].fillna(0) >= min_rating]
    if max_score < 100 and "score" in out.columns:
        out = out[out["score"].fillna(0) <= max_score]
    if only_no_site:
        out = out[~out["has_website"]]
    if only_has_phone:
        out = out[out["has_phone"]]
    if only_has_pdf:
        out = out[out["has_pdf"]]
    if only_ready:
        out = out[out["status"] == "audited"]

    return out


def score_color(score: int | None) -> str:
    if score is None:
        return DS["text_tertiary"]
    if score >= 70:
        return DS["green"]
    if score >= 40:
        return DS["orange"]
    return DS["red"]


def score_soft(score: int | None) -> str:
    if score is None:
        return DS["border_light"]
    if score >= 70:
        return DS["green_soft"]
    if score >= 40:
        return DS["orange_soft"]
    return DS["red_soft"]


def render_lead_detail(row: pd.Series) -> None:
    status = row.get("status", "new")
    meta = STATUS_META.get(status, {"label": status, "color": DS["text_secondary"], "soft": DS["border_light"], "icon": "target"})
    score = row.get("score")

    header_l, header_r = st.columns([3, 1])
    with header_l:
        st.markdown(f"## {row.get('business_name', '')}")
        st.caption(row.get("address", "") or "—")
    with header_r:
        if score is not None and pd.notna(score):
            color = score_color(int(score))
            soft = score_soft(int(score))
            st.markdown(
                f'<div class="score-badge" style="background:{soft};color:{color};border:1.5px solid {color}40">'
                f"{int(score)}/100</div>",
                unsafe_allow_html=True,
            )
        st.markdown(
            f'<div class="status-pill" style="background:{meta["soft"]};color:{meta["color"]}">'
            f'{svg_icon(meta["icon"], 14, meta["color"])} {meta["label"]}</div>',
            unsafe_allow_html=True,
        )

    tab1, tab2, tab3, tab4 = st.tabs(["نظرة عامة", "الأوديت", "الميساج", "PDF"])

    with tab1:
        c1, c2, c3 = st.columns(3)
        c1.markdown(f"**تلفون:** `{row.get('phone') or '—'}`")
        c2.markdown(f"**تقييم:** {row.get('rating') or '—'}/5")
        c3.markdown(f"**موقع:** {row.get('website') or 'ما عندوش'}")

        if row.get("phone"):
            msg = str(row.get("message_sent") or "")
            link = wa_link(row.get("phone"), msg)
            if link:
                st.link_button("فتح واتساب", link, use_container_width=True, type="primary")

        st.markdown("---")
        act1, act2, act3, act4 = st.columns(4)
        lid = int(row["id"])
        if act1.button("علّم كـ جاوب", key=f"rep_{lid}", use_container_width=True):
            if update_lead_status(lid, "replied"):
                st.success("تم!")
                st.rerun()
        if act2.button("رجّع لـ audited", key=f"aud_{lid}", use_container_width=True):
            if update_lead_status(lid, "audited"):
                st.rerun()
        if act3.button("رجّع لـ new", key=f"new_{lid}", use_container_width=True):
            if update_lead_status(lid, "new"):
                st.rerun()
        if act4.button("علّم كـ مرسل", key=f"sent_{lid}", use_container_width=True):
            if update_lead_status(lid, "sent"):
                st.rerun()

    with tab2:
        problems = str(row.get("problems_found") or "")
        if problems:
            st.markdown('<div class="detail-box">', unsafe_allow_html=True)
            for line in problems.split(" | "):
                if line.strip():
                    st.markdown(f"- {line.strip()}")
            st.markdown("</div>", unsafe_allow_html=True)
        else:
            st.info("ما تولّدش أوديت بعد — شغّل `--process`")

        score_m = re.search(r"\[(\d+)/100\]", problems)
        if score_m:
            st.metric("Score إجمالي", f"{score_m.group(1)}/100")

        shot = screenshot_for_lead(int(row["id"]), str(row.get("business_name", "")))
        mob = AUDITS_DIR / f"{row['id']}_{re.sub(r'[^a-z0-9]+', '_', str(row.get('business_name','')).lower())[:40].strip('_')}_mobile.png"
        if shot and shot.exists():
            c1, c2 = st.columns(2)
            with c1:
                st.markdown("**Desktop**")
                st.image(str(shot), use_container_width=True)
            with c2:
                if mob.exists():
                    st.markdown("**Mobile**")
                    st.image(str(mob), use_container_width=True)

    with tab3:
        message = str(row.get("message_sent") or "")
        if message:
            st.text_area("الميساج", message, height=200, key=f"msg_{row['id']}")
            st.code(message, language=None)
            if st.button("نسخ الميساج", key=f"copy_{row['id']}"):
                st.toast("انسخ من الـ text area فوق")
        else:
            st.info("ما كاينش ميساج — شغّل المعالجة")

    with tab4:
        pdf_path = row.get("audit_pdf_path", "")
        if pdf_path and Path(str(pdf_path)).exists():
            pdf_bytes = Path(pdf_path).read_bytes()
            st.download_button(
                "تحميل PDF",
                data=pdf_bytes,
                file_name=Path(pdf_path).name,
                mime="application/pdf",
                use_container_width=True,
                type="primary",
            )
            b64 = base64.b64encode(pdf_bytes).decode()
            st.markdown(
                f'<iframe src="data:application/pdf;base64,{b64}" width="100%" height="600" '
                f'style="border:1px solid {DS["border_light"]};border-radius:{DS["radius"]};"></iframe>',
                unsafe_allow_html=True,
            )
        else:
            st.warning("PDF ما تولّدش بعد")


def render_leads_table(df: pd.DataFrame) -> None:
    st.markdown(f"#### Leads ({len(df)})")

    if df.empty:
        st.warning("ما كاين حتى lead بهاد الفلاتر")
        return

    display = df.copy()
    display["status_label"] = display["status"].map(
        lambda s: STATUS_META.get(s, {}).get("label", s)
    )
    display["score_disp"] = display["score"].apply(
        lambda x: f"{int(x)}/100" if pd.notna(x) else "—"
    )
    display["wa"] = display.apply(
        lambda r: "نعم" if wa_link(r.get("phone"), r.get("message_sent")) else "—",
        axis=1,
    )

    cols_show = [
        c for c in [
            "id", "business_name", "phone", "rating", "score_disp",
            "status_label", "has_website", "has_pdf", "wa", "address",
        ]
        if c in display.columns
    ]

    event = st.dataframe(
        display[cols_show],
        use_container_width=True,
        height=380,
        on_select="rerun",
        selection_mode="single-row",
        column_config={
            "business_name": st.column_config.TextColumn("الاسم", width="large"),
            "phone": st.column_config.TextColumn("تلفون"),
            "rating": st.column_config.NumberColumn("تقييم", format="%.1f"),
            "score_disp": st.column_config.TextColumn("Score"),
            "status_label": st.column_config.TextColumn("حالة"),
            "has_website": st.column_config.CheckboxColumn("موقع"),
            "has_pdf": st.column_config.CheckboxColumn("PDF"),
            "wa": st.column_config.TextColumn("WA"),
            "address": st.column_config.TextColumn("عنوان", width="medium"),
        },
        hide_index=True,
    )

    selected_rows = event.selection.rows if event.selection else []
    if selected_rows:
        idx = selected_rows[0]
        render_lead_detail(df.iloc[idx])
    else:
        st.caption("اختار صف من الجدول باش تشوف التفاصيل")


def render_sidebar_brand() -> None:
    st.sidebar.markdown(
        f"""
        <div style="display:flex;align-items:center;gap:10px;padding:0.25rem 0 0.5rem;">
            <div style="width:38px;height:38px;border-radius:10px;background:{DS['primary']};
                        display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                {svg_icon("layout-grid", 18, "white")}
            </div>
            <div>
                <div style="font-weight:800;font-size:0.95rem;letter-spacing:-0.02em;
                            color:{DS['text']};">Lead Gen</div>
                <div style="font-size:0.72rem;color:{DS['text_secondary']};">AI Outbound</div>
            </div>
        </div>
        <div style="font-size:0.75rem;color:{DS['text_tertiary']};margin-bottom:0.5rem;">
            {BRAND_NAME} · {BRAND_CITY}
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.sidebar.markdown("---")


def main() -> None:
    inject_css()

    if not SUPABASE_URL or not SUPABASE_KEY:
        st.error("عمر `SUPABASE_URL` و `SUPABASE_KEY` فـ `.env`")
        st.stop()

    try:
        df = enrich_df(load_leads())
    except Exception as e:
        st.error(f"Supabase: {e}")
        st.stop()

    if df.empty:
        st.info("ما كاين حتى lead — `python main.py --scrape`")
        st.stop()

    # ── Sidebar: brand + nav + filters + refresh
    render_sidebar_brand()

    page = st.sidebar.radio(
        "التنقل",
        ["نظرة عامة", "Leads", "جاهز للإرسال", "إجراءات"],
        label_visibility="collapsed",
    )

    st.sidebar.markdown("---")
    filtered = apply_filters(df)
    st.sidebar.markdown("---")

    if st.sidebar.button("تحديث البيانات", use_container_width=True, type="primary"):
        load_leads.clear()
        st.rerun()

    st.sidebar.markdown(
        f'<div style="font-size:0.8rem;color:{DS["text_secondary"]};margin-top:6px;text-align:center;">'
        f'<strong style="color:{DS["text"]}">{len(filtered)}</strong> / {len(df)} lead</div>',
        unsafe_allow_html=True,
    )

    if page == "نظرة عامة":
        page_header("نظرة عامة", "ملخص الأداء والـ pipeline ديال الـ leads")
        render_overview(df)

    elif page == "Leads":
        page_header("إدارة Leads", "فلترة، بحث، وتفاصيل كل lead")
        render_leads_table(filtered)

    elif page == "جاهز للإرسال":
        page_header("جاهز للإرسال", "Leads عندهم أوديت + ميساج + PDF")
        ready = df[df["status"] == "audited"].copy()
        st.success(f"**{len(ready)}** lead جاهزين — صيفط من واتساب")
        if ready.empty:
            st.info("شغّل: `python main.py --process --skip-whatsapp`")
        else:
            for _, row in ready.iterrows():
                with st.expander(f"{row['business_name']}", expanded=False):
                    render_lead_detail(row)

    elif page == "إجراءات":
        page_header("إجراءات سريعة", "أوامر CLI وتصدير البيانات")
        st.markdown("""
        ```bash
        # Scrape
        python main.py --scrape --query "écoles privées" --location "Taroudant" --max 30

        # أوديت + PDF (بلا واتساب)
        python main.py --process --skip-whatsapp

        # فلترة
        python main.py --process --skip-whatsapp --require-phone --no-website-only --min-rating 3.5

        # Sync Google Sheets
        python main.py --sync-sheets

        # Webhook ردود
        python main.py --webhook
        ```
        """)

        exp = filtered if not filtered.empty else df
        csv = exp.to_csv(index=False).encode("utf-8")
        st.download_button(
            "تصدير CSV",
            data=csv,
            file_name=f"leads_{datetime.now().strftime('%Y%m%d')}.csv",
            mime="text/csv",
            use_container_width=True,
            type="primary",
        )

        st.markdown("---")
        st.markdown("#### ملفات PDF")
        pdfs = list(AUDITS_DIR.glob("*.pdf")) if AUDITS_DIR.exists() else []
        st.metric("ملفات PDF", len(pdfs))
        if pdfs:
            for p in sorted(pdfs, key=lambda x: x.stat().st_mtime, reverse=True)[:10]:
                st.caption(p.name)


if __name__ == "__main__":
    main()
