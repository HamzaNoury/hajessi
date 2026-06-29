"""
AI Lead Gen Agent
=================
يقلب على شركات فـ Google Maps → يحلل الموقع → يكتب ميساج واتساب بالدارجة → يصيفطو أوتوماتيك

Requirements:
    pip install googlemaps requests pandas supabase playwright python-dotenv
    playwright install chromium
"""

import asyncio
import base64
import csv
import hashlib
import json
import logging
import os
import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import quote

import googlemaps
import googlemaps.exceptions as gmaps_errors
import requests
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from supabase import create_client, Client

from audit_engine import (
    CATEGORY_LABELS,
    DeepAuditExtras,
    finalize_deep_audit,
)
from audit_pdf import generate_audit_pdf, mobile_screenshot_path_for_lead, screenshot_path_for_lead

load_dotenv(Path(__file__).parent / ".env")

# ─────────────────────────────────────────────
#  Logging
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("lead_gen.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ─────────────────────────────────────────────
#  Config  (ضع المفاتيح فـ .env أو هنا مباشرة للتجربة)
# ─────────────────────────────────────────────
GOOGLE_MAPS_API_KEY   = os.getenv("GOOGLE_MAPS_API_KEY", "YOUR_GOOGLE_MAPS_KEY")
CURSOR_API_KEY        = os.getenv("CURSOR_API_KEY",        "YOUR_CURSOR_API_KEY")
CURSOR_MODEL          = os.getenv("CURSOR_MODEL",          "composer-2.5")
CURSOR_API_BASE       = "https://api.cursor.com"
SUPABASE_URL          = os.getenv("SUPABASE_URL",         "YOUR_SUPABASE_URL")
SUPABASE_KEY          = os.getenv("SUPABASE_KEY",         "YOUR_SUPABASE_ANON_KEY")
WA_TOKEN              = os.getenv("WA_TOKEN",             "YOUR_WHATSAPP_BEARER_TOKEN")
WA_PHONE_NUMBER_ID    = os.getenv("WA_PHONE_NUMBER_ID",   "YOUR_PHONE_NUMBER_ID")
GOOGLE_SHEET_WEBAPP_URL = os.getenv("GOOGLE_SHEET_WEBAPP_URL", "")
GOOGLE_SHEET_ID         = os.getenv("GOOGLE_SHEET_ID", "")

DELAY_BETWEEN_MESSAGES = 60   # ثانية بين كل ميساج
CSV_OUTPUT             = Path("leads_output.csv")
_WA_TOKEN_WARNED       = False


def _supabase_project_ref(url: str) -> str:
    if "supabase.co" not in url:
        return ""
    return url.removeprefix("https://").removeprefix("http://").split(".")[0]


def _jwt_project_ref(key: str) -> str:
    try:
        payload = key.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        data = json.loads(base64.urlsafe_b64decode(payload))
        return data.get("ref", "")
    except Exception:
        return ""


def _is_valid_supabase_key(key: str) -> bool:
    """Supabase anon/service keys are JWT tokens (~200+ chars, start with eyJ)."""
    return key.startswith("eyJ") and len(key) > 100


def _supabase_url_key_match() -> bool:
    return _supabase_project_ref(SUPABASE_URL) == _jwt_project_ref(SUPABASE_KEY)


def _check_env(require_maps: bool = False, require_supabase: bool = False) -> bool:
    """يتحقق من المفاتيح قبل التشغيل. يرجع False إلا كان شي مشكل."""
    ok = True

    if require_supabase:
        if not SUPABASE_URL.startswith("https://") or "supabase.co" not in SUPABASE_URL:
            print("❌ SUPABASE_URL غالط — خاصو يكون https://xxxx.supabase.co")
            ok = False
        if not _is_valid_supabase_key(SUPABASE_KEY):
            print(
                "❌ SUPABASE_KEY غالط أو ناقص\n"
                "   روح: Supabase → Project Settings → API\n"
                "   انسخ: anon public key (يبدا بـ eyJ... وطويل ~200 حرف)\n"
                "   حطو فـ lead_gen/.env → SUPABASE_KEY=..."
            )
            ok = False
        elif not _supabase_url_key_match():
            url_ref = _supabase_project_ref(SUPABASE_URL)
            key_ref = _jwt_project_ref(SUPABASE_KEY)
            print(
                "❌ SUPABASE_URL و SUPABASE_KEY من projects مختلفين\n"
                f"   URL project: {url_ref or '?'}\n"
                f"   Key project: {key_ref or '?'}\n"
                f"   صحح URL إلى: https://{key_ref}.supabase.co\n"
                "   أو انسخ anon key من نفس project اللي فـ URL"
            )
            ok = False

    if require_maps:
        if not GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY.startswith("your_"):
            print("❌ GOOGLE_MAPS_API_KEY ناقص فـ .env")
            ok = False

    return ok


def _verify_cursor_key() -> bool:
    """يتأكد أن مفتاح Cursor API صالح."""
    if not CURSOR_API_KEY or not CURSOR_API_KEY.startswith("crsr_"):
        print(
            "❌ CURSOR_API_KEY غالط أو ناقص\n"
            "   خاصو يبدا بـ crsr_...\n"
            "   جبدو من: https://cursor.com/dashboard → API Keys → New API Key"
        )
        return False
    try:
        resp = requests.get(
            f"{CURSOR_API_BASE}/v1/me",
            headers={"Authorization": f"Bearer {CURSOR_API_KEY}"},
            timeout=15,
        )
        if resp.status_code == 401:
            print("❌ Cursor: مفتاح API غالط — أنشئ مفتاح جديد من Dashboard")
            return False
        resp.raise_for_status()
        return True
    except requests.RequestException as e:
        print(f"❌ Cursor API error: {e}")
        return False


def _cursor_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {CURSOR_API_KEY}",
        "Content-Type": "application/json",
    }


