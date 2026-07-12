import React, { useEffect, useRef } from "react";

export default function AdSenseUnit() {
  const initialized = useRef(false);

  useEffect(() => {
    // Only push once per component mount to prevent duplicate push exceptions
    if (initialized.current) return;
    initialized.current = true;

    try {
      // Ensure the adsbygoogle array is available and push the ad
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
    } catch (err) {
      console.error("Google AdSense init error:", err);
    }
  }, []);

  return (
    <div className="w-full my-4 flex flex-col items-center justify-center overflow-hidden bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-fade-in" id="adsense-wrapper">
      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-2" id="adsense-label">
        Advertisement
      </div>
      <div className="w-full flex justify-center" style={{ minHeight: "100px" }} id="adsense-ins-container">
        <ins
          className="adsbygoogle text-center"
          style={{ display: "block", width: "100%", height: "auto" }}
          data-ad-client="ca-pub-7064585697755959"
          data-ad-slot="4046473639"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
