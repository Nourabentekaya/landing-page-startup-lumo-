
document.documentElement.classList.add("js");

// L'utilisateur a-t-il demandé moins d'animations dans son système ?
const reduireMouvement = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1. MENU DYNAMIQUE : le header se cache quand on descend
//    et réapparaît quand on remonte
const entete = document.querySelector(".site-header");
let dernierScroll = window.scrollY;   // position précédente de la page

window.addEventListener("scroll", () => {
  const actuel = window.scrollY;      // position actuelle

  if (actuel > dernierScroll && actuel > 100) {
    entete.classList.add("cache");    // on descend : on cache
  } else {
    entete.classList.remove("cache"); // on monte : on affiche
  }
  dernierScroll = actuel;
});

// Si on navigue au clavier (touche Tab), le header doit rester visible
entete.addEventListener("focusin", () => entete.classList.remove("cache"));


// 2. MODALE (fenêtre popup) avec la balise <dialog>
const modale = document.getElementById("modale-demo");

// Le bouton « Demander une démo » ouvre la modale
document.getElementById("ouvrir-modale").addEventListener("click", () => {
  modale.showModal();
});

// Le bouton « Fermer » la ferme
document.getElementById("fermer-modale").addEventListener("click", () => {
  modale.close();
});

// Le lien « Aller au formulaire » la ferme aussi
document.getElementById("modale-contact").addEventListener("click", () => {
  modale.close();
});

// Un clic sur le fond sombre (en dehors de la fenêtre) la ferme
modale.addEventListener("click", (evenement) => {
  if (evenement.target === modale) {
    modale.close();
  }
});

// 3. COMPTEURS ANIMÉS (bonus) : les chiffres montent de 0 à leur valeur
const compteurs = document.querySelectorAll("[data-compteur]");

function animerCompteur(element) {
  const cible = Number(element.dataset.compteur);   // valeur finale (ex. 120)
  const suffixe = element.dataset.suffixe || "";    // texte après le nombre (ex. " %")

  if (reduireMouvement) {
    element.textContent = cible + suffixe;
    return;
  }
  
  const duree = 1500;                    // durée de l'animation en millisecondes
  const debut = performance.now();       // heure de départ

  function etape(maintenant) {
    const progression = Math.min((maintenant - debut) / duree, 1); // de 0 à 1
    element.textContent = Math.round(cible * progression) + suffixe;
    if (progression < 1) {
      requestAnimationFrame(etape);      // on recommence à la prochaine image
    }
  }
  requestAnimationFrame(etape);
}

// Les compteurs démarrent à 0, puis s'animent quand ils deviennent visibles
compteurs.forEach((c) => { c.textContent = "0" + (c.dataset.suffixe || ""); });

const observateurCompteurs = new IntersectionObserver((entrees) => {
  entrees.forEach((entree) => {
    if (entree.isIntersecting) {
      animerCompteur(entree.target);
      observateurCompteurs.unobserve(entree.target);   // une seule fois
    }
  });
});
compteurs.forEach((c) => observateurCompteurs.observe(c));


// 4. APPARITION AU SCROLL (bonus) : les sections surgissent en douceur
const blocs = document.querySelectorAll(".section .container");
blocs.forEach((bloc) => bloc.classList.add("reveal"));

const observateurReveal = new IntersectionObserver((entrees) => {
  entrees.forEach((entree) => {
    if (entree.isIntersecting) {
      entree.target.classList.add("visible");
      observateurReveal.unobserve(entree.target);
    }
  });
}, { threshold: 0.15 });   // visible quand 15 % du bloc est à l'écran
blocs.forEach((bloc) => observateurReveal.observe(bloc));


// 5. CARROUSEL DE TÉMOIGNAGES
const piste = document.querySelector(".carousel-piste");
const temoignages = document.querySelectorAll(".temoignage");
const info = document.getElementById("carousel-info");
let indexCourant = 0;      // numéro du témoignage affiché (0 = le premier)
let minuteur;              // sert au défilement automatique

