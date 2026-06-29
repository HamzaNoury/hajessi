#!/usr/bin/env python3
"""إعداد Google Sheets بضغطة واحدة — من بعد ما deployيتي Apps Script."""

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv, set_key

ROOT = Path(__file__).parent
ENV = ROOT / ".env"
SCRIPT_FILE = ROOT / "google-apps-script.js"


def save_webapp_url(url: str, sheet_id: str = "") -> None:
    url = url.strip()
    if not url.startswith("https://script.google.com/macros/s/"):
        print("❌ URL غالط — خاصو يبدا بـ https://script.google.com/macros/s/")
        sys.exit(1)
    if not ENV.exists():
        print(f"❌ ما لقيناش {ENV}")
        sys.exit(1)
    set_key(str(ENV), "GOOGLE_SHEET_WEBAPP_URL", url)
    if sheet_id:
        set_key(str(ENV), "GOOGLE_SHEET_ID", sheet_id.strip())
        print(f"✅ حفظنا URL + Sheet ID فـ .env")
    else:
        print(f"✅ حفظنا URL فـ .env")
        print("⚠️  خاصك GOOGLE_SHEET_ID فـ .env (من رابط Google Sheet)")


def open_setup_pages() -> None:
    """يفتح Chrome على الصفحات المطلوبة."""
    urls = [
        "https://sheets.new",
        "https://script.google.com/home/projects/create",
    ]
    for u in urls:
        subprocess.run(["open", "-a", "Google Chrome", u], check=False)
    print("\n📋 فتحنا Chrome:")
    print("   1. Google Sheet جديد")
    print("   2. Apps Script جديد")
    print(f"\n📄 الكود جاهز فـ: {SCRIPT_FILE}")
    print("\nفـ Apps Script:")
    print("   - الصق الكود من google-apps-script.js")
    print("   - Deploy → Web app → Anyone → انسخ URL")
    print("\nمن بعد:")
    print('   python setup_sheets.py --url "https://script.google.com/macros/s/XXXX/exec"')


def export_csv() -> Path:
    load_dotenv(ENV)
    import os
    from supabase import create_client
    import csv

    def wa_url(phone: str) -> str:
        digits = "".join(c for c in (phone or "") if c.isdigit())
        if not digits:
            return ""
        return f"https://wa.me/{digits}"

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
    leads = sb.table("leads").select("*").order("id").execute().data or []

    out = ROOT / "leads_for_google_sheets.csv"
    headers = [
        "Date", "Nom", "Téléphone", "Email", "Site web",
        "Note", "Adresse", "Problèmes", "Message", "Statut", "PDF", "WhatsApp",
    ]
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for l in leads:
            w.writerow([
                l.get("created_at", ""), l.get("business_name", ""),
                l.get("phone", ""), l.get("email", ""), l.get("website", ""),
                l.get("rating", ""), l.get("address", ""),
                l.get("problems_found", ""), l.get("message_sent", ""),
                l.get("status", ""), l.get("audit_pdf_path", ""),
                wa_url(l.get("phone", "")),
            ])
    print(f"✅ {len(leads)} leads → {out}")
    subprocess.run(["open", "-R", str(out)], check=False)
    return out


def run_sync() -> None:
    import os
    import requests
    load_dotenv(ENV)
    url = os.getenv("GOOGLE_SHEET_WEBAPP_URL", "")
    ping = requests.get(f"{url}?action=ping", timeout=30, allow_redirects=True)
    if "doGet" in ping.text or ping.text.strip().startswith("<!DOCTYPE"):
        print(
            "❌ Apps Script ما فيهش الكود الصحيح\n"
            "   1. Extensions → Apps Script\n"
            "   2. الصق lead_gen/google-apps-script.js (كامل)\n"
            "   3. Deploy → Manage deployments → Edit → New version → Deploy\n"
        )
        sys.exit(1)
    from main import sync_all_leads_to_sheet
    sync_all_leads_to_sheet()


def main() -> None:
    parser = argparse.ArgumentParser(description="Google Sheets setup")
    parser.add_argument("--url", help="Apps Script Web App URL")
    parser.add_argument("--sheet-id", help="Google Sheet ID من الرابط")
    parser.add_argument("--open", action="store_true", help="فتح Chrome للإعداد")
    parser.add_argument("--export", action="store_true", help="تصدير CSV من Supabase")
    parser.add_argument("--sync", action="store_true", help="مزامنة Supabase → Sheets")
    args = parser.parse_args()

    if args.url:
        save_webapp_url(args.url, args.sheet_id or "")
        if not args.sheet_id and not os.getenv("GOOGLE_SHEET_ID"):
            print("\n   مثال: python setup_sheets.py --sheet-id 1abc...XYZ")
            sys.exit(1)
        run_sync()
        return

    if args.export:
        export_csv()
        return

    if args.sync:
        run_sync()
        return

    if args.open:
        export_csv()
        open_setup_pages()
        return

    # default: export + open browser
    export_csv()
    open_setup_pages()
    print("\n💡 من بعد Deploy، شغل:")
    print('   python setup_sheets.py --url "URL ديالك"')


if __name__ == "__main__":
    main()
