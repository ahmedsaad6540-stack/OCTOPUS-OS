import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import providersRouter from "./providers.js";
import socialRouter from "./social.js";
import affiliatesRouter from "./affiliates.js";
import campaignsRouter from "./campaigns.js";
import systemEventsRouter from "./system-events.js";
import tasksRouter from "./tasks.js";
import brainRouter from "./brain.js";
import rulesRouter from "./rules.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(providersRouter);
router.use(socialRouter);
router.use(affiliatesRouter);
router.use(campaignsRouter);
router.use(systemEventsRouter);
router.use(tasksRouter);
router.use(brainRouter);
router.use(rulesRouter);

export default router;
