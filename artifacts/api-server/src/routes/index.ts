import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import restaurantsRouter from "./restaurants";
import menuRouter from "./menu";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";
import deliveryRouter from "./delivery";
import adminRouter from "./admin";
import adminExtendedRouter from "./admin-extended";
import razorpayRouter from "./razorpay";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(restaurantsRouter);
router.use(menuRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);
router.use(analyticsRouter);
router.use(deliveryRouter);
router.use(adminRouter);
router.use(adminExtendedRouter);
router.use(razorpayRouter);
router.use(uploadRouter);

export default router;
