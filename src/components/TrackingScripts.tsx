"use client";

import Script from "next/script";
import { FB_PIXEL_ID, GA_MEASUREMENT_ID } from "@/lib/config";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function TrackingScripts() {
  const hasFb = FB_PIXEL_ID !== "FB_PIXEL_ID";
  const hasGa = GA_MEASUREMENT_ID !== "GA_MEASUREMENT_ID";

  return (
    <>
      {hasGa && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
      {hasFb && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}

/** Track ViewContent on product pages */
export function trackViewContent(productName: string, price: number) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "ViewContent", {
      content_name: productName,
      value: price,
      currency: "MAD",
    });
  }
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item", {
      items: [{ item_name: productName, price, currency: "MAD" }],
    });
  }
}

/** Track Purchase/Lead on order confirmation */
export function trackPurchase(
  productName: string,
  total: number,
  quantity: number
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", {
      content_name: productName,
      value: total,
      currency: "MAD",
      num_items: quantity,
    });
  }
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: Date.now().toString(),
      value: total,
      currency: "MAD",
      items: [{ item_name: productName, quantity, price: total / quantity }],
    });
  }
}
