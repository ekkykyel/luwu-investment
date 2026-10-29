import healthHandler from "./_handlers/health.js";
import marketTickerHandler from "./_handlers/marketTicker.js";
import siteSettingsHandler from "./_handlers/siteSettings.js";
import testimonialsHandler from "./_handlers/testimonials.js";
import infrastrukturHandler from "./_handlers/infrastruktur.js";
import investmentInterestsHandler from "./_handlers/investmentInterests.js";
import spatialLayersHandler from "./_handlers/spatialLayers.js";
import weatherHandler from "./_handlers/weather.js";
import authLoginHandler from "./_handlers/authLogin.js";
import authMeHandler from "./_handlers/authMe.js";
import kioskSendOtpHandler from "./_handlers/kioskSendOtp.js";
import kioskSendOtpNewHandler from "./_handlers/kioskSendOtpNew.js";
import kioskVerifyOtpHandler from "./_handlers/kioskVerifyOtp.js";
import kioskInvestorVerifyOtpHandler from "./_handlers/kioskInvestorVerifyOtp.js";

// Helper to extract clean path from request
function extractPath(req: any): string {
  const originalPath =
    req.headers?.["x-matched-path"] ||
    req.headers?.["x-forwarded-uri"] ||
    req.headers?.["x-original-uri"] ||
    req.url ||
    "";
  
  const rawPath = originalPath.split("?")[0];
  if (!rawPath.startsWith("/api")) {
    return "/api" + (rawPath.startsWith("/") ? rawPath : "/" + rawPath);
  }
  return rawPath;
}

export default async function handler(req: any, res: any) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "*");
    return res.status(200).end();
  }

  const path = extractPath(req);

  try {
    // 1. Health Check
    if (path === "/api/health") {
      return await healthHandler(req, res);
    }

    // 2. Market Ticker
    if (path === "/api/market-ticker") {
      return await marketTickerHandler(req, res);
    }

    // 3. Weather
    if (path === "/api/weather" || path === "/api/weather/current") {
      return await weatherHandler(req, res);
    }

    // 4. Site Settings
    if (path === "/api/site-settings") {
      return await siteSettingsHandler(req, res);
    }

    // 5. Testimonials
    if (path === "/api/testimonials") {
      return await testimonialsHandler(req, res);
    }

    // 6. Infrastruktur
    if (path === "/api/infrastruktur") {
      return await infrastrukturHandler(req, res);
    }

    // 7. Investment Interests (LoI)
    if (path === "/api/investment-interests") {
      return await investmentInterestsHandler(req, res);
    }

    // 8. Spatial Layers
    if (path === "/api/spatial-layers" || path.startsWith("/api/spatial-layers/")) {
      return await spatialLayersHandler(req, res);
    }

    // 9. Auth
    if (path === "/api/auth/login") {
      return await authLoginHandler(req, res);
    }
    if (path === "/api/auth/me") {
      return await authMeHandler(req, res);
    }

    // 10. Kiosk OTP
    if (path === "/api/kiosk/send-otp") {
      return await kioskSendOtpHandler(req, res);
    }
    if (path === "/api/kiosk/send-otp-new") {
      return await kioskSendOtpNewHandler(req, res);
    }
    if (path === "/api/kiosk/verify-otp") {
      return await kioskVerifyOtpHandler(req, res);
    }
    if (path === "/api/kiosk/investor/verify-otp") {
      return await kioskInvestorVerifyOtpHandler(req, res);
    }

    // Fallback for any unknown /api/* endpoint
    res.setHeader("Content-Type", "application/json");
    return res.status(404).json({
      success: false,
      error: `API Route not found: ${path}`,
      available_routes: [
        "/api/health",
        "/api/market-ticker",
        "/api/weather/current",
        "/api/site-settings",
        "/api/testimonials",
        "/api/infrastruktur",
        "/api/investment-interests",
        "/api/spatial-layers",
        "/api/auth/login",
        "/api/auth/me",
        "/api/kiosk/send-otp",
        "/api/kiosk/verify-otp"
      ]
    });
  } catch (err: any) {
    console.error(`[API CatchAll Error on ${path}]:`, err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: err?.message || "Internal Serverless Function Error"
      });
    }
  }
}