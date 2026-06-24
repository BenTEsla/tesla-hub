# 🚗 Tesla Delivery Hub — Rennes

Dashboard intelligent pour préparer et imprimer les livraisons Tesla. Un seul clic pour tout imprimer.

## 🎯 Ce que ça fait

### Dashboard (bookmarklet sur DRO)
- **Vue complète** des livraisons du jour/semaine avec statuts en temps réel
- **Stats en un coup d'œil** : Paiement, COTG, Registration, AFI, Insurance
- **Filtres** : This Week / Next Week / Pull-Up / par CES (Ben, Sacha, Sophie)
- **Smart Dispatch** : répartition automatique des CES avec équilibrage par catégorie

### Impression 1-clic 🖨️
Cliquez sur l'icône imprimante d'une ligne → tout sort automatiquement :

| Type de livraison | Documents imprimés |
|---|---|
| **Standard** | Page de garde |
| **Trade-In** | Page de garde + Trade-In Annex (p.6-11) |
| **Enterprise (B2B)** | Page de garde + ThirdPartyDeliveryDeclaration |

### Page de garde
Fiche A4 Tesla-style avec :
- Photo du véhicule (compositor)
- Infos client, heure, véhicule, plaque, VIN
- Statut Trade-In (vert/rouge)
- Mode de paiement (CASH/LEASING/CRÉDIT/LLD)
- FSD, accessoires, équipe (DA + SA)
- Jauge de satisfaction automatique
- Notes + Incentive checkboxes

---

## 🚀 Installation

### 1. Prérequis
- **Node.js** (v18+)
- **Google Chrome** installé
- Accès à **DRO** et **warpbilling**

### 2. Lancer le serveur
```bash
cd server/
npm install
node server.js
```
Le serveur démarre sur `http://localhost:3000`

### 3. Ajouter le bookmarklet
Créer un favori dans Chrome avec cette URL :
```
javascript:void(fetch('https://api.github.com/repos/BenTEsla/tesla-hub/contents/dashboard.js?t='+Date.now()).then(r=>r.json()).then(j=>eval(atob(j.content))))
```

### 4. Connexion
1. Aller sur **dro.tesla.com** → le token DRO est envoyé automatiquement
2. Cliquer sur **🔑 Login DocGen** dans le dashboard → Chrome s'ouvre, connectez-vous une fois → c'est sauvegardé

---

## 📋 Utilisation quotidienne

### Matin (préparation)
1. Ouvrir **dro.tesla.com**
2. Cliquer le **bookmarklet** → le dashboard s'ouvre
3. Sélectionner la date (Tomorrow)
4. Vérifier les statuts (Paiement, COTG, Registration, Insurance)
5. Cliquer **🖨️** sur chaque livraison → les docs sortent automatiquement
6. Utiliser **Dispatch** pour répartir les CES

### Tokens
- **DRO** : automatique à chaque chargement du bookmarklet
- **DocGen** : cliquer 🔑 Login DocGen (1x par heure, session sauvegardée)

---

## ⚙️ Architecture

```
localhost:3000 (serveur Node.js)
├── /api/dro/*          → Proxy DRO (zéro CORS)
├── /api/docgen/*       → Proxy DocGen
├── /api/print/send/:rn → Génère PDF + imprime directement
├── /api/print/docgen   → Télécharge les packets DocGen
├── /api/auth/tokens    → Stockage tokens (persisté)
├── /api/auth/login-docgen → Login DocGen via Puppeteer
└── /api/print/page-de-garde/:rn → Page de garde HTML
```

### Fichiers clés
- `server.js` — Serveur Express avec proxy + print
- `templates/page-de-garde.html` — Template de la page de garde
- `config.json` — Configuration hub (trtId, CES, imprimante)
- `tokens.json` — Tokens persistés (gitignored)
- `print-status.json` — Suivi des impressions

---

## 👥 Équipe Rennes
| Nom | userId | Rôle |
|---|---|---|
| Ben Daubin | 428058 | CES + Dev |
| Sacha Villa | 399921 | CES |
| Sophie Macé | 444287 | CES |

**Hub** : EU-FR-Saint-Jacques de la Lande (trtId: 28498)
**Imprimante** : RSN03-Printer 2

---

*Built with ❤️ by Ben Daubin — Tesla Rennes*