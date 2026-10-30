
import express from "express";
import prisma from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Récupérer les avis d'un épisode
router.get("/episode/:episodeId", async (req, res) => {
    try {
        const episodeId = Number(req.params.episodeId);

        if (!Number.isInteger(episodeId) || episodeId <= 0) {
            return res.status(400).json({
                error: "ID d'épisode invalide."
            });
        }

        const reviews = await prisma.review.findMany({
            where: { episodeId },
            select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return res.json(reviews);
    } catch (error) {
        console.error("Erreur récupération avis :", error);
        return res.status(500).json({
            error: "Impossible de récupérer les avis."
        });
    }
});

// Publier ou modifier son avis sur un épisode
router.post("/episode/:episodeId", requireAuth, async (req, res) => {
    try {
        const episodeId = Number(req.params.episodeId);
        const userId = req.session.userId;
        const rating = Number(req.body.rating);
        const comment = req.body.comment;

        if (!Number.isInteger(episodeId) || episodeId <= 0) {
            return res.status(400).json({
                error: "ID d'épisode invalide."
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                error: "La note doit être comprise entre 1 et 5."
            });
        }

        if (typeof comment !== "string" || !comment.trim()) {
            return res.status(400).json({
                error: "Le commentaire est obligatoire."
            });
        }

        if (comment.trim().length > 2000) {
            return res.status(400).json({
                error: "Le commentaire ne doit pas dépasser 2000 caractères."
            });
        }

        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            select: { id: true }
        });

        if (!episode) {
            return res.status(404).json({
                error: "Épisode introuvable dans la base de données."
            });
        }

        const review = await prisma.review.upsert({
            where: {
                userId_episodeId: {
                    userId,
                    episodeId
                }
            },
            update: {
                rating,
                comment: comment.trim()
            },
            create: {
                userId,
                episodeId,
                rating,
                comment: comment.trim()
            },
            select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });

        return res.status(200).json({
            message: "Avis enregistré avec succès.",
            review
        });
    } catch (error) {
        console.error("Erreur publication avis :", error);
        return res.status(500).json({
            error: "Impossible d'enregistrer l'avis."
        });
    }
});

export default router;