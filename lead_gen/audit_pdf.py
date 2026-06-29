"""توليد PDF أوديت احترافي — تصميم مخصص + هوية المستشار."""

from __future__ import annotations

import asyncio
import html
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from playwright.async_api import async_playwright

from audit_engine import CATEGORY_LABELS

load_dotenv(Path(__file__).parent / ".env")

AUDITS_DIR = Path(__file__).parent / "audits"

# ── هوية المستشار (قابلة للتخصيص فـ .env)
BRAND_NAME = os.getenv("BRAND_NAME", "Salah Iddine Lahmouche")
BRAND_TITLE = os.getenv("BRAND_TITLE", "Expert Digital & AI Marketing")
BRAND_TAGLINE = os.getenv("BRAND_TAGLINE", "تحليل رقمي · استراتيجية · نمو أعمال")
BRAND_PHONE = os.getenv("BRAND_PHONE", "")
BRAND_EMAIL = os.getenv("BRAND_EMAIL", "")
BRAND_WEBSITE = os.getenv("BRAND_WEBSITE", "")
BRAND_CITY = os.getenv("BRAND_CITY", "Agadir, Maroc")

BRAND_PRIMARY = "#0c1e3c"      # navy
BRAND_ACCENT = "#c8a951"       # gold
BRAND_ACCENT2 = "#2563eb"      # blue

TYPE_LABELS = {
    "education": "مؤسسة تعليمية",
    "beauty": "صالون / حلاقة",
    "food": "مطعم / مقهى",
    "health": "خدمة صحية",
    "local": "تجارة محلية",
}

PRIORITY_COLORS = {"high": "#dc2626", "medium": "#ea580c", "low": "#64748b"}
PRIORITY_LABELS = {"high": "عالية", "medium": "متوسطة", "low": "منخفضة"}


def slugify(name: str) -> str:
    text = (name or "lead").lower()
    for old, new in [("é", "e"), ("è", "e"), ("à", "a"), ("ô", "o"), ("ï", "i"), ("ç", "c")]:
        text = text.replace(old, new)
    slug = "".join(c if c.isalnum() else "_" for c in text)
    return slug.strip("_")[:40] or "lead"


def screenshot_path_for_lead(lead: dict) -> Path | None:
    lead_id = lead.get("id")
    if not lead_id:
        return None
    AUDITS_DIR.mkdir(exist_ok=True)
    slug = slugify(lead.get("business_name", ""))
    desktop = AUDITS_DIR / f"{lead_id}_{slug}_desktop.png"
    if desktop.exists():
        return desktop
    legacy = AUDITS_DIR / f"{lead_id}_{slug}.png"
    return legacy if legacy.exists() else desktop


def mobile_screenshot_path_for_lead(lead: dict) -> Path | None:
    lead_id = lead.get("id")
    if not lead_id:
        return None
    AUDITS_DIR.mkdir(exist_ok=True)
    return AUDITS_DIR / f"{lead_id}_{slugify(lead.get('business_name', ''))}_mobile.png"


def pdf_path_for_lead(lead: dict) -> Path:
    lead_id = lead.get("id", "0")
    AUDITS_DIR.mkdir(exist_ok=True)
    return AUDITS_DIR / f"{lead_id}_{slugify(lead.get('business_name', ''))}.pdf"


def _score_color(score: int) -> str:
    if score >= 70:
        return "#16a34a"
    if score >= 40:
        return "#ea580c"
    return "#dc2626"


def _score_label(score: int) -> str:
    if score >= 70:
        return "مزيان"
    if score >= 40:
        return "يحتاج تحسين"
    return "حرج"


def _initials(name: str) -> str:
    parts = [p for p in name.replace(".", " ").split() if p]
    return "".join(p[0].upper() for p in parts[:2]) or "SL"


def _contact_line() -> str:
    parts = []
    if BRAND_PHONE:
        parts.append(f"📞 {html.escape(BRAND_PHONE)}")
    if BRAND_EMAIL:
        parts.append(f"✉️ {html.escape(BRAND_EMAIL)}")
    if BRAND_WEBSITE:
        parts.append(f"🌐 {html.escape(BRAND_WEBSITE)}")
    if BRAND_CITY:
        parts.append(f"📍 {html.escape(BRAND_CITY)}")
    return " &nbsp;|&nbsp; ".join(parts) if parts else html.escape(BRAND_CITY)


