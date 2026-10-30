
console.log("episodes.js est bien chargé");

// =============================================
// 1. CHARGER ET AFFICHER LES ÉPISODES
// =============================================

async function chargerEpisodes() {
    const conteneur = document.getElementById("episodes");

    if (!conteneur) {
        console.error("Le conteneur #episodes est introuvable.");
        return;
    }

    conteneur.innerHTML =
        '<p class="loading-message">Chargement des épisodes...</p>';

    try {
        const response = await fetch("/api/episodes");

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const episodes = await response.json();
        window.tousLesEpisodes = episodes;
        conteneur.innerHTML = "";

        if (!Array.isArray(episodes) || episodes.length === 0) {
            conteneur.textContent = "Aucun épisode disponible.";
            return;
        }

        episodes.forEach((episode) => {
            const carte = document.createElement("article");
            carte.className = "episode-card";

            const zoneImage = document.createElement("div");
            zoneImage.className = "episode-image";

            if (episode.image) {
                const image = document.createElement("img");
                image.src = episode.image;
                image.alt = episode.title || "Image de l'épisode";
                image.loading = "lazy";

                image.onerror = () => {
                    image.remove();
                    zoneImage.classList.add("no-image");
                };

                zoneImage.appendChild(image);
            } else {
                zoneImage.classList.add("no-image");
            }

            const badge = document.createElement("span");
            badge.className = "episode-number";
            badge.textContent = episode.episode ?? `Épisode ${episode.id}`;
            zoneImage.appendChild(badge);

            const contenu = document.createElement("div");
            contenu.className = "episode-info";

            const titre = document.createElement("h3");
            titre.textContent = episode.title || "Titre indisponible";

            const description = document.createElement("p");
            description.className = "episode-description";

            const nombreAvis = episode.reviewCount ?? 0;
            const note = nombreAvis > 0
                ? `${episode.averageRating}/5`
                : "Pas encore noté";

            description.textContent =
                `${nombreAvis} avis · Note moyenne : ${note}`;

            const bouton = document.createElement("button");
            bouton.className = "episode-button";
            bouton.type = "button";
            bouton.textContent = "Voir les détails →";

            bouton.addEventListener("click", () => {
                ouvrirDetailsEpisode(episode);
            });

            contenu.append(titre, description, bouton);
            carte.append(zoneImage, contenu);
            conteneur.appendChild(carte);
        });
    } catch (error) {
        console.error("Erreur de chargement des épisodes :", error);
        conteneur.textContent =
            "Impossible de charger les épisodes. Vérifie que le serveur fonctionne.";
    }
}

// =============================================
// 2. INTERFACE DE CRITIQUE D'UN ÉPISODE
// =============================================

