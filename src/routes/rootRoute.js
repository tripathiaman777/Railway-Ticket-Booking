import { Router } from "express";
import ticketRoutes from "./ticketRoutes.js";

const rootRoute = Router();

rootRoute.use("/ticket", ticketRoutes);

export default rootRoute;