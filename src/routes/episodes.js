
import express from "express";
import prisma from "../prisma.js";

const router = express.Router();
const API_URL = "https://api.attackontitanapi.com/episodes";

let cacheImages = new Map();
let derniereMajImages = 0;
let chargementImages = null;

async function chargerImages() {
    // Réutiliser les images pendant 1 heure.
    if (Date.now() - derniereMajImages < 60 * 60 * 1000) {
        return cacheImages;
    }

    // Éviter plusieurs chargements simultanés.
    if (chargementImages) {
        return chargementImages;
    }

    chargementImages = (async () => {
        const images = new Map();
        let url = API_URL;

        while (url) {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(8000)
            });

            if (!response.ok) {
                throw new Error(`Erreur API : HTTP ${response.status}`);
            }

            const donnees = await response.json();

            for (const episode of donnees.results ?? []) {
                images.set(String(episode.id), episode.img ?? null);
            }

            url = donnees.info?.next_page ?? null;
        }

        cacheImages = images;
        derniereMajImages = Date.now();

        return cacheImages;
    })();

    try {
        return await chargementImages;
    } finally {
        chargementImages = null;
    }
}

router.get("/", async (req, res) => {
    try {
        // La base de données reste prioritaire.
        const episodes = await prisma.episode.findMany({
            include: {
                season: true,
                reviews: {
                    select: {
                        rating: true
                    }
                }
            },
            orderBy: [
                { season: { number: "asc" } },
                { number: "asc" }
            ]
        });

        // Ne pas bloquer l'affichage si l'API d'images échoue.
        let images = cacheImages;

        try {
            images = await chargerImages();
        } catch (error) {
            console.error(
                "Images indisponibles, affichage sans images :",
                error.message
            );
        }

        const resultat = episodes.map((episode) => {
            const notes = episode.reviews;

            const moyenne = notes.length
                ? notes.reduce((total, avis) => total + avis.rating, 0)
                    / notes.length
                : 0;

            return {
                id: episode.id,
                externalId: episode.externalId,
                episode: `S${episode.season.number}E${String(
                    episode.number
                ).padStart(2, "0")}`,
                title: episode.title,
                description: episode.description,
                season: episode.season.number,
                image: images.get(String(episode.externalId)) ?? null,
                averageRating: Number(moyenne.toFixed(1)),
                reviewCount: notes.length
            };
        });

        res.json(resultat);
    } catch (error) {
        console.error("Erreur récupération épisodes :", error);

        res.status(500).json({
            error: "Impossible de récupérer les épisodes."
        });
    }
});

export default router;