def _wait_for_cursor_run(agent_id: str, run_id: str, timeout: int = 180) -> str:
    """يستنى حتى يكمل Cloud Agent ويرجع النص."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        resp = requests.get(
            f"{CURSOR_API_BASE}/v1/agents/{agent_id}/runs/{run_id}",
            headers=_cursor_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        run = resp.json()
        status = run.get("status", "")
        if status == "FINISHED":
            return (run.get("result") or "").strip()
        if status in ("FAILED", "CANCELLED", "ERROR"):
            raise RuntimeError(f"Cursor run {status}: {run}")
        time.sleep(3)
    raise TimeoutError(f"Cursor run timeout بعد {timeout}s")


def _get_supabase() -> Client:
    if not _check_env(require_supabase=True):
        raise SystemExit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ─────────────────────────────────────────────
#  1. Google Maps Scraper
# ─────────────────────────────────────────────
def search_maps(query: str, location: str, max_results: int = 50) -> list[dict]:
    """
    تقلب على businesses فـ Google Maps وتجبد البيانات الأساسية.

    Args:
        query:       نوع النشاط  مثلا "صالونات حلاقة"
        location:    المدينة     مثلا "أكادير"
        max_results: حد أقصى للنتائج

    Returns:
        ليستة ديال dicts فيهم: name, phone, email, website, rating, address
    """
    gmaps  = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
    leads: list[dict] = []

    log.info(f"🔍 البحث عن '{query}' فـ '{location}' ...")

    try:
        geo = gmaps.geocode(location)
    except gmaps_errors.ApiError as e:
        _handle_maps_api_error(e)
        return leads

    if not geo:
        log.error(f"ما لقيناش الموقع: {location}")
        return leads

    lat = geo[0]["geometry"]["location"]["lat"]
    lng = geo[0]["geometry"]["location"]["lng"]

    try:
        search_result = gmaps.places(query=f"{query} {location}", location=(lat, lng))
    except gmaps_errors.ApiError as e:
        _handle_maps_api_error(e)
        return leads

    while search_result and len(leads) < max_results:
        for place in search_result.get("results", []):
            if len(leads) >= max_results:
                break

            place_id = place.get("place_id")
            details  = gmaps.place(
                place_id,
                fields=["name", "formatted_phone_number", "website", "rating", "formatted_address"],
            ).get("result", {})

            lead = {
                "business_name": details.get("name", ""),
                "phone":         _clean_phone(details.get("formatted_phone_number", "")),
                "email":         "",           # Google Maps ما عندوش email مباشرة
                "website":       details.get("website", ""),
                "rating":        details.get("rating", 0),
                "address":       details.get("formatted_address", ""),
                "problems_found": "",
                "message_sent":  "",
                "status":        "new",
                "created_at":    datetime.now(timezone.utc).isoformat(),
            }
            leads.append(lead)
            log.info(f"  ✅ {lead['business_name']} — {lead['phone']}")

        # Next page
        next_page_token = search_result.get("next_page_token")
        if next_page_token and len(leads) < max_results:
            time.sleep(3)  # Google يحتاج 2-3s قبل next page
            try:
                search_result = gmaps.places(page_token=next_page_token)
            except gmaps_errors.ApiError as e:
                log.warning(f"Pagination stopped: {e}")
                break
        else:
            break

    log.info(f"📦 لقينا {len(leads)} lead")

    # ─── حفظ فـ CSV
    _save_to_csv(leads)

    # ─── حفظ فـ Supabase
    _save_to_supabase(leads)

    return leads


def _handle_maps_api_error(error: gmaps_errors.ApiError) -> None:
    """رسالة واضحة فـ حالة مشاكل Google Maps API."""
    msg = str(error)
    log.error(f"Google Maps API error: {msg}")

    if "REQUEST_DENIED" in msg:
        if "Billing" in msg or "billing" in msg:
            print(
                "\n❌ Google Maps: خاصك تفعّل Billing فـ Google Cloud\n"
                "   1. روح: https://console.cloud.google.com/billing\n"
                "   2. ربط بطاقة بنكية (عندهم $200 free credit/شهر)\n"
                "   3. فعّل: Geocoding API + Places API\n"
                "      https://console.cloud.google.com/apis/library\n"
                "   4. تأكد API Key ديالك مربوط بنفس الـ project\n"
            )
        else:
            print(
                "\n❌ Google Maps: REQUEST_DENIED\n"
                "   تأكد من: Billing مفعّل + Geocoding API + Places API\n"
            )
    elif "OVER_QUERY_LIMIT" in msg:
        print("\n❌ وصلت للحد ديال الطلبات — استنى شوية أو زيد الـ quota")
    elif "INVALID_REQUEST" in msg:
        print("\n❌ طلب غير صالح — تحقق من query و location")


def _clean_phone(phone: str) -> str | None:
    """يحول الأرقام لصيغة دولية بدون مسافات."""
    cleaned = "".join(c for c in (phone or "") if c.isdigit() or c == "+")
    if not cleaned:
        return None
    # المغرب: 0612345678 → 212612345678
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "212" + cleaned[1:]
    return cleaned


def _normalize_name(name: str) -> str:
    """اسم موحّد للمقارنة (بدون تشكيل/فراغات زايدة)."""
    text = (name or "").lower().strip()
    for old, new in [("é", "e"), ("è", "e"), ("ê", "e"), ("à", "a"), ("ù", "u"), ("ô", "o"), ("ï", "i"), ("ç", "c")]:
        text = text.replace(old, new)
    return " ".join(text.split())


def _merge_lead_rows(primary: dict, secondary: dict) -> dict:
    """يدمج صفّين لنفس البزنس — يحتفظ بالبيانات الأكمل."""
    merged = dict(primary)
    for key, value in secondary.items():
        if value in (None, "", 0, 0.0):
            continue
        current = merged.get(key)
        if key == "business_name" and len(str(value)) > len(str(current or "")):
            merged[key] = value
        elif key == "rating" and float(value or 0) > float(current or 0):
            merged[key] = value
        elif key in ("website", "address", "email", "phone") and not current:
            merged[key] = value
    return merged


def _normalize_leads(leads: list[dict]) -> list[dict]:
    """ينظف الأرقام ويدمج التكرار (نفس الهاتف أو نفس الاسم)."""
    by_phone: dict[str, dict] = {}
    by_name: dict[str, dict] = {}

    for lead in leads:
        row = dict(lead)
        row["phone"] = _clean_phone(row.get("phone", ""))

        if row["phone"]:
            if row["phone"] in by_phone:
                by_phone[row["phone"]] = _merge_lead_rows(by_phone[row["phone"]], row)
            else:
                by_phone[row["phone"]] = row
            continue

        name_key = _normalize_name(row.get("business_name", ""))
        if not name_key:
            continue
        if name_key in by_name:
            by_name[name_key] = _merge_lead_rows(by_name[name_key], row)
        else:
            by_name[name_key] = row

    phone_names = {_normalize_name(r.get("business_name", "")) for r in by_phone.values()}
    merged = list(by_phone.values()) + [
        row for name_key, row in by_name.items() if name_key not in phone_names
    ]
    if len(merged) < len(leads):
        log.info(f"  🔄 دمجنا {len(leads) - len(merged)} lead مكرر فنفس الدفعة")
    return merged


def _save_to_csv(leads: list[dict]) -> None:
    """يحفظ الـ leads فـ CSV."""
    if not leads:
        return
    fieldnames = list(leads[0].keys())
    write_header = not CSV_OUTPUT.exists()
    with CSV_OUTPUT.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()
        writer.writerows(leads)
    log.info(f"💾 حفظ فـ {CSV_OUTPUT}")


def _is_sheets_configured() -> bool:
    url = GOOGLE_SHEET_WEBAPP_URL.strip()
    return bool(url) and url.startswith("http") and "your_" not in url and "VOTRE" not in url


def _whatsapp_url(phone: str, message: str = "") -> str:
    """رابط wa.me للإرسال المباشر من واتساب."""
    digits = "".join(c for c in (phone or "") if c.isdigit())
    if not digits:
        return ""
    url = f"https://wa.me/{digits}"
    if message:
        url += f"?text={quote(message)}"
    return url


def _enrich_lead_for_sheet(lead: dict) -> dict:
    """يزيد رابط واتساب مباشر قبل المزامنة مع Sheets."""
    enriched = dict(lead)
    # رابط بلا نص مسبق — الميساج كاين فـ عمود Message؛ النص فـ HYPERLINK كيطوّل البالص
    enriched["whatsapp_link"] = _whatsapp_url(lead.get("phone", ""))
    return enriched


def _sheets_payload(extra: dict | None = None) -> dict:
    payload = {"spreadsheet_id": GOOGLE_SHEET_ID} if GOOGLE_SHEET_ID else {}
    if extra:
        payload.update(extra)
    return payload


def _sync_lead_to_sheet(lead: dict) -> bool:
    """يرفع/يحدّث lead واحد فـ Google Sheets (upsert بالهاتف)."""
    if not _is_sheets_configured():
        return False
    if not GOOGLE_SHEET_ID:
        log.error("GOOGLE_SHEET_ID ناقص فـ .env — انسخ ID من رابط Google Sheet")
        return False
    try:
        resp = requests.post(
            GOOGLE_SHEET_WEBAPP_URL,
            json=_sheets_payload({"action": "upsert_lead", **_enrich_lead_for_sheet(lead)}),
            timeout=30,
            allow_redirects=True,
        )
        resp.raise_for_status()
        text = resp.text.strip()
        if not text or text.startswith("<!DOCTYPE") or text.startswith("<html"):
            log.error("Google Sheets: Apps Script رجع HTML — الصق الكود من google-apps-script.js و Deploy من جديد")
            return False
        data = resp.json()
        if not data.get("success"):
            log.error(f"Sheets error: {data}")
            return False
        return True
    except Exception as e:
        log.error(f"Google Sheets sync error: {e}")
        return False


def _sync_leads_to_sheet(leads: list[dict]) -> None:
    """يرفع ليستة leads لـ Google Sheets."""
    if not leads or not _is_sheets_configured():
        return
    if not GOOGLE_SHEET_ID:
        log.error("GOOGLE_SHEET_ID ناقص فـ .env")
        return
    enriched = [_enrich_lead_for_sheet(l) for l in leads]
    for action in ("rewrite_all", "upsert_leads"):
        try:
            resp = requests.post(
                GOOGLE_SHEET_WEBAPP_URL,
                json=_sheets_payload({"action": action, "leads": enriched}),
                timeout=120,
                allow_redirects=True,
            )
            resp.raise_for_status()
            text = resp.text.strip()
            if not text or text.startswith("<!DOCTYPE") or text.startswith("<html"):
                if action == "rewrite_all":
                    log.warning("Sheets rewrite_all غير متاح — جرب upsert (Deploy جديد لـ Apps Script)")
                    continue
                log.error("Google Sheets batch: Apps Script رجع HTML — الصق الكود و Deploy من جديد")
                return
            data = resp.json()
            if data.get("success"):
                log.info(f"📊 رفع {data.get('count', len(leads))} leads لـ Google Sheets ({action})")
                return
            log.error(f"Sheets batch error: {data}")
            return
        except Exception as e:
            if action == "rewrite_all":
                log.warning(f"Sheets rewrite_all: {e}")
                continue
            log.error(f"Google Sheets batch error: {e}")
            for lead in leads:
                _sync_lead_to_sheet(lead)


def sync_all_leads_to_sheet() -> None:
    """يجيب كل الـ leads من Supabase ويرفعهم لـ Google Sheets."""
    if not _is_sheets_configured():
        print(
            "❌ GOOGLE_SHEET_WEBAPP_URL ناقص فـ .env\n"
            "   شوف lead_gen/google-apps-script.js للتعليمات"
        )
        raise SystemExit(1)
    sb = _get_supabase()
    result = sb.table("leads").select("*").order("id").execute()
    leads = result.data or []
    if not leads:
        print("ما كاين حتى lead فـ Supabase.")
        return
    _sync_leads_to_sheet(leads)
    # تحقق
    try:
        resp = requests.get(
            f"{GOOGLE_SHEET_WEBAPP_URL}?action=list&spreadsheet_id={GOOGLE_SHEET_ID}",
            timeout=30,
            allow_redirects=True,
        )
        count = len(resp.json().get("leads", []))
        print(f"✅ Google Sheet فيه دابا {count} صف")
    except Exception:
        print(f"✅ تصيفط {len(leads)} lead لـ Google Sheets")


def _update_lead(sb: Client, lead: dict, lead_id: int, updates: dict) -> dict | None:
    """يحدّث Supabase و Google Sheets معاً — ما يوقفش البايبلاين إلا فشل الحفظ."""
    merged = {**lead, **updates}
    try:
        sb.table("leads").update(updates).eq("id", lead_id).execute()
    except Exception as e:
        log.error(f"  ❌ Supabase update error: {e}")
        return None
    if _sync_lead_to_sheet(merged):
        log.info("  📊 محدّث فـ Google Sheets")
    return merged


def _upsert_leads_to_supabase(sb: Client, leads: list[dict]) -> int:
    """Upsert مع fallback صفّ بصفّ إلا فشلت الدفعة."""
    rows = [{k: v for k, v in lead.items() if k != "id"} for lead in leads]
    try:
        sb.table("leads").upsert(rows, on_conflict="phone").execute()
        return len(rows)
    except Exception as e:
        if "21000" not in str(e) and "duplicate" not in str(e).lower():
            raise
        log.warning("Supabase batch upsert فيه تكرار — كنحفظو صفّ بصفّ")
        saved = 0
        for row in rows:
            try:
                sb.table("leads").upsert(row, on_conflict="phone").execute()
                saved += 1
            except Exception as row_err:
                log.warning(f"  تخطّينا {row.get('business_name', '?')}: {row_err}")
        return saved


def _save_to_supabase(leads: list[dict]) -> None:
    """يحفظ الـ leads فـ Supabase (upsert بناءً على phone)."""
    if not leads:
        return
    leads = _normalize_leads(leads)
    if not _is_valid_supabase_key(SUPABASE_KEY):
        log.error("Supabase key غالط — ما حفظناش. صحح SUPABASE_KEY فـ .env")
        _sync_leads_to_sheet(leads)
        return
    sb: Client | None = None
    try:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        count = _upsert_leads_to_supabase(sb, leads)
        log.info(f"☁️  رفع {count} leads لـ Supabase")
    except Exception as e:
        log.error(f"Supabase error: {e}")
        if "401" in str(e) or "Invalid API key" in str(e):
            print(
                "\n❌ Supabase: مفتاح API غالط\n"
                "   Project Settings → API → anon public → انسخ المفتاح كامل فـ .env\n"
            )
        elif sb:
            for lead in leads:
                try:
                    sb.table("leads").upsert(lead, on_conflict="phone").execute()
                except Exception:
                    pass
    _sync_leads_to_sheet(leads)


# ─────────────────────────────────────────────
#  2. Website Analyzer & Business Audit
# ─────────────────────────────────────────────

BUSINESS_TYPE_KEYWORDS: dict[str, list[str]] = {
    "education": [
        "école", "ecole", "school", "مؤسسة", "مدرسة", "تربوية", "collège", "college",
        "institution", "enigma", "omega", "amal", "tarik", "bounouni",
    ],
    "beauty": ["barber", "salon", "coiffure", "حلاقة", "صالون", "manucure", "hair", "barbershop"],
    "food": ["restaurant", "café", "cafe", "pizza", "مطعم", "snack"],
    "health": ["clinique", "dentist", "pharmacie", "صيدلية", "médecin"],
}

OFFLINE_PROBLEMS: dict[str, list[str]] = {
    "education": [
        "ما عندهمش موقع ويب — الأولياء ماكيجيوش يتفرجو فالبرامج والأثمنة أونلاين",
        "ما كاينش صفحة تسجيل أو فورم للمستجدين",
        "الحضور الرقمي ضعيف — المنافسة فالمدارس الخاصة كتبان أحسن فـ Google",
    ],
    "beauty": [
        "ما عندهمش موقع يوري الخدمات، الأسعار، والصور ديال الأعمال",
        "الزبناء الجداد ماكيلقاوش مباشرة كيفاش يحجزو",
        "فرصة ضائعة فـ Google — الناس كتقلب 'صالون قريب مني' وما كيلقاوش تفاصيل",
    ],
    "food": [
        "ما عندهمش موقع فيه المنيو والأثمنة",
        "ما كاينش طريقة واضحة للطلب أو الحجز أونلاين",
    ],
    "health": [
        "ما عندهمش موقع يشرح الخدمات وساعات العمل",
        "المرضى ماكيلقاوش مباشرة معلومات الثقة والتخصص",
    ],
    "local": [
        "ما عندهمش موقع ويب — الحضور الرقمي محدود لـ Google Maps فقط",
        "الزبناء ما كيجيوش يعرفو الخدمات قبل ما يتصلو",
    ],
}

OPENING_HINTS = [
    "ابتدأ بـ 'السلام عليكم' واسم المحل",
    "ابتدأ بـ 'Salam' واسم المحل بشكل ودي",
    "ابتدأ بسؤال قصير مرتبط بنشاطهم",
    "ابتدأ بملاحظة محددة على نشاطهم فالحي",
]


@dataclass
class LeadFilters:
    min_rating: float = 0.0
    require_phone: bool = False
    no_website_only: bool = False


def _passes_lead_filters(lead: dict, filters: LeadFilters | None) -> bool:
    if not filters:
        return True
    if filters.require_phone and not lead.get("phone"):
        return False
    if filters.no_website_only and (lead.get("website") or "").strip():
        return False
    if filters.min_rating > 0 and float(lead.get("rating") or 0) < filters.min_rating:
        return False
    return True


@dataclass
class BusinessAudit:
    business_type: str
    problems: list[str] = field(default_factory=list)
    strengths: list[str] = field(default_factory=list)
    signals: dict = field(default_factory=dict)
    score: int = 0
    summary: str = ""
    category_scores: dict[str, int] = field(default_factory=dict)
    recommendations: list = field(default_factory=list)
    executive_summary: str = ""
    checks_passed: list[str] = field(default_factory=list)
    checks_failed: list[str] = field(default_factory=list)


def infer_business_type(name: str, address: str = "") -> str:
    text = f"{name} {address}".lower()
    for btype, keywords in BUSINESS_TYPE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return btype
    return "local"


def _pick_variants(seed: str, options: list[str], count: int) -> list[str]:
    if not options:
        return []
    start = int(hashlib.md5(seed.encode()).hexdigest(), 16) % len(options)
    picked: list[str] = []
    for i in range(min(count, len(options))):
        picked.append(options[(start + i) % len(options)])
    return picked


def _offline_presence_audit(lead: dict, biz_type: str) -> list[str]:
    seed = lead.get("business_name", "")
    base = _pick_variants(seed, OFFLINE_PROBLEMS.get(biz_type, OFFLINE_PROBLEMS["local"]), 2)
    problems = list(base)

    rating = float(lead.get("rating") or 0)
    if 0 < rating < 4.0:
        problems.append(f"تقييم Google Maps منخفض ({rating}/5) — كيأثر على قرار الأولياء/الزبناء")
    if not lead.get("phone"):
        problems.append("رقم التواصل ما باينش فـ Google Maps — صعب التواصل المباشر")
    if lead.get("address") and "google" not in (lead.get("website") or "").lower():
        problems.append(f"العنوان موجود ({lead['address'][:40]}...) ولكن ما كاينش دليل رقمي يوجه الزوار")

    return list(dict.fromkeys(problems))


def _build_audit_summary(name: str, audit: BusinessAudit) -> str:
    parts = [f"[{audit.score}/100]"]
    if audit.executive_summary:
        parts.append(audit.executive_summary[:200])
    elif audit.problems:
        parts.append("تحسينات: " + " | ".join(audit.problems[:5]))
    if audit.category_scores:
        weak = sorted(audit.category_scores.items(), key=lambda x: x[1])[:2]
        parts.append("ضعيف: " + ", ".join(f"{CATEGORY_LABELS.get(k,k)} {v}" for k, v in weak))
    return " — ".join(parts)


def audit_business(lead: dict) -> BusinessAudit:
    """أوديت رقمي معمّق — موقع + Google Maps + scores بالفئات."""
    name = lead.get("business_name", "")
    website = (lead.get("website") or "").strip()
    address = lead.get("address", "")
    biz_type = infer_business_type(name, address)
    raw_problems: list[str] = []
    strengths: list[str] = []
    signals: dict = {
        "business_type": biz_type,
        "rating": lead.get("rating"),
        "address": address,
        "has_website": bool(website),
        "has_phone": bool(lead.get("phone")),
        "has_address": bool(address),
    }

    if website:
        shot = screenshot_path_for_lead(lead) if lead.get("id") else None
        mob_shot = mobile_screenshot_path_for_lead(lead) if lead.get("id") else None
        raw_problems, site_signals = analyze_website(
            website, biz_type, screenshot_path=shot, mobile_screenshot_path=mob_shot,
        )
        signals.update(site_signals)
        if shot and shot.exists():
            signals["screenshot"] = str(shot)
        if mob_shot and mob_shot.exists():
            signals["mobile_screenshot"] = str(mob_shot)
    else:
        raw_problems.extend(_offline_presence_audit(lead, biz_type))

    rating = float(lead.get("rating") or 0)
    if rating >= 4.5:
        strengths.append(f"تقييم Google Maps مزيان ({rating}/5)")
    elif rating >= 4.0:
        strengths.append(f"تقييم Google Maps جيد ({rating}/5)")

    if signals.get("load_time_s") and signals["load_time_s"] < 2.5:
        strengths.append(f"سرعة تحميل جيدة ({signals['load_time_s']}s)")
    if signals.get("has_whatsapp"):
        strengths.append("زر واتساب موجود")
    if signals.get("is_https"):
        strengths.append("الموقع محمي بـ HTTPS")

    score, cat_scores, recs, extras, problems = finalize_deep_audit(
        signals, biz_type, bool(website), lead, raw_problems, strengths,
    )

    audit = BusinessAudit(
        business_type=biz_type,
        problems=problems,
        strengths=strengths,
        signals=signals,
        score=score,
        category_scores=cat_scores,
        recommendations=recs,
        executive_summary=extras.executive_summary,
        checks_passed=extras.checks_passed,
        checks_failed=extras.checks_failed,
    )
    audit.summary = _build_audit_summary(name, audit)
    return audit


async def _analyze_website_async(
    url: str,
    biz_type: str = "local",
    screenshot_path: Path | None = None,
    mobile_screenshot_path: Path | None = None,
) -> tuple[list[str], dict]:
    """فحص معمّق: SEO, perf, mobile, conversion, trust."""
    problems: list[str] = []
    signals: dict = {"url": url, "is_https": url.startswith("https")}

    if not url:
        problems.append("ما عندوش موقع ويب")
        return problems, signals

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        desktop_ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        )
        page = await desktop_ctx.new_page()

        start_ms = time.monotonic() * 1000
        try:
            response = await page.goto(url, timeout=20_000, wait_until="domcontentloaded")
            load_time = (time.monotonic() * 1000) - start_ms
            signals["load_time_s"] = round(load_time / 1000, 2)
            signals["http_status"] = response.status if response else 0
        except Exception as e:
            await browser.close()
            problems.append(f"الموقع ما بانش أو بطيء بزاف ({type(e).__name__})")
            return problems, signals

        if signals.get("http_status", 200) >= 400:
            problems.append(f"الموقع رجع خطأ HTTP {signals['http_status']}")

        content = await page.content()
        page_text = content.lower()
        signals["page_text_sample"] = page_text[:8000]
        signals["page_weight_kb"] = round(len(content.encode("utf-8")) / 1024, 1)
        signals["content_words"] = len(re.findall(r"\w+", page_text))

        title = await page.title()
        signals["title"] = (title or "")[:120]
        signals["has_title"] = bool(title and len(title) >= 5)
        signals["title_len"] = len(title or "")

        if load_time > 4000:
            problems.append(f"بطء تحميل: {load_time/1000:.1f}s (المعيار < 3s)")
        if signals["page_weight_kb"] > 2500:
            problems.append(f"الصفحة ثقيلة ({signals['page_weight_kb']} KB) — كتأثر على الموبايل")

        # ── SEO
        signals["has_viewport"] = "viewport" in content
        if not signals["has_viewport"]:
            problems.append("ما عندوش viewport — الموقع مو متوافق مع الموبايل")

        signals["has_meta_description"] = await page.locator('meta[name="description"]').count() > 0
        if not signals["has_meta_description"]:
            problems.append("ما عندوش meta description — ضعيف فنتائج Google")

        meta_desc = ""
        if signals["has_meta_description"]:
            meta_desc = await page.locator('meta[name="description"]').first.get_attribute("content") or ""
            signals["meta_desc_len"] = len(meta_desc)

        signals["has_canonical"] = await page.locator('link[rel="canonical"]').count() > 0
        signals["has_og_tags"] = await page.locator('meta[property^="og:"]').count() >= 2
        if not signals["has_og_tags"]:
            problems.append("ما عندوش Open Graph — المشاركة فالسوشيال كتبان بلا صورة")

        signals["has_lang"] = bool(re.search(r'<html[^>]+lang=', content, re.I))
        h1_count = await page.locator("h1").count()
        signals["h1_count"] = h1_count
        if h1_count == 0:
            problems.append("ما كاينش H1 — محركات البحث ما تفهمش الموضوع الرئيسي")
        elif h1_count > 1:
            problems.append(f"كاين {h1_count} عناوين H1 — خاص يكون واحد فقط")

        imgs = await page.locator("img").count()
        imgs_no_alt = await page.locator("img:not([alt]), img[alt='']").count()
        signals["images"] = imgs
        signals["images_no_alt_ratio"] = (imgs_no_alt / imgs) if imgs else 0
        if imgs > 3 and signals["images_no_alt_ratio"] > 0.5:
            problems.append(f"{imgs_no_alt}/{imgs} صور بلا alt text — SEO ضعيف")

        signals["has_structured_data"] = "application/ld+json" in content or "schema.org" in page_text

        # ── Conversion
        wa_keywords = ["wa.me", "whatsapp", "api.whatsapp"]
        signals["has_whatsapp"] = any(kw in page_text for kw in wa_keywords)
        if not signals["has_whatsapp"]:
            problems.append("ما عندوش زر واتساب — قناة التواصل #1 فالمغرب")

        signals["has_tel_link"] = await page.locator('a[href^="tel:"]').count() > 0
        signals["has_email"] = bool(re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", page_text))
        if not signals["has_tel_link"] and not signals["has_whatsapp"]:
            problems.append("ما كاينش رقم هاتف قابل للنقر (click-to-call)")

        forms = await page.locator("form").count()
        signals["forms_count"] = forms
        booking_kw = ["reserv", "book", "حجز", "rendez", "appointment", "inscription", "تسجيل", "rdv", "موعد"]
        signals["has_booking"] = any(kw in page_text for kw in booking_kw)
        cta_kw = ["contact", "تواصل", "احجز", "حجز", "inscription", "تسجيل", "commander", "طلب"]
        signals["has_cta"] = any(kw in page_text for kw in cta_kw)
        if forms == 0 and not signals["has_booking"]:
            problems.append("ما عندوش فورم تواصل/حجز — كيخسر leads")

        # ── Trust & social
        signals["has_facebook"] = "facebook.com" in page_text
        signals["has_instagram"] = "instagram.com" in page_text
        if not signals["has_facebook"] and not signals["has_instagram"]:
            problems.append("ما عندوش روابط فيسبوك/إنستغرام")

        signals["has_favicon"] = await page.locator('link[rel*="icon"]').count() > 0
        signals["has_maps_embed"] = "google.com/maps" in page_text or "maps.google" in page_text
        about_kw = ["about", "à propos", "من نحن", "qui sommes"]
        signals["has_about_page"] = any(kw in page_text for kw in about_kw)

        year_match = re.search(r"20(1[89]|2[0-5])", content)
        signals["copyright_year"] = int(year_match.group(0)) if year_match else None
        if signals["copyright_year"] and signals["copyright_year"] < 2023:
            problems.append(f"محتوى قديم (copyright {signals['copyright_year']}) — كيبان الموقع مهمل")

        signals["has_analytics"] = "gtag" in page_text or "google-analytics" in page_text or "fbq(" in page_text

        if not url.startswith("https"):
            problems.append("الموقع بلا HTTPS — المتصفح كيبان 'غير آمن'")

        # ── Industry content
        bench = {
            "education": ["programme", "tarif", "inscription", "أثمنة", "تسجيل"],
            "beauty": ["prix", "tarif", "service", "حجز", "galerie"],
            "food": ["menu", "منيو", "carte", "commande"],
            "health": ["rendez", "حجز", "horaire", "ساعات"],
        }.get(biz_type, ["contact", "خدمات"])
        missing = [kw for kw in bench if kw not in page_text]
        if missing:
            problems.append(f"محتوى ناقص لقطاعك: {', '.join(missing[:4])}")

        # ── Desktop screenshot
        if screenshot_path:
            try:
                await page.screenshot(path=str(screenshot_path), full_page=False)
                signals["screenshot"] = str(screenshot_path)
            except Exception as e:
                log.warning(f"Desktop screenshot failed: {e}")

        # ── Mobile analysis
        mobile_ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        )
        mobile_page = await mobile_ctx.new_page()
        try:
            await mobile_page.goto(url, timeout=15_000, wait_until="domcontentloaded")
            overflow = await mobile_page.evaluate(
                "() => document.documentElement.scrollWidth > window.innerWidth + 10"
            )
            signals["mobile_overflow"] = bool(overflow)
            if overflow:
                problems.append("المحتوى كيتجاوز عرض الشاشة فالموبايل — scroll أفقي")

            body_font = await mobile_page.evaluate(
                "() => parseFloat(getComputedStyle(document.body).fontSize) || 16"
            )
            signals["font_too_small"] = body_font < 14
            if signals["font_too_small"]:
                problems.append(f"خط صغير فالموبايل ({body_font}px) — صعب القراءة")

            if mobile_screenshot_path:
                await mobile_page.screenshot(path=str(mobile_screenshot_path), full_page=False)
                signals["mobile_screenshot"] = str(mobile_screenshot_path)
        except Exception as e:
            log.warning(f"Mobile analysis failed: {e}")
        finally:
            await mobile_ctx.close()

        await browser.close()

    return list(dict.fromkeys(problems)), signals


def analyze_website(
    url: str,
    biz_type: str = "local",
    screenshot_path: Path | None = None,
    mobile_screenshot_path: Path | None = None,
) -> tuple[list[str], dict]:
    try:
        return asyncio.run(
            _analyze_website_async(url, biz_type, screenshot_path, mobile_screenshot_path)
        )
    except Exception as e:
        log.error(f"Website analysis error for {url}: {e}")
        return [f"ما قدرناش نحللو الموقع: {e}"], {}


# ─────────────────────────────────────────────
#  3. Cursor Message Writer
# ─────────────────────────────────────────────
def generate_message_template(lead: dict, audit: BusinessAudit) -> str:
    """ميساج بالدارجة بلا API — مخصص حسب نوع النشاط."""
    name = lead.get("business_name", "")
    address = (lead.get("address") or "")[:50]
    variant = int(hashlib.md5(name.encode()).hexdigest(), 16) % 3
    problems = audit.problems or ["الحضور الرقمي محدود"]
    p1, p2 = problems[0], problems[1] if len(problems) > 1 else problems[0]

    if audit.business_type == "education":
        openings = [
            f"السلام عليكم، معاكم من جهة {name}.",
            f"Salam 3likom، كنت كنتفرج فالمدارس فـ {address or 'المنطقة ديالكم'}.",
            f"السلام، {name} — سؤال سريع على التسجيل والمستجدين.",
        ]
    elif audit.business_type == "beauty":
        openings = [
            f"السلام عليكم {name}، كيف داير؟",
            f"Salam {name}، شفت البروفايل ديالكم فـ Google.",
            f"السلام، {name} — لقيت المحل ديالكم فـ {address or 'الحي'}.",
        ]
    else:
        openings = [
            f"السلام عليكم {name}، كيف داير؟",
            f"Salam 3likom، {name}.",
            f"السلام، معاكم على {name}.",
        ]

    opening = openings[variant]
    closings = [
        "عندي فيديو تحليل مجاني (فابور) — واش نقدر نصيفطو ليكم؟",
        "نقدر نصيفط ليكم تحليل قصير مجاني على الحضور الرقمي — إلا بغيتو.",
        "واش نقدر نشارك معاكم فيديو تحليل خاص بـ {name} بلا مقابل؟".format(name=name),
    ]

    return (
        f"{opening}\n"
        f"لاحظت: {p1}.\n"
        f"وكاين حتى: {p2}.\n"
        f"{closings[variant]}"
    )


def generate_message(lead: dict, audit: BusinessAudit, use_template: bool = False) -> str:
    """
    يولد ميساج واتساب شخصي بالدارجة — مخصص لكل بزنس.

    Args:
        lead:          بيانات الـ lead كاملة
        audit:         نتيجة الأوديت الرقمي
        use_template:  استعمل ميساج جاهز بلا API

    Returns:
        الميساج النهائي
    """
    business_name = lead.get("business_name", "")
    if use_template:
        message = generate_message_template(lead, audit)
        log.info(f"✍️  ميساج template لـ {business_name}")
        return message

    problems_text = "\n".join(f"- {p}" for p in audit.problems[:8])
    strengths_text = "\n".join(f"- {s}" for s in audit.strengths[:4]) or "- ما لقيناش نقاط قوة واضحة"
    cats_text = "\n".join(
        f"- {CATEGORY_LABELS.get(k, k)}: {v}/100"
        for k, v in sorted(audit.category_scores.items(), key=lambda x: x[1])
    ) if audit.category_scores else ""
    recs_text = "\n".join(
        f"- [{r.priority.upper()}] {r.issue} → {r.action}"
        for r in (audit.recommendations or [])[:5]
    )
    opening_hint = OPENING_HINTS[int(hashlib.md5(business_name.encode()).hexdigest(), 16) % len(OPENING_HINTS)]

    type_labels = {
        "education": "مؤسسة تعليمية خاصة",
        "beauty": "صالون حلاقة/تجميل",
        "food": "مطعم/مقهى",
        "health": "خدمة صحية",
        "local": "تجارة/خدمة محلية",
    }

    prompt = f"""نتا خبير تسويق رقمي مغربي. كتكتب ميساج واتساب واحد فقط، مخصص لهاد البزنس بالذات.

