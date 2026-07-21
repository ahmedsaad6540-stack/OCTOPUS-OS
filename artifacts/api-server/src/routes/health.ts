import { Router } from "express";

const router = Router();

router.get("/tiktok", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  
  const hasFrontend = !!process.env.FRONTEND_URL || !isProd;
  const hasApi = !!process.env.API_URL || !isProd;
  const hasTiktokKey = !!process.env.TIKTOK_CLIENT_KEY;
  const hasTiktokSecret = !!process.env.TIKTOK_CLIENT_SECRET;

  res.json({
    status: "ok",
    diagnostics: {
      hasFrontend,
      hasApi,
      hasTiktokKey,
      hasTiktokSecret
    }
  });
});

export default router;