def _bar_html(label: str, value: int) -> str:
    color = _score_color(value)
    pct = max(4, min(100, value))
    return f"""
    <div class="bar-row">
      <div class="bar-label">{html.escape(label)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:{pct}%;background:{color}"></div></div>
      <div class="bar-value" style="color:{color}">{value}</div>
    </div>"""


def _img_block(path: Path | None, caption: str) -> str:
    if path and path.exists():
        return f"""
        <div class="shot-wrap">
          <div class="shot-caption">{html.escape(caption)}</div>
          <img src="file://{path.resolve()}" class="screenshot" alt=""/>
        </div>"""
    return f'<div class="no-shot">{html.escape(caption)}</div>'


def _render_html(lead: dict, audit, desktop_shot: Path | None, mobile_shot: Path | None) -> str:
    biz_name = html.escape(lead.get("business_name", ""))
    address = html.escape(lead.get("address", "") or "—")
    website = html.escape(lead.get("website", "") or "لا يوجد موقع إلكتروني")
    rating = lead.get("rating") or "—"
    phone = html.escape(str(lead.get("phone") or "—"))
    biz_label = TYPE_LABELS.get(audit.business_type, audit.business_type)
    score = audit.score
    scolor = _score_color(score)
    slabel = _score_label(score)
    date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    ref = f"AUD-{lead.get('id', '0')}-{datetime.now().strftime('%Y%m')}"
    signals = audit.signals or {}
    initials = _initials(BRAND_NAME)

    exec_summary = html.escape(audit.executive_summary or "—")

    bars = ""
    for key, val in sorted((audit.category_scores or {}).items(), key=lambda x: -x[1]):
        if val > 0 or signals.get("has_website"):
            bars += _bar_html(CATEGORY_LABELS.get(key, key), val)

    recs_html = ""
    for i, r in enumerate((audit.recommendations or [])[:8], 1):
        pcolor = PRIORITY_COLORS.get(r.priority, "#64748b")
        plabel = PRIORITY_LABELS.get(r.priority, r.priority)
        recs_html += f"""
        <tr>
          <td class="num">{i}</td>
          <td><span class="prio" style="background:{pcolor}">{plabel}</span></td>
          <td><strong>{html.escape(r.issue)}</strong><br/><span class="impact">{html.escape(r.impact)}</span></td>
          <td>{html.escape(r.action)}</td>
        </tr>"""

    problems_html = "".join(f"<li>{html.escape(p)}</li>" for p in (audit.problems or [])[:10])
    strengths_html = "".join(f"<li>{html.escape(s)}</li>" for s in (audit.strengths or [])[:5])
    passed = "".join(f"<span class='tag ok'>✓ {html.escape(c)}</span>" for c in (audit.checks_passed or [])[:8])
    failed = "".join(f"<span class='tag fail'>✗ {html.escape(c)}</span>" for c in (audit.checks_failed or [])[:8])

    tech_rows = ""
    for lbl, val in [
        ("وقت التحميل", f"{signals.get('load_time_s', '—')}s" if signals.get("load_time_s") else "—"),
        ("حجم الصفحة", f"{signals.get('page_weight_kb', '—')} KB"),
        ("HTTPS", "نعم ✓" if signals.get("is_https") else "لا ✗"),
        ("واتساب", "نعم ✓" if signals.get("has_whatsapp") else "لا ✗"),
        ("Meta SEO", "نعم ✓" if signals.get("has_meta_description") else "لا ✗"),
        ("Schema.org", "نعم ✓" if signals.get("has_structured_data") else "لا ✗"),
        ("Analytics", "نعم ✓" if signals.get("has_analytics") else "لا ✗"),
        ("فورمات", str(signals.get("forms_count", 0))),
    ]:
        tech_rows += f"<tr><td>{html.escape(lbl)}</td><td>{html.escape(str(val))}</td></tr>"

    if desktop_shot or mobile_shot:
        shots_section = f"""
        <div class="section">
          <div class="section-head"><span class="section-icon">📸</span> لقطات الشاشة</div>
          <div class="shots-grid">
            {_img_block(desktop_shot, "نسخة الحاسوب")}
            {_img_block(mobile_shot, "نسخة الهاتف")}
          </div>
        </div>"""
    elif not signals.get("has_website"):
        shots_section = """
        <div class="section">
          <div class="section-head"><span class="section-icon">📍</span> الحضور الرقمي</div>
          <div class="maps-notice">
            لا يوجد موقع ويب — التحليل مبني على بيانات Google Maps، التقييمات، والمنافسة المحلية.
          </div>
        </div>"""
    else:
        shots_section = ""

    return f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <style>
    @page {{ margin: 0; size: A4; }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b; line-height: 1.6; font-size: 12.5px;
      background: #fff;
    }}

    /* ── Header band ── */
    .brand-header {{
      background: linear-gradient(135deg, {BRAND_PRIMARY} 0%, #1a3a6b 100%);
      color: white; padding: 28px 36px 24px;
      display: flex; justify-content: space-between; align-items: flex-start;
    }}
    .brand-left {{ flex: 1; }}
    .brand-logo {{
      width: 52px; height: 52px; border-radius: 12px;
      background: {BRAND_ACCENT}; color: {BRAND_PRIMARY};
      font-size: 20px; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px; letter-spacing: -1px;
    }}
    .brand-name {{ font-size: 20px; font-weight: 700; letter-spacing: 0.3px; }}
    .brand-title {{ font-size: 12px; color: {BRAND_ACCENT}; font-weight: 600; margin-top: 3px; }}
    .brand-tagline {{ font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 4px; }}
    .brand-right {{ text-align: left; font-size: 10px; color: rgba(255,255,255,0.7); line-height: 1.8; }}
    .brand-right strong {{ color: {BRAND_ACCENT}; display: block; font-size: 11px; margin-bottom: 4px; }}

    /* ── Report title bar ── */
    .report-bar {{
      background: #f8fafc; border-bottom: 3px solid {BRAND_ACCENT};
      padding: 16px 36px; display: flex; justify-content: space-between; align-items: center;
    }}
    .report-title {{ font-size: 18px; font-weight: 800; color: {BRAND_PRIMARY}; }}
    .report-sub {{ font-size: 11px; color: #64748b; margin-top: 2px; }}
    .report-ref {{ font-size: 10px; color: #94a3b8; text-align: left; }}
    .report-ref strong {{ color: {BRAND_PRIMARY}; }}

    /* ── Body content ── */
    .content {{ padding: 24px 36px 32px; }}

    /* ── Hero score ── */
    .hero {{ display: flex; gap: 20px; margin-bottom: 20px; align-items: stretch; }}
    .score-card {{
      flex-shrink: 0; width: 130px; border-radius: 16px;
      background: linear-gradient(145deg, {BRAND_PRIMARY}, #1e4070);
      color: white; display: flex; flex-direction: column;
      align-items: center; justify-content: center; padding: 20px 12px;
      text-align: center;
    }}
    .score-num {{ font-size: 48px; font-weight: 900; color: {BRAND_ACCENT}; line-height: 1; }}
    .score-denom {{ font-size: 14px; color: rgba(255,255,255,0.5); }}
    .score-badge {{
      margin-top: 8px; padding: 3px 12px; border-radius: 20px;
      font-size: 11px; font-weight: 700; background: {scolor}; color: white;
    }}
    .exec-box {{
      flex: 1; background: #f0f4ff; border-radius: 12px; padding: 16px 18px;
      border-right: 4px solid {BRAND_ACCENT2};
    }}
    .exec-label {{
      font-size: 10px; font-weight: 700; color: {BRAND_ACCENT2};
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;
    }}

    /* ── Info grid ── */
    .info-grid {{
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;
    }}
    .info-card {{
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 12px 14px; border-top: 3px solid {BRAND_ACCENT};
    }}
    .info-card .lbl {{ font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }}
    .info-card .val {{ font-size: 12px; font-weight: 600; color: {BRAND_PRIMARY}; word-break: break-word; }}

    /* ── Sections ── */
    .section {{ margin-bottom: 20px; }}
    .section-head {{
      font-size: 13px; font-weight: 800; color: {BRAND_PRIMARY};
      padding: 8px 0; border-bottom: 2px solid {BRAND_ACCENT};
      margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
    }}
    .section-icon {{ font-size: 16px; }}

    /* ── Bars ── */
    .bar-row {{ display: flex; align-items: center; gap: 10px; margin: 7px 0; }}
    .bar-label {{ width: 140px; font-size: 11.5px; color: #475569; }}
    .bar-track {{ flex: 1; height: 9px; background: #e2e8f0; border-radius: 5px; overflow: hidden; }}
    .bar-fill {{ height: 100%; border-radius: 5px; }}
    .bar-value {{ width: 30px; font-weight: 800; font-size: 12px; text-align: left; }}

    /* ── Tables ── */
    table {{ width: 100%; border-collapse: collapse; font-size: 11.5px; }}
    th {{ background: {BRAND_PRIMARY}; color: white; padding: 9px 10px; text-align: right; font-size: 11px; }}
    td {{ padding: 9px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }}
    tr:nth-child(even) td {{ background: #f8fafc; }}
    td.num {{ color: #94a3b8; font-weight: 700; width: 24px; text-align: center; }}
    .prio {{ color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap; }}
    .impact {{ color: #64748b; font-size: 10.5px; margin-top: 3px; display: block; }}

    /* ── Screenshots ── */
    .shots-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
    .shot-wrap {{ text-align: center; }}
    .shot-caption {{ font-size: 10px; color: #64748b; margin-bottom: 6px; font-weight: 600; }}
    .screenshot {{ max-width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; }}
    .no-shot {{
      background: #f1f5f9; border: 1px dashed #cbd5e1; padding: 20px;
      text-align: center; border-radius: 8px; color: #64748b; font-size: 11px;
    }}
    .maps-notice {{
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
      padding: 16px; color: #92400e; font-size: 12px;
    }}

    /* ── Tags & lists ── */
    .two-col {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }}
    ul {{ padding-right: 18px; }}
    li {{ margin-bottom: 5px; font-size: 12px; }}
    .tags {{ display: flex; flex-wrap: wrap; gap: 5px; }}
    .tag {{ padding: 3px 9px; border-radius: 20px; font-size: 10.5px; font-weight: 600; }}
    .tag.ok {{ background: #dcfce7; color: #166534; }}
    .tag.fail {{ background: #fee2e2; color: #991b1b; }}

    /* ── CTA ── */
    .cta-box {{
      background: linear-gradient(135deg, {BRAND_PRIMARY}, #1a3a6b);
      border-radius: 14px; padding: 20px 24px; color: white;
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 24px;
    }}
    .cta-text {{ font-size: 14px; font-weight: 700; }}
    .cta-sub {{ font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; }}
    .cta-contact {{ font-size: 11px; color: {BRAND_ACCENT}; font-weight: 600; text-align: left; line-height: 1.8; }}

    /* ── Footer ── */
    .footer {{
      background: #f8fafc; border-top: 2px solid {BRAND_ACCENT};
      padding: 14px 36px; display: flex; justify-content: space-between; align-items: center;
      font-size: 10px; color: #64748b;
    }}
    .footer-brand {{ font-weight: 700; color: {BRAND_PRIMARY}; font-size: 11px; }}
    .footer-note {{ color: #94a3b8; font-size: 9.5px; }}
  </style>
</head>
<body>

  <!-- هوية المستشار -->
  <div class="brand-header">
    <div class="brand-left">
      <div class="brand-logo">{initials}</div>
      <div class="brand-name">{html.escape(BRAND_NAME)}</div>
      <div class="brand-title">{html.escape(BRAND_TITLE)}</div>
      <div class="brand-tagline">{html.escape(BRAND_TAGLINE)}</div>
    </div>
    <div class="brand-right">
      <strong>تقرير أوديت رقمي</strong>
      {date}<br/>
      المرجع: {ref}<br/>
      {_contact_line()}
    </div>
  </div>

  <!-- عنوان التقرير -->
  <div class="report-bar">
    <div>
      <div class="report-title">{biz_name}</div>
      <div class="report-sub">{html.escape(biz_label)} · تحليل الحضور الرقمي</div>
    </div>
    <div class="report-ref">
      أُعدّ بواسطة<br/>
      <strong>{html.escape(BRAND_NAME)}</strong>
    </div>
  </div>

  <div class="content">

    <!-- Score + ملخص -->
    <div class="hero">
      <div class="score-card">
        <div class="score-num">{score}</div>
        <div class="score-denom">/ 100</div>
        <div class="score-badge">{slabel}</div>
      </div>
      <div class="exec-box">
        <div class="exec-label">📌 الملخص التنفيذي</div>
        {exec_summary}
      </div>
    </div>

    <!-- معلومات البزنس -->
    <div class="info-grid">
      <div class="info-card"><div class="lbl">العنوان</div><div class="val">{address}</div></div>
      <div class="info-card"><div class="lbl">تقييم Google</div><div class="val">⭐ {rating} / 5</div></div>
      <div class="info-card"><div class="lbl">الهاتف</div><div class="val">{phone}</div></div>
      <div class="info-card"><div class="lbl">الموقع الإلكتروني</div><div class="val">{website}</div></div>
    </div>

    <!-- Scores بالفئات -->
    <div class="section">
      <div class="section-head"><span class="section-icon">📈</span> النقاط بالفئات</div>
      {bars or '<p style="color:#94a3b8">—</p>'}
    </div>

    {shots_section}

    <!-- نقاط القوة + فحوصات -->
    <div class="two-col section">
      <div>
        <div class="section-head"><span class="section-icon">✅</span> نقاط القوة</div>
        <ul>{strengths_html or '<li>—</li>'}</ul>
      </div>
      <div>
        <div class="section-head"><span class="section-icon">🔎</span> نتائج الفحص</div>
        <div class="tags">{passed}{failed}</div>
      </div>
    </div>

    <!-- خطة العمل -->
    <div class="section">
      <div class="section-head"><span class="section-icon">🎯</span> خطة العمل — توصيات بالأولوية</div>
      <table>
        <thead><tr><th>#</th><th>أولوية</th><th>المشكل &amp; التأثير</th><th>الإجراء المقترح</th></tr></thead>
        <tbody>{recs_html or '<tr><td colspan="4">—</td></tr>'}</tbody>
      </table>
    </div>

    <!-- ملاحظات -->
    <div class="section">
      <div class="section-head"><span class="section-icon">📋</span> كل الملاحظات</div>
      <ul>{problems_html or '<li>—</li>'}</ul>
    </div>

    <!-- بيانات تقنية -->
    <div class="section">
      <div class="section-head"><span class="section-icon">⚙️</span> البيانات التقنية</div>
      <table><tbody>{tech_rows}</tbody></table>
    </div>

    <!-- CTA -->
    <div class="cta-box">
      <div>
        <div class="cta-text">🎁 استشارة مجانية + خطة تحسين مخصصة</div>
        <div class="cta-sub">تواصل معي باش نحولو هاد التحليل لنتائج حقيقية على نشاطك</div>
      </div>
      <div class="cta-contact">
        {html.escape(BRAND_NAME)}<br/>
        {html.escape(BRAND_TITLE)}<br/>
        {_contact_line()}
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <div class="footer-brand">{html.escape(BRAND_NAME)} · {html.escape(BRAND_TITLE)}</div>
      <div class="footer-note">هاد التقرير أُعدّ خصيصاً لـ {biz_name} · سري وموجّه للاستخدام الداخلي</div>
    </div>
    <div style="text-align:left">{ref} · {date}</div>
  </div>

</body>
</html>"""


async def _html_to_pdf(html_content: str, pdf_path: Path) -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_content(html_content, wait_until="networkidle")
        await page.pdf(
            path=str(pdf_path),
            format="A4",
            margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
            print_background=True,
        )
        await browser.close()


def generate_audit_pdf(
    lead: dict,
    audit,
    screenshot: Path | None = None,
    mobile_screenshot: Path | None = None,
) -> Path:
    """يكوّن PDF احترافي ويرجع المسار."""
    pdf_path = pdf_path_for_lead(lead)
    desktop = screenshot
    mobile = mobile_screenshot
    if not desktop and audit.signals.get("screenshot"):
        desktop = Path(audit.signals["screenshot"])
    if not mobile and audit.signals.get("mobile_screenshot"):
        mobile = Path(audit.signals["mobile_screenshot"])
    html_content = _render_html(lead, audit, desktop, mobile)
    asyncio.run(_html_to_pdf(html_content, pdf_path))
    return pdf_path
