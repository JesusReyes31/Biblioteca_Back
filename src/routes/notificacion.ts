import { Router } from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notificacion.controller";
import { checkAuth } from "../middleware/session";

const router = Router();

router.get("/:id",checkAuth, getNotifications);
router.put("/read/:id",checkAuth, markAsRead);
router.put("/readall/:userId",checkAuth, markAllAsRead);

export { router };
