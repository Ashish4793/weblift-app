//appRoutes.js
import { Router } from "express";
import { deploymentInitiate } from "../controllers/deploymentController.js";
import ensureAuthenticated from "../middlewares/authMiddleware.js";
import {checkProjectNameAvailability} from "../utils/utils.js";


const router = Router();

router.post("/v1/deploy", ensureAuthenticated , deploymentInitiate);

router.get('/v1/project-name-availability' , checkProjectNameAvailability);



export default router;