async function ouvrirDetailsEpisode(episode) {
    const conteneur = document.getElementById("episodes");

    conteneur.innerHTML = `
        <section class="review-page">

            <button id="retour-episodes" class="review-back" type="button">
                <span>←</span> RETOUR AUX ÉPISODES
            </button>

            <header class="review-hero">
                <div class="review-hero-line"></div>
                <p class="review-eyebrow">
                    BATAILLON D'EXPLORATION · ARCHIVES
                </p>
                <h2>VOTRE <span>CRITIQUE</span></h2>
                <p class="review-intro">
                    Chaque bataille laisse une trace. Partage ton regard
                    sur cet épisode avec la communauté.
                </p>
            </header>

            <article class="review-episode-banner">
                <div class="review-episode-symbol">壁</div>
                <div class="review-episode-meta">
                    <span class="review-overline">ÉPISODE SÉLECTIONNÉ</span>
                    <h3 id="titre-episode"></h3>
                    <p id="numero-episode"></p>
                </div>
                <div class="review-stamp">SNK<br>REVIEW</div>
            </article>

            <div class="review-layout">

                <section class="review-form-panel">
                    <div class="review-panel-heading">
                        <span class="review-step">01</span>
                        <div>
                            <h3>TON VERDICT</h3>
                            <p>Exprime ce que tu as pensé de l'épisode.</p>
                        </div>
                    </div>

                    <form id="form-avis" class="review-form">

                        <div class="review-field">
                            <label>TA NOTE GLOBALE</label>
                            <p class="review-field-hint">
                                Sélectionne les étoiles qui correspondent à ton ressenti.
                            </p>

                            <input type="hidden" name="rating" value="">

                            <div class="review-stars" role="group"
                                aria-label="Choisir une note sur cinq">
                                ${[1, 2, 3, 4, 5].map((n) => `
                                    <button
                                        type="button"
                                        class="review-star"
                                        data-rating="${n}"
                                        aria-label="${n} sur 5"
                                        aria-pressed="false"
                                    >★</button>
                                `).join("")}
                            </div>

                            <div class="review-rating-summary">
                                <strong id="note-selectionnee">— / 5</strong>
                                <span id="texte-note">À toi de juger</span>
                            </div>
                        </div>

                        <div class="review-divider"></div>

                        <div class="review-field">
                            <label for="commentaire-avis">TON ANALYSE</label>
                            <p class="review-field-hint">
                                Scénario, émotions, combats, révélations...
                                Qu'est-ce qui t'a marqué ?
                            </p>

                            <textarea
                                id="commentaire-avis"
                                name="comment"
                                maxlength="2000"
                                minlength="10"
                                required
                                placeholder="Raconte ton ressenti, les moments qui t'ont marqué et ce que tu retiens de cet épisode..."
                            ></textarea>

                            <div class="review-textarea-footer">
                                <span>MINIMUM 10 CARACTÈRES</span>
                                <span>
                                    <strong id="compteur-commentaire">0</strong>
                                    / 2000
                                </span>
                            </div>
                        </div>

                        <div class="review-spoiler-note">
                            <span>⚠</span>
                            <p>
                                <strong>Attention aux spoilers.</strong>
                                Évite de révéler les événements importants
                                sans prévenir les autres lecteurs.
                            </p>
                        </div>

                        <p id="message-avis" class="review-message"
                            role="status"></p>

                        <button class="review-submit" type="submit">
                            <span>PUBLIER MA CRITIQUE</span>
                            <span class="review-submit-arrow">→</span>
                        </button>

                        <p class="review-form-footer">
                            TON AVIS CONTRIBUE À LA MÉMOIRE DE LA COMMUNAUTÉ.
                        </p>
                    </form>
                </section>

                <aside class="review-side-panel">
                    <div class="review-side-top">
                        <span class="review-side-symbol">調査兵団</span>
                        <p>LE REGARD DES FANS</p>
                        <h3>LA COMMUNAUTÉ<br>PREND LA PAROLE.</h3>
                    </div>

                    <div class="review-stat">
                        <span>AVIS PUBLIÉS</span>
                        <strong id="nombre-avis">—</strong>
                    </div>

                    <div class="review-stat">
                        <span>NOTE MOYENNE</span>
                        <strong id="moyenne-avis">—<small>/5</small></strong>
                    </div>

                    <div class="review-quote">
                        « Ce sont les souvenirs de chacun qui donnent
                        leur valeur aux histoires. »
                    </div>

                    <div class="review-side-bottom">
                        AOT REVIEWS <span>·</span> SHINZOU WO SASAGEYO
                    </div>
                </aside>

            </div>

            <section class="review-community">
                <div class="review-community-heading">
                    <div>
                        <p class="review-eyebrow">
                            LES VOIX DE LA COMMUNAUTÉ
                        </p>
                        <h3>LES DERNIÈRES CRITIQUES</h3>
                    </div>
                    <span class="review-community-mark">REVIEWS / 01</span>
                </div>

                <div id="liste-avis" class="review-list">
                    <p class="review-loading">
                        Chargement des critiques...
                    </p>
                </div>
            </section>

        </section>
    `;

    document.getElementById("titre-episode").textContent =
        episode.title || "Épisode sans titre";

    document.getElementById("numero-episode").textContent =
        episode.episode || `Épisode ${episode.id}`;

    document.getElementById("retour-episodes").addEventListener("click", () => {
        chargerEpisodes();
    });

    const formulaire = document.getElementById("form-avis");
    const champNote = formulaire.elements.rating;
    const champCommentaire = formulaire.elements.comment;
    const compteur = document.getElementById("compteur-commentaire");
    const message = document.getElementById("message-avis");
    const boutonsEtoiles = [
        ...formulaire.querySelectorAll(".review-star")
    ];

    const textesNotes = {
        1: "Très décevant",
        2: "Peut mieux faire",
        3: "Un bon épisode",
        4: "Excellent épisode",
        5: "Un épisode légendaire"
    };

    function actualiserEtoiles(note) {
        boutonsEtoiles.forEach((bouton) => {
            const valeur = Number(bouton.dataset.rating);
            const selectionne = valeur <= note;

            bouton.classList.toggle("selected", selectionne);
            bouton.setAttribute("aria-pressed", String(valeur === note));
        });

        document.getElementById("note-selectionnee").textContent =
            note > 0 ? `${note} / 5` : "— / 5";

        document.getElementById("texte-note").textContent =
            textesNotes[note] || "À toi de juger";
    }

    boutonsEtoiles.forEach((bouton) => {
        bouton.addEventListener("click", () => {
            champNote.value = bouton.dataset.rating;
            actualiserEtoiles(Number(champNote.value));
        });
    });

    champCommentaire.addEventListener("input", () => {
        compteur.textContent = champCommentaire.value.length;
    });

    // Publier une critique
    formulaire.addEventListener("submit", async (event) => {
        event.preventDefault();

        const note = Number(champNote.value);
        const commentaire = champCommentaire.value.trim();
        const bouton = formulaire.querySelector('button[type="submit"]');

        if (!note || note < 1 || note > 5) {
            message.textContent = "Choisis d'abord une note avec les étoiles.";
            message.className = "review-message error";
            return;
        }

        if (commentaire.length < 10) {
            message.textContent =
                "Ton commentaire doit contenir au moins 10 caractères.";
            message.className = "review-message error";
            return;
        }

        bouton.disabled = true;
        message.textContent = "Publication de ta critique...";
        message.className = "review-message";

        try {
            const response = await fetch(
                `/api/reviews/episode/${encodeURIComponent(episode.id)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        rating: note,
                        comment: commentaire
                    })
                }
            );

            const resultat = await response.json();

            if (!response.ok) {
                throw new Error(
                    resultat.error ||
                    resultat.message ||
                    (response.status === 401
                        ? "Connecte-toi pour publier ta critique."
                        : "La publication a échoué.")
                );
            }

            // Recharger la fiche pour afficher la critique publiée.
            await ouvrirDetailsEpisode(episode);
        } catch (error) {
            message.textContent = error.message;
            message.className = "review-message error";
        } finally {
            bouton.disabled = false;
        }
    });

    // Charger les critiques existantes
    try {
        const response = await fetch(
            `/api/reviews/episode/${encodeURIComponent(episode.id)}`
        );

        if (!response.ok) {
            throw new Error("Impossible de charger les critiques.");
        }

        const avis = await response.json();
        const liste = document.getElementById("liste-avis");

        document.getElementById("nombre-avis").textContent = avis.length;

        if (avis.length > 0) {
            const moyenne = avis.reduce(
                (total, item) => total + item.rating,
                0
            ) / avis.length;

            document.getElementById("moyenne-avis").innerHTML =
                `${moyenne.toFixed(1)}<small>/5</small>`;
        } else {
            document.getElementById("moyenne-avis").innerHTML =
                `—<small>/5</small>`;
        }

        liste.innerHTML = "";

        if (avis.length === 0) {
            liste.innerHTML = `
                <div class="review-empty">
                    <span>✦</span>
                    <h4>La première critique n'attend que toi.</h4>
                    <p>
                        Partage ton ressenti et ouvre la discussion
                        avec les autres fans.
                    </p>
                </div>
            `;
            return;
        }

        avis.forEach((item) => {
            const carte = document.createElement("article");
            carte.className = "review-community-card";

            const entete = document.createElement("div");
            entete.className = "review-card-header";

            const avatar = document.createElement("div");
            avatar.className = "review-avatar";
            avatar.textContent =
                (item.user?.username || "?").charAt(0).toUpperCase();

            const infos = document.createElement("div");
            infos.className = "review-author-info";

            const auteur = document.createElement("h4");
            auteur.textContent = item.user?.username || "Membre";

            const date = document.createElement("p");
            date.textContent = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                })
                : "Membre de la communauté";

            infos.append(auteur, date);

            const note = document.createElement("span");
            note.className = "review-card-rating";
            note.textContent = `★ ${item.rating}/5`;

            entete.append(avatar, infos, note);

            const commentaire = document.createElement("p");
            commentaire.className = "review-card-comment";
            commentaire.textContent = item.comment;

            carte.append(entete, commentaire);
            liste.appendChild(carte);
        });
    } catch (error) {
        document.getElementById("liste-avis").textContent = error.message;
    }
}

// =============================================
// 3. DÉMARRER LE CHARGEMENT
// =============================================

chargerEpisodes();

const filtreSaison = document.getElementById("filtre-saison");

if (filtreSaison) {
    filtreSaison.addEventListener("change", () => {
        const saison = filtreSaison.value;

        const episodesFiltres = saison === "all"
            ? window.tousLesEpisodes
            : window.tousLesEpisodes.filter((episode) => {
                return String(episode.season) === saison;
            });

        afficherEpisodes(episodesFiltres);
    });
}

function afficherEpisodes(episodes) {
    const conteneur = document.getElementById("episodes");

    // Réutiliser le rendu des épisodes existant.
    // Cette fonction doit contenir la boucle episodes.forEach(...)
    // qui construit les cartes des épisodes.
}
