//appRoutes.js
import { Router } from "express";
import { getHome, getDashboard, getNewDeployment, getProjectById ,getDeploymentById, getDeploymentsList , getProjectsList ,getHelpCenter, getSettings , getProjectDeployedPage } from "../controllers/appController.js";
import ensureAuthenticated from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getHome);
router.get("/settings", ensureAuthenticated , getSettings);
router.get("/dashboard", ensureAuthenticated , getDashboard);
router.get("/help-center", ensureAuthenticated, getHelpCenter);

//projects
router.get("/new-project", ensureAuthenticated , getNewDeployment);
router.get("/projects" , ensureAuthenticated, getProjectsList);
router.get("/project/:projectId" , ensureAuthenticated, getProjectById);

//deployments
router.get("/deployed/:projectId", ensureAuthenticated, getProjectDeployedPage);
router.get("/deployments" , ensureAuthenticated , getDeploymentsList);
router.get("/deployment/:deploymentId" , ensureAuthenticated , getDeploymentById);

export default router;