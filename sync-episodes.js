
import "dotenv/config";
import prisma from "./src/prisma.js";

const API_URL = "https://api.attackontitanapi.com/episodes";

function extraireNumeros(code) {
    const match = String(code ?? "").match(/^S(\d+)E(\d+)$/i);

    if (!match) return null;

    return {
        saison: Number(match[1]),
        episode: Number(match[2])
    };
}

async function recupererEpisodes() {
    let url = API_URL;
    const episodes = [];
    const urlsVisitees = new Set();

    while (url) {
        if (urlsVisitees.has(url)) {
            throw new Error("Boucle détectée dans la pagination.");
        }

        urlsVisitees.add(url);

        console.log(`Récupération de la page ${urlsVisitees.size}...`);

        const reponse = await fetch(url);

        if (!reponse.ok) {
            throw new Error(`Erreur API HTTP ${reponse.status}`);
        }

        const donnees = await reponse.json();

        episodes.push(...(donnees.results ?? []));

        // L'API utilise next_page, et non next.
        url = donnees.info?.next_page ?? null;
    }

    return episodes;
}

async function synchroniser() {
    const episodesAPI = await recupererEpisodes();

    console.log(`Total récupéré : ${episodesAPI.length} épisodes.`);

    let synchronises = 0;
    let ignores = 0;

    for (const episodeAPI of episodesAPI) {
        const numeros = extraireNumeros(episodeAPI.episode);

        if (!numeros || !episodeAPI.id || !episodeAPI.name) {
            console.warn(`Épisode ignoré : ${episodeAPI.episode ?? "code absent"}`);
            ignores++;
            continue;
        }

        const saison = await prisma.season.upsert({
            where: { number: numeros.saison },
            update: {},
            create: {
                number: numeros.saison,
                title: `Saison ${numeros.saison}`
            }
        });

        const date = episodeAPI.airdate
            ? new Date(episodeAPI.airdate)
            : new Date("2000-01-01T00:00:00.000Z");

        const airDate = Number.isNaN(date.getTime())
            ? new Date("2000-01-01T00:00:00.000Z")
            : date;

        await prisma.episode.upsert({
            where: { externalId: String(episodeAPI.id) },
            update: {
                seasonId: saison.id,
                number: numeros.episode,
                title: episodeAPI.name,
                description: episodeAPI.description ?? "",
                airDate
            },
            create: {
                externalId: String(episodeAPI.id),
                seasonId: saison.id,
                number: numeros.episode,
                title: episodeAPI.name,
                description: episodeAPI.description ?? "",
                airDate
            }
        });

        synchronises++;
    }

    console.log("\nSynchronisation terminée.");
    console.log("Épisodes synchronisés :", synchronises);
    console.log("Épisodes ignorés :", ignores);
    console.log("Saisons en base :", await prisma.season.count());
    console.log("Épisodes en base :", await prisma.episode.count());
}

synchroniser()
    .catch(error => {
        console.error("Erreur de synchronisation :", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
