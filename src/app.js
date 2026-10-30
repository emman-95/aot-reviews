import "dotenv/config";
import express from "express";
import session from "express-session";
import helmet from "helmet";

import authRoutes from "./routes/auth.js";
import episodeRoutes from "./routes/episodes.js";
import reviewRoutes from "./routes/reviews.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Sécurité HTTP et Content Security Policy
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "https://fonts.googleapis.com"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'none'"],
                formAction: ["'self'"]
            }
        }
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        name: "aot.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: isProduction,
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

// Fichiers du site
app.use(express.static("public"));

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/episodes", episodeRoutes);
app.use("/api/reviews", reviewRoutes);

// Route de test protégée
app.get("/api/protected", requireAuth, (req, res) => {
    res.json({ message: "Accès autorisé" });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});