//appRoutes.js
import { Router } from "express";
import { deploymentInitiate, deploymentInitiateFake } from "../controllers/deploymentController.js";
import ensureAuthenticated from "../middlewares/authMiddleware.js";
import {checkProjectNameAvailability} from "../utils/utils.js";


const router = Router();

router.post("/v1/deploy", ensureAuthenticated , deploymentInitiateFake);

router.get('/v1/project-name-availability' , checkProjectNameAvailability);



export default router;