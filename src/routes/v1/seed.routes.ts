import { Router } from "express";
import { getUsers, seedUsers } from "../../controllers/v1/seed.controller.js";

const router = Router();

router.get("/users", getUsers);
router.post("/users", seedUsers);

export default router;
