
import express from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma.js";

const router = express.Router();

// ===============================
// INSCRIPTION
// ===============================
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Vérification des types
        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                error: "Les champs fournis sont invalides"
            });
        }

        // Nettoyage des champs
        const nom = username.trim();
        const adresseEmail = email.trim().toLowerCase();

        // Vérification des champs obligatoires
        if (!nom || !adresseEmail || !password) {
            return res.status(400).json({
                error: "Tous les champs sont obligatoires"
            });
        }

        // Vérification du nom d'utilisateur
        if (nom.length < 3 || nom.length > 30) {
            return res.status(400).json({
                error: "Le nom d'utilisateur doit contenir entre 3 et 30 caractères"
            });
        }

        // Vérification de l'adresse email
        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresseEmail) ||
            adresseEmail.length > 254
        ) {
            return res.status(400).json({
                error: "Adresse email invalide"
            });
        }

        // Vérification de la longueur du mot de passe
        if (password.length < 10) {
            return res.status(400).json({
                error: "Le mot de passe doit contenir au moins 10 caractères"
            });
        }

        // bcrypt ne traite que les 72 premiers octets
        if (Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                error: "Le mot de passe ne doit pas dépasser 72 octets"
            });
        }

        // Vérification de l'existence du compte
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: nom },
                    { email: adresseEmail }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                error: "Ce nom d'utilisateur ou cette adresse email est déjà utilisé"
            });
        }

        // Hachage du mot de passe
        const passwordHash = await bcrypt.hash(password, 12);

        // Création du compte
        const user = await prisma.user.create({
            data: {
                username: nom,
                email: adresseEmail,
                passwordHash
            },
            select: {
                id: true,
                username: true,
                email: true
            }
        });

        return res.status(201).json({
            message: "Inscription réussie",
            user
        });

    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);

        // Gestion des doublons en base de données
        if (error.code === "P2002") {
            return res.status(409).json({
                error: "Ce nom d'utilisateur ou cette adresse email est déjà utilisé"
            });
        }

        return res.status(500).json({
            error: "Une erreur est survenue lors de l'inscription"
        });
    }
});

// ===============================
// CONNEXION
// ===============================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérification des types
        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                error: "Adresse email et mot de passe obligatoires"
            });
        }

        const adresseEmail = email.trim().toLowerCase();

        if (!adresseEmail || !password) {
            return res.status(400).json({
                error: "Adresse email et mot de passe obligatoires"
            });
        }

        // Recherche du compte
        const user = await prisma.user.findUnique({
            where: {
                email: adresseEmail
            }
        });

        // Message générique pour éviter de révéler si le compte existe
        if (!user) {
            return res.status(401).json({
                error: "Adresse email ou mot de passe incorrect"
            });
        }

        // Vérification du mot de passe
        const passwordCorrect = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                error: "Adresse email ou mot de passe incorrect"
            });
        }

        // Régénération de la session après authentification
        req.session.regenerate((error) => {
            if (error) {
                console.error("Erreur de session :", error);

                return res.status(500).json({
                    error: "Impossible d'ouvrir la session"
                });
            }

            req.session.userId = user.id;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error("Erreur de sauvegarde de session :", saveError);

                    return res.status(500).json({
                        error: "Impossible de sauvegarder la session"
                    });
                }

                return res.json({
                    message: "Connexion réussie",
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                });
            });
        });

    } catch (error) {
        console.error("Erreur lors de la connexion :", error);

        return res.status(500).json({
            error: "Une erreur est survenue lors de la connexion"
        });
    }
});

// ===============================
// UTILISATEUR CONNECTÉ
// ===============================
router.get("/me", async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                error: "Vous devez être connecté"
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.session.userId
            },
            select: {
                id: true,
                username: true,
                email: true
            }
        });

        if (!user) {
            return res.status(401).json({
                error: "Utilisateur introuvable"
            });
        }

        return res.json(user);

    } catch (error) {
        console.error("Erreur lors de la récupération du compte :", error);

        return res.status(500).json({
            error: "Impossible de récupérer les informations du compte"
        });
    }
});

// ===============================
// DÉCONNEXION
// ===============================
router.post("/logout", (req, res) => {
    if (!req.session) {
        return res.json({
            message: "Déconnexion réussie"
        });
    }

    req.session.destroy((error) => {
        if (error) {
            console.error("Erreur lors de la déconnexion :", error);

            return res.status(500).json({
                error: "Impossible de se déconnecter"
            });
        }

        // Le nom du cookie doit correspondre à celui configuré
        // dans express-session dans src/app.js.
        res.clearCookie("connect.sid");

        return res.json({
            message: "Déconnexion réussie"
        });
    });
});

export default router;
