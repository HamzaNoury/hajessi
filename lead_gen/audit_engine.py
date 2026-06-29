"""محرك أوديت رقمي معمّق — فحوصات متعددة + scores بالفئات + توصيات."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AuditRecommendation:
    category: str
    priority: str  # high | medium | low
    issue: str
    impact: str
    action: str


@dataclass
class DeepAuditExtras:
    category_scores: dict[str, int] = field(default_factory=dict)
    recommendations: list[AuditRecommendation] = field(default_factory=list)
    checks_passed: list[str] = field(default_factory=list)
    checks_failed: list[str] = field(default_factory=list)
    executive_summary: str = ""


CATEGORY_LABELS = {
    "seo": "SEO & المحتوى",
    "performance": "الأداء",
    "mobile": "الموبايل",
    "conversion": "التحويل & التواصل",
    "trust": "الثقة & الهوية",
    "maps": "Google Maps",
}

INDUSTRY_BENCHMARKS = {
    "education": {
        "must_have": ["inscription", "programme", "tarif", "أثمنة", "تسجيل", "مستوى", "فوج"],
        "nice_have": ["photos", "équipe", "فريق", "نتائج", "bac"],
    },
    "beauty": {
        "must_have": ["prix", "tarif", "أثمنة", "service", "حجز", "galerie", "صور"],
        "nice_have": ["portfolio", "avis", "قبل", "après"],
    },
    "food": {
        "must_have": ["menu", "منيو", "carte", "prix", "commande", "طلب"],
        "nice_have": ["livraison", "توصيل", "réservation"],
    },
    "health": {
        "must_have": ["rendez", "حجز", "service", "horaire", "ساعات"],
        "nice_have": ["équipe", "certif", "تأمين"],
    },
    "local": {
        "must_have": ["contact", "تواصل", "service", "خدمات"],
        "nice_have": ["à propos", "من نحن"],
    },
}


def _priority_from_severity(severity: str) -> str:
    return {"critical": "high", "warning": "medium", "info": "low"}.get(severity, "medium")


def _add_rec(
    recs: list[AuditRecommendation],
    category: str,
    issue: str,
    impact: str,
    action: str,
    priority: str = "medium",
) -> None:
    recs.append(AuditRecommendation(category, priority, issue, impact, action))


def compute_category_scores(signals: dict, has_website: bool) -> dict[str, int]:
    """يحسب score لكل فئة (0-100)."""
    if not has_website:
        rating = float(signals.get("rating") or 0)
        maps_score = 30
        if rating >= 4.5:
            maps_score += 35
        elif rating >= 4.0:
            maps_score += 25
        elif rating > 0:
            maps_score += 10
        if signals.get("has_phone"):
            maps_score += 15
        if signals.get("has_address"):
            maps_score += 10
        if signals.get("review_count", 0) >= 10:
            maps_score += 10
        return {
            "seo": 0,
            "performance": 0,
            "mobile": 0,
            "conversion": min(100, maps_score),
            "trust": min(100, maps_score + 10),
            "maps": min(100, maps_score),
        }

    seo = 100
    if not signals.get("has_title"):
        seo -= 25
    elif signals.get("title_len", 0) < 30 or signals.get("title_len", 0) > 65:
        seo -= 10
    if not signals.get("has_meta_description"):
        seo -= 20
    if signals.get("h1_count", 0) == 0:
        seo -= 15
    elif signals.get("h1_count", 0) > 1:
        seo -= 5
    if not signals.get("has_canonical"):
        seo -= 5
    if not signals.get("has_og_tags"):
        seo -= 10
    if signals.get("images_no_alt_ratio", 0) > 0.5:
        seo -= 15
    if not signals.get("has_lang"):
        seo -= 5
    if signals.get("content_words", 0) < 150:
        seo -= 15

    perf = 100
    load = signals.get("load_time_s") or 99
    if load > 5:
        perf -= 40
    elif load > 3:
        perf -= 25
    elif load > 2:
        perf -= 10
    if signals.get("page_weight_kb", 0) > 3000:
        perf -= 20
    elif signals.get("page_weight_kb", 0) > 1500:
        perf -= 10
    if signals.get("broken_images", 0) > 0:
        perf -= 15

    mobile = 100
    if not signals.get("has_viewport"):
        mobile -= 35
    if signals.get("mobile_overflow"):
        mobile -= 25
    if not signals.get("has_tel_link") and not signals.get("has_whatsapp"):
        mobile -= 15
    if signals.get("font_too_small"):
        mobile -= 15

    conversion = 100
    if not signals.get("has_whatsapp"):
        conversion -= 25
    if not signals.get("has_tel_link"):
        conversion -= 15
    if signals.get("forms_count", 0) == 0 and not signals.get("has_booking"):
        conversion -= 25
    if not signals.get("has_cta"):
        conversion -= 15
    if not signals.get("has_email"):
        conversion -= 10
    if not signals.get("has_maps_embed"):
        conversion -= 10

    trust = 100
    if not signals.get("is_https"):
        trust -= 30
    if not signals.get("has_favicon"):
        trust -= 10
    if not signals.get("has_facebook") and not signals.get("has_instagram"):
        trust -= 15
    if not signals.get("has_structured_data"):
        trust -= 10
    if not signals.get("has_about_page"):
        trust -= 10
    if signals.get("copyright_year") and signals["copyright_year"] < 2023:
        trust -= 10

    maps = 50
    rating = float(signals.get("rating") or 0)
    if rating >= 4.5:
        maps += 30
    elif rating >= 4.0:
        maps += 20
    elif rating > 0:
        maps += 5

    return {
        "seo": max(0, min(100, seo)),
        "performance": max(0, min(100, perf)),
        "mobile": max(0, min(100, mobile)),
        "conversion": max(0, min(100, conversion)),
        "trust": max(0, min(100, trust)),
        "maps": max(0, min(100, maps)),
    }


def overall_score_from_categories(scores: dict[str, int], has_website: bool) -> int:
    if not has_website:
        weights = {"maps": 0.4, "conversion": 0.35, "trust": 0.25}
    else:
        weights = {
            "seo": 0.2,
            "performance": 0.15,
            "mobile": 0.2,
            "conversion": 0.25,
            "trust": 0.1,
            "maps": 0.1,
        }
    total_w = sum(weights.values())
    return round(sum(scores.get(k, 0) * w for k, w in weights.items()) / total_w)


def build_recommendations(
    signals: dict,
    biz_type: str,
    has_website: bool,
    lead: dict,
) -> list[AuditRecommendation]:
    recs: list[AuditRecommendation] = []

    if not has_website:
        _add_rec(
            recs, "maps", "ما عندكمش موقع ويب",
            "70% ديال الأولياء/الزبناء كيقارنو المؤسسات أونلاين قبل ما يتصلو",
            "أنشئ موقع بسيط: الصفحة الرئيسية + الخدمات + تواصل + واتساب",
            "high",
        )
        if not lead.get("phone"):
            _add_rec(recs, "conversion", "رقم الهاتف ناقص فـ Google Maps",
                     "الزبناء ما يقدروش يتصلو مباشرة", "أضف رقم واتساب/هاتف فالبروفايل", "high")
        rating = float(lead.get("rating") or 0)
        if 0 < rating < 4.0:
            _add_rec(recs, "trust", f"تقييم Google {rating}/5",
                     "كيأثر على قرار الزبناء", "شجع الزبناء الراضيين يخليو تقييمات جديدة", "medium")
        return recs[:8]

    load = signals.get("load_time_s")
    if load and load > 3:
        _add_rec(recs, "performance", f"بطء التحميل ({load}s)",
                 "53% ديال الزوار كيحيدو فالموقع إلا بان بعد 3 ثواني",
                 "ضغط الصور، CDN، واستضافة أسرع", "high")

    if not signals.get("has_viewport"):
        _add_rec(recs, "mobile", "الموقع مو متوافق مع الموبايل",
                 "فالمغرب +80% ديال الزيارات من الهاتف",
                 "أضف viewport meta + تصميم responsive", "high")

    if not signals.get("has_whatsapp"):
        _add_rec(recs, "conversion", "ما كاينش زر واتساب",
                 "واتساب هو القناة #1 فالمغرب للتواصل التجاري",
                 "أضف زر واتساب ثابت (floating) بجميع الصفحات", "high")

    if not signals.get("has_meta_description"):
        _add_rec(recs, "seo", "ما كاينش meta description",
                 "Google كيستعملها فنتائج البحث — كتأثر على النقرات",
                 "اكتب وصف 150-160 حرف بالدارجة أو الفرنسية", "medium")

    if signals.get("h1_count", 0) == 0:
        _add_rec(recs, "seo", "ما كاينش عنوان H1",
                 "محركات البحث ما تفهمش الموضوع الرئيسي ديال الصفحة",
                 "أضف عنوان واحد واضح (H1) فكل صفحة", "medium")

    if not signals.get("has_booking") and signals.get("forms_count", 0) == 0:
        label = {"education": "تسجيل", "beauty": "حجز", "health": "موعد"}.get(biz_type, "تواصل")
        _add_rec(recs, "conversion", f"ما كاينش فورم {label}",
                 "الزوار اللي مهتمين كيخرجو بلا ما يخليو معلوماتهم",
                 f"أضف فورم {label} بسيط أو رابط واتساب مباشر", "high")

    if not signals.get("has_og_tags"):
        _add_rec(recs, "seo", "ما كاينش Open Graph tags",
                 "المشاركة ففيسبوك/واتساب كتبان بلا صورة ولا وصف",
                 "أضف og:title, og:description, og:image", "low")

    if not signals.get("has_structured_data"):
        _add_rec(recs, "trust", "ما كاينش Schema.org (JSON-LD)",
                 "Google ما يقدرش يعرض معلومات غنية (نجوم، ساعات...)",
                 "أضف LocalBusiness أو Organization schema", "low")

    if not signals.get("is_https"):
        _add_rec(recs, "trust", "الموقع بلا HTTPS",
                 "المتصفحات كتبان 'غير آمن' — كيخسر ثقة الزوار",
                 "فعّل شهادة SSL مجانية (Let's Encrypt)", "high")

    # Industry-specific gaps
    bench = INDUSTRY_BENCHMARKS.get(biz_type, INDUSTRY_BENCHMARKS["local"])
    page_text = signals.get("page_text_sample", "")
    missing = [kw for kw in bench["must_have"] if kw not in page_text]
    if missing and has_website:
        _add_rec(
            recs, "seo",
            f"محتوى ناقص لنشاط {biz_type}: {', '.join(missing[:3])}",
            "الزبناء كيبحثو على هاد المعلومات وما كيلقاوهاش",
            "أضف صفحة مخصصة بالمعلومات المطلوبة فقطتك",
            "medium",
        )

    if signals.get("images_no_alt_ratio", 0) > 0.4:
        _add_rec(recs, "seo", "صور بلا نص بديل (alt)",
                 "ضعيف للـ SEO وإمكانية الوصول",
                 "أضف alt text لكل صورة", "low")

    return recs[:10]


def recommendations_to_problems(recs: list[AuditRecommendation]) -> list[str]:
    """يحوّل التوصيات لنصوص problems للميساج."""
    out: list[str] = []
    for r in recs:
        text = r.issue
        if r.impact:
            text += f" — {r.impact}"
        out.append(text)
    return out


def build_executive_summary(
    name: str,
    score: int,
    category_scores: dict[str, int],
    has_website: bool,
    biz_type: str,
) -> str:
    weakest = sorted(category_scores.items(), key=lambda x: x[1])[:2]
    weak_txt = " و ".join(f"{CATEGORY_LABELS.get(k, k)} ({v}/100)" for k, v in weakest)

    if not has_website:
        return (
            f"{name} عندو حضور محدود فـ Google Maps بلا موقع ويب. "
            f"النقطة الإجمالية {score}/100. أضعف محاور: {weak_txt}. "
            f"أولوية: إنشاء موقع يعرض الخدمات ويتيح التواصل المباشر."
        )

    if score >= 70:
        verdict = "الموقع مزيان بشكل عام ولكن فيه فرص تحسين التحويل"
    elif score >= 40:
        verdict = "الموقع موجود ولكن ما كيخدمش مزيان كأداة جذب زبناء"
    else:
        verdict = "الموقع فوضع حرج — كيخسر زبناء محتملين يومياً"

    return (
        f"{name}: {verdict}. النقطة {score}/100. "
        f"أضعف محاور: {weak_txt}. "
        f"التحسينات السريعة (واتساب + سرعة + موبايل) كتعطي نتائج فـ 2-4 أسابيع."
    )


def finalize_deep_audit(
    signals: dict,
    biz_type: str,
    has_website: bool,
    lead: dict,
    raw_problems: list[str],
    raw_strengths: list[str],
) -> tuple[int, dict[str, int], list[AuditRecommendation], DeepAuditExtras]:
    """يجمع كل شيء بعد الفحص."""
    category_scores = compute_category_scores(signals, has_website)
    score = overall_score_from_categories(category_scores, has_website)
    recs = build_recommendations(signals, biz_type, has_website, lead)

    # دمج recommendations مع raw problems (بدون تكرار)
    rec_problems = recommendations_to_problems(recs)
    problems = list(dict.fromkeys(rec_problems + raw_problems))[:12]

    passed = []
    failed = []
    check_map = [
        ("has_whatsapp", "زر واتساب", "ما كاينش واتساب"),
        ("has_viewport", "تصميم موبايل", "مو responsive"),
        ("has_meta_description", "Meta description", "بلا meta description"),
        ("is_https", "HTTPS", "بلا HTTPS"),
        ("has_favicon", "Favicon", "بلا favicon"),
        ("has_structured_data", "Schema.org", "بلا structured data"),
        ("has_og_tags", "Open Graph", "بلا OG tags"),
        ("has_booking", "حجز/تسجيل", "بلا حجز"),
    ]
    for key, ok_label, fail_label in check_map:
        if signals.get(key):
            passed.append(ok_label)
        elif has_website:
            failed.append(fail_label)

    summary = build_executive_summary(
        lead.get("business_name", ""),
        score,
        category_scores,
        has_website,
        biz_type,
    )

    extras = DeepAuditExtras(
        category_scores=category_scores,
        recommendations=recs,
        checks_passed=passed,
        checks_failed=failed,
        executive_summary=summary,
    )
    return score, category_scores, recs, extras, problems