═══ معلومات البزنس ═══
الاسم: {business_name}
النوع: {type_labels.get(audit.business_type, audit.business_type)}
العنوان: {lead.get("address") or "غير محدد"}
تقييم Google Maps: {lead.get("rating") or "ما كاينش"}
الموقع: {lead.get("website") or "ما عندهمش"}
نقاط الأوديت: {audit.score}/100

═══ ملخص تنفيذي ═══
{audit.executive_summary}

═══ Scores بالفئات ═══
{cats_text or "—"}

═══ نقاط القوة ═══
{strengths_text}

═══ مشاكل مكتشفة ═══
{problems_text}

═══ توصيات أولوية ═══
{recs_text or "—"}

═══ تعليمات الميساج ═══
- {opening_hint}
- 4 إلى 5 أسطر، بالدارجة المغربية الطبيعية
- ذكر مشكلتين محددين من الليستة — بصياغة مختلفة على كل مرة
- إذا عندك عنوان أو تقييم، استعملهم باش الميساج يبان شخصي ومبحوث
- ما تعاودش نفس الجملة العامة "ما عندكمش موقع ويب" بوحدها — وضّح التأثير على الزبناء/الأولياء
- اربط المشكل بنوع النشاط ({type_labels.get(audit.business_type, "")})
- عرض فيديو تحليل مجاني (فابور) فالسطر الأخير
- النبرة ودودة، مو كأنك تبيع — كأنك شفت الموقع/البروفايل بعينك
- بلا هاشتاغ، بلا إيموجي مبالغ فيها
- ما تكتبش شرح ولا عناوين — الميساج فقط"""

    log.info("  🤖 كينادي Cursor Cloud Agent...")
    resp = requests.post(
        f"{CURSOR_API_BASE}/v1/agents",
        headers=_cursor_headers(),
        json={
            "prompt": {"text": prompt},
            "model": {"id": CURSOR_MODEL},
            "name": f"lead-gen-{business_name[:30]}",
        },
        timeout=60,
    )
    if resp.status_code == 401:
        raise PermissionError("Cursor API key غالط")
    resp.raise_for_status()

    data = resp.json()
    agent_id = data["agent"]["id"]
    run_id = data["run"]["id"]
    message = _wait_for_cursor_run(agent_id, run_id)
    if not message:
        raise RuntimeError("Cursor رجع ميساج فارغ")

    log.info(f"✍️  ولدنا ميساج مخصص لـ {business_name}")
    return message


# ─────────────────────────────────────────────
#  4. WhatsApp Sender
# ─────────────────────────────────────────────
def send_whatsapp(phone: str, message: str) -> bool:
    """
    يصيفط ميساج واتساب باستخدام WhatsApp Cloud API.

    Args:
        phone:   رقم الهاتف بالصيغة الدولية (212XXXXXXXXX)
        message: النص اللي غادي يتصيفط

    Returns:
        True إلا نجح، False إلا فشل
    """
    if not phone:
        log.warning("رقم هاتف فارغ — تخطينا")
        return False

    url = f"https://graph.facebook.com/v20.0/{WA_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WA_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message},
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        msg_id = data.get("messages", [{}])[0].get("id", "unknown")
        log.info(f"📤 تصيفط لـ {phone} — message_id: {msg_id}")
        return True
    except requests.exceptions.HTTPError as e:
        log.error(f"WhatsApp HTTP error لـ {phone}: {e.response.status_code} — {e.response.text}")
        global _WA_TOKEN_WARNED
        if e.response.status_code == 401 and not _WA_TOKEN_WARNED:
            _WA_TOKEN_WARNED = True
            print(
                "\n❌ WhatsApp: التوكن منتهي أو غالط (OAuth 190)\n"
                "   1. Meta Developers → تطبيقك → WhatsApp → API Setup\n"
                "   2. انسخ Temporary access token جديد\n"
                "   3. حطو فـ .env → WA_TOKEN=...\n"
                "   للإنتاج: System User token دائم (ما كينتهيش كل 24h)\n"
                "   💡 بلا إرسال: python main.py --process --skip-whatsapp\n"
            )
        elif e.response.status_code == 400 and "131030" in e.response.text and not _WA_TOKEN_WARNED:
            print(
                f"\n❌ WhatsApp: الرقم {phone} ماشي فـ قائمة المسموحين (وضع التطوير)\n"
                "   1. روح: developers.facebook.com → ai agent → WhatsApp → API Setup\n"
                "   2. تحت 'To' أو 'Manage phone number list' → زيد الرقم\n"
                "   3. الصيغة: 2126XXXXXXXX (بلا + ولا مسافات)\n"
                "   4. عاود: python main.py --reset-failed && python main.py --process\n"
            )
        return False
    except requests.exceptions.RequestException as e:
        log.error(f"WhatsApp request error لـ {phone}: {e}")
        return False


# ─────────────────────────────────────────────
#  5. Main Loop
# ─────────────────────────────────────────────
def process_leads(
    use_template: bool = False,
    skip_whatsapp: bool = False,
    filters: LeadFilters | None = None,
) -> None:
    """
    يقرأ leads بـ status='new' من Supabase
    ويمشي عليهم: analyze → PDF → generate_message → send → update status
    """
    sb = _get_supabase()

    try:
        result = sb.table("leads").select("*").eq("status", "new").order("id").execute()
    except Exception as e:
        log.error(f"Supabase read error: {e}")
        if "401" in str(e) or "Invalid API key" in str(e):
            print(
                "\n❌ Supabase: مفتاح API غالط — صحح SUPABASE_KEY فـ .env\n"
                "   Supabase Dashboard → Settings → API → anon public key\n"
            )
        raise SystemExit(1) from e

    all_leads = result.data or []
    leads = [l for l in all_leads if _passes_lead_filters(l, filters)]
    skipped = len(all_leads) - len(leads)

    if not leads:
        log.info("ما كاين حتى lead جديد." + (f" ({skipped} متخطّى بالفلتر)" if skipped else ""))
        return

    log.info(f"🚀 بدينا المعالجة: {len(leads)} lead جديد")
    if skipped:
        log.info(f"  ⏭️  تخطّينا {skipped} lead بالفلتر")
    if skip_whatsapp:
        log.info("  ⏭️  وضع بلا إرسال واتساب (--skip-whatsapp)")

    for idx, lead in enumerate(leads, start=1):
        lead_id   = lead["id"]
        name      = lead.get("business_name", "")
        phone     = lead.get("phone", "")

        log.info(f"\n[{idx}/{len(leads)}] ⚙️  معالجة: {name}")

        log.info(f"  🔍 كيدير أوديت رقمي ({infer_business_type(name, lead.get('address', ''))})...")
        audit = audit_business(lead)
        if not audit.problems:
            audit.problems = ["ما قدرناش نلقاو حضور رقمي قوي — فرصة تحسين فـ Google"]
            audit.summary = _build_audit_summary(name, audit)
        log.info(f"  📊 Score: {audit.score}/100 — {len(audit.problems)} ملاحظة")
        log.info(f"  🔎 أهم ملاحظة: {audit.problems[0][:70]}...")

        problems_str = audit.summary

        screenshot = Path(audit.signals["screenshot"]) if audit.signals.get("screenshot") else None
        mobile_shot = Path(audit.signals["mobile_screenshot"]) if audit.signals.get("mobile_screenshot") else None
        pdf_path = ""
        try:
            pdf = generate_audit_pdf(lead, audit, screenshot, mobile_shot)
            pdf_path = str(pdf)
            log.info(f"  📄 PDF: {pdf_path}")
        except Exception as e:
            log.warning(f"  ⚠️  PDF ما تولّدش: {e}")

        log.info("  ✍️  كيكتب الميساج (Cursor)..." if not use_template else "  ✍️  كيكتب الميساج (template)...")
        message = ""
        try:
            message = generate_message(lead, audit, use_template=use_template)
        except PermissionError:
            log.error("  ❌ Cursor: مفتاح API غالط — صحح CURSOR_API_KEY فـ .env")
            print("\n   جبد مفتاح: https://cursor.com/dashboard → API Keys\n")
            _update_lead(sb, lead, lead_id, {
                "status": "failed",
                "problems_found": problems_str,
                "audit_pdf_path": pdf_path,
            })
            continue
        except Exception as e:
            log.warning(f"  ⚠️  Cursor فشل ({e}) — كنستعملو template")
            try:
                message = generate_message(lead, audit, use_template=True)
            except Exception as tmpl_err:
                log.error(f"  ❌ Template error: {tmpl_err}")
                _update_lead(sb, lead, lead_id, {
                    "status": "failed",
                    "problems_found": problems_str,
                    "audit_pdf_path": pdf_path,
                })
                continue

        log.info(f"  💬 الميساج: {message[:80]}...")

        if skip_whatsapp:
            new_status = "audited"
            log.info("  ⏭️  تخطّينا واتساب — status → audited")
        else:
            log.info(f"  📤 كيصيفط واتساب → {phone}...")
            success = send_whatsapp(phone, message)
            new_status = "sent" if success else "audited"

        updated = _update_lead(sb, lead, lead_id, {
            "problems_found": problems_str,
            "message_sent":   message,
            "status":         new_status,
            "audit_pdf_path": pdf_path,
        })
        if not updated:
            log.error("  ❌ ما تحفظش — غادي يبقى status=new ويتعاود فالمرة الجاية")
            continue

        log.info(f"  📋 status → {new_status}")

        if idx < len(leads):
            log.info(f"  ⏳ نستنى {DELAY_BETWEEN_MESSAGES}s ...")
            time.sleep(DELAY_BETWEEN_MESSAGES)

    log.info("\n✅ خلصنا من كل الـ leads!")
    log.info("💡 sync للشيت: python main.py --sync-sheets")


def _verify_whatsapp() -> bool:
    if not WA_TOKEN or not WA_PHONE_NUMBER_ID:
        print("❌ WA_TOKEN أو WA_PHONE_NUMBER_ID ناقص فـ .env")
        return False
    try:
        resp = requests.get(
            f"https://graph.facebook.com/v20.0/{WA_PHONE_NUMBER_ID}",
            headers={"Authorization": f"Bearer {WA_TOKEN}"},
            timeout=15,
        )
        if resp.status_code == 401:
            print(
                "❌ WhatsApp: التوكن منتهي أو غالط\n"
                "   Meta Developers → WhatsApp → API Setup → انسخ token جديد → WA_TOKEN فـ .env"
            )
            return False
        resp.raise_for_status()
        return True
    except requests.RequestException as e:
        print(f"❌ WhatsApp error: {e}")
        return False


def reset_failed_leads() -> None:
    """يرجع leads اللي failed أو audited لـ new باش يتعاودو."""
    sb = _get_supabase()
    result = sb.table("leads").update({"status": "new"}).in_(
        "status", ["failed", "audited"]
    ).execute()
    count = len(result.data or [])
    if count:
        print(f"✅ رجّعنا {count} lead لـ status=new")
    else:
        print("✅ ما كاين حتى lead failed/audited — جرب: python main.py --reaudit-all")


def reaudit_all_leads() -> None:
    """يرجع كل الـ leads (sent/failed/audited) لـ new باش يتعاود الأوديت والميساجات."""
    sb = _get_supabase()
    result = sb.table("leads").update({"status": "new"}).in_(
        "status", ["sent", "failed", "audited"]
    ).execute()
    count = len(result.data or [])
    print(f"✅ {count} lead واجدين لإعادة الأوديت — شغّل: python main.py --process --skip-whatsapp")


def seed_test_lead(
    business_name: str = "صالون الحسن",
    phone: str = "212612345678",
    website: str = "https://example.com",
) -> None:
    """يزيد lead تجريبي فـ Supabase (status=new)."""
    sb = _get_supabase()
    sb.table("leads").upsert(
        {
            "business_name": business_name,
            "phone": phone,
            "website": website,
            "status": "new",
        },
        on_conflict="phone",
    ).execute()
    print(f"✅ Lead tzad: {business_name} ({phone})")


# ─────────────────────────────────────────────
#  Entry Point
# ─────────────────────────────────────────────
def main() -> None:
    """
    الدورة الكاملة:
      1. ابحث فـ Google Maps وعمر Supabase
      2. عالج كل lead جديد (analyze → message → send)
    """
    import argparse

    parser = argparse.ArgumentParser(description="AI Lead Gen Agent")
    parser.add_argument("--sync-sheets", action="store_true", help="صيفط كل leads من Supabase لـ Google Sheets")
    parser.add_argument("--reset-failed", action="store_true", help="رجّع leads failed/audited لـ new")
    parser.add_argument("--reaudit-all", action="store_true", help="أعد الأوديت لكل leads (sent/failed → new)")
    parser.add_argument("--use-templates", action="store_true", help="ميساجات جاهزة بلا Cursor API")
    parser.add_argument("--skip-whatsapp", action="store_true", help="أوديت + ميساج + PDF بلا إرسال واتساب")
    parser.add_argument("--require-phone", action="store_true", help="عالج غير leads عندهم تلفون")
    parser.add_argument("--no-website-only", action="store_true", help="عالج غير بزنس بلا موقع")
    parser.add_argument("--min-rating", type=float, default=0.0, help="حد أدنى لتقييم Google (مثلا 3.5)")
    parser.add_argument("--webhook", action="store_true", help="شغّل webhook server ديال واتساب")
    parser.add_argument("--seed-test-lead", action="store_true", help="زيد lead تجريبي فـ Supabase")
    parser.add_argument("--check-env", action="store_true", help="تحقق من المفاتيح فـ .env")
    parser.add_argument("--scrape",   action="store_true", help="شغل Google Maps scraper")
    parser.add_argument("--process",  action="store_true", help="عالج الـ leads من Supabase")
    parser.add_argument("--query",    default="صالونات حلاقة", help="نوع النشاط")
    parser.add_argument("--location", default="أكادير",        help="المدينة")
    parser.add_argument("--max",      type=int, default=50,    help="حد أقصى للنتائج")
    args = parser.parse_args()

    if args.reset_failed:
        reset_failed_leads()
        raise SystemExit(0)

    if args.reaudit_all:
        reaudit_all_leads()
        raise SystemExit(0)

    if args.sync_sheets:
        sync_all_leads_to_sheet()
        raise SystemExit(0)

    if args.webhook:
        from webhook_server import run_webhook_server
        run_webhook_server()
        raise SystemExit(0)

    if args.seed_test_lead:
        seed_test_lead()
        raise SystemExit(0)

    if args.check_env:
        print("🔎 فحص .env ...\n")
        maps_ok = _check_env(require_maps=True)
        sb_ok = _check_env(require_supabase=True)
        cursor_ok = _verify_cursor_key()
        wa_ok = _verify_whatsapp()
        sheets_ok = _is_sheets_configured()
        print(f"{'✅' if maps_ok else '❌'} Google Maps API Key")
        print(f"{'✅' if sb_ok else '❌'} Supabase (URL + anon key)")
        print(f"{'✅' if cursor_ok else '❌'} Cursor API Key")
        print(f"{'✅' if wa_ok else '❌'} WhatsApp (token + phone id)")
        print(f"{'✅' if sheets_ok else '⚠️ '} Google Sheets" + ("" if sheets_ok else " (اختياري — GOOGLE_SHEET_WEBAPP_URL)"))
        raise SystemExit(0 if (maps_ok and sb_ok and cursor_ok and wa_ok) else 1)

    if args.scrape:
        leads = search_maps(args.query, args.location, args.max)
        print(f"\n✅ جمعنا {len(leads)} lead — محفوظة فـ {CSV_OUTPUT} و Supabase")

    if args.process:
        lead_filters = LeadFilters(
            min_rating=args.min_rating,
            require_phone=args.require_phone,
            no_website_only=args.no_website_only,
        )
        process_leads(
            use_template=args.use_templates,
            skip_whatsapp=args.skip_whatsapp,
            filters=lead_filters,
        )

    if not args.scrape and not args.process:
        log.info("🤖 AI Lead Gen Agent — بداية")
        leads = search_maps(args.query, args.location, args.max)
        print(f"\n✅ جمعنا {len(leads)} lead")
        if leads or _is_valid_supabase_key(SUPABASE_KEY):
            process_leads(
                use_template=args.use_templates,
                skip_whatsapp=args.skip_whatsapp,
                filters=LeadFilters(
                    min_rating=args.min_rating,
                    require_phone=args.require_phone,
                    no_website_only=args.no_website_only,
                ),
            )
        elif not _check_env(require_supabase=True):
            raise SystemExit(1)


if __name__ == "__main__":
    main()
