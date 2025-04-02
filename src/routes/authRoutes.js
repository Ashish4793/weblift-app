//authRoutes.js
import { Router } from "express";
import passport from "passport";
import { logout } from "../controllers/authController.js";
import ensureAuthenticated from "../middlewares/authMiddleware.js";


const router = Router();

router.get("/logout", ensureAuthenticated ,logout);

router.get('/auth' , (req,res) => {
  if(req.isAuthenticated()){
    return res.redirect('/dashboard');
  }
  return res.render('auth');
})


// GitHub OAuth Routes
router.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/auth/github/failure" }),
    (req, res) => {
      res.redirect('/dashboard')
    }
  );
  
router.get("/auth/github/failure", (req, res) => {
    res.status(400).json({ message: "Authentication failed." });
  });
  

export default router;
