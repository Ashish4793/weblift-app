import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import express from "express";
import sessionMiddleware from "./config/sessionStore.js";
import passport from "passport";
import cron from 'node-cron';
import authRoutes from "./routes/authRoutes.js";
import appRoutes from "./routes/appRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import "./config/passport.js";
import { join } from "path";
import path from "path";
import bodyParser from "body-parser";
import { checkAndUpdateDeployments } from "./utils/deploymentStatusUpdater.js";

const app = express();

app.use(express.static(path.resolve("public")));

app.set("views", join(process.cwd(), "src/views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use(appRoutes);
app.use(authRoutes);
app.use("/api", apiRoutes);


cron.schedule('*/1 * * * *', checkAndUpdateDeployments);

app.get('/t' , (req,res) => {
    console.log('s');
})

app.use((req, res, next) => {
    res.status(404).render('404');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