function afficher(numero) {
  // Le calcul avec % permet de revenir au début après le dernier (et inversement)
  indexCourant = (numero + temoignages.length) % temoignages.length;
  piste.style.transform = `translateX(-${indexCourant * 100}%)`;
  info.textContent = `${indexCourant + 1} / ${temoignages.length}`;
}

function demarrerAuto() {
  if (reduireMouvement) return;    // pas de défilement automatique si moins de mouvement
  minuteur = setInterval(() => afficher(indexCourant + 1), 6000);
}

function arreterAuto() {
  clearInterval(minuteur);
}

document.getElementById("carousel-prec").addEventListener("click", () => afficher(indexCourant - 1));
document.getElementById("carousel-suiv").addEventListener("click", () => afficher(indexCourant + 1));

// On met le défilement en pause quand la souris est dessus
const carrousel = document.querySelector(".carousel");
carrousel.addEventListener("mouseenter", arreterAuto);
carrousel.addEventListener("mouseleave", demarrerAuto);

demarrerAuto();


// 6. VALIDATION AVANCÉE DU FORMULAIRE DE CONTACT
const formulaire = document.querySelector("form");
const succes = document.getElementById("message-succes");
const compteurMessage = document.getElementById("compteur-message");

// Pour chaque champ : l'élément HTML et une fonction qui renvoie
// un message d'erreur, ou "" si tout est correct.
const champs = {
  nom: {
    element: document.getElementById("nom"),
    verifier: (valeur) => {
      if (valeur.trim().length < 2) return "Le nom doit contenir au moins 2 caractères.";
      return "";
    }
  },
  email: {
    element: document.getElementById("email"),
    verifier: (valeur) => {
      const modele = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;   // quelque chose@quelque-chose.xx
      if (valeur.trim() === "") return "L'email est obligatoire.";
      if (!modele.test(valeur.trim())) return "Entrez une adresse valide, par exemple nom@exemple.com.";
      return "";
    }
  },
  message: {
    element: document.getElementById("message"),
    verifier: (valeur) => {
      if (valeur.trim().length < 10) return "Le message doit contenir au moins 10 caractères.";
      return "";
    }
  }
};

// Vérifie un champ, affiche ou efface son erreur, et renvoie true si le champ est valide
function validerChamp(nomChamp) {
  const champ = champs[nomChamp];
  const erreur = champ.verifier(champ.element.value);
  document.getElementById("erreur-" + nomChamp).textContent = erreur;
  champ.element.classList.toggle("invalide", erreur !== "");
  return erreur === "";
}

for (const nomChamp in champs) {
  const element = champs[nomChamp].element;

  // On vérifie quand l'utilisateur quitte le champ...
  element.addEventListener("blur", () => validerChamp(nomChamp));

  // ...puis en direct pendant qu'il corrige une erreur
  element.addEventListener("input", () => {
    if (element.classList.contains("invalide")) validerChamp(nomChamp);
  });
}

// Compteur de caractères du message
champs.message.element.addEventListener("input", () => {
  compteurMessage.textContent = `${champs.message.element.value.length} / 500`;
});

// À l'envoi du formulaire
formulaire.addEventListener("submit", (evenement) => {
  evenement.preventDefault();      // on empêche l'envoi réel de la page
  succes.textContent = "";

  let toutEstValide = true;
  for (const nomChamp in champs) {
    if (!validerChamp(nomChamp)) toutEstValide = false;
  }

  if (!toutEstValide) {
    // On met le curseur sur le premier champ en erreur
    formulaire.querySelector(".invalide").focus();
    return;
  }

  // Simulation d'envoi : on garde le message dans le navigateur (localStorage)
  try {
    const anciens = JSON.parse(localStorage.getItem("lumo-messages")) || [];
    anciens.push({
      nom: champs.nom.element.value.trim(),
      email: champs.email.element.value.trim(),
      message: champs.message.element.value.trim(),
      date: new Date().toISOString()
    });
    localStorage.setItem("lumo-messages", JSON.stringify(anciens));
  } catch (erreur) {
    // le stockage peut être indisponible : ce n'est pas bloquant
  }

  succes.textContent = "Merci ! Votre message a bien été enregistré.";
  formulaire.reset();
  compteurMessage.textContent = "0 / 500";
});
