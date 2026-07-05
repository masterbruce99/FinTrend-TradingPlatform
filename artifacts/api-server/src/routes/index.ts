import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quotesRouter from "./quotes";
import financeRouter from "./finance";
import cryptoRouter from "./crypto";
import macroRouter from "./macro";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quotesRouter);
router.use(financeRouter);
router.use(cryptoRouter);
router.use(macroRouter);
router.use(aiRouter);

export default router;
