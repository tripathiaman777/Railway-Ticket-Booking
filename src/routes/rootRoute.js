import { Router } from "express";
import ticketRoutes from "./ticketRoutes.js";
import rateLimit from "express-rate-limit";

const rootRoute = Router();

// Rate limiter: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: "Too many requests, please try again later." }
});

rootRoute.use(limiter);
rootRoute.use("/ticket", ticketRoutes);

export default rootRoute;