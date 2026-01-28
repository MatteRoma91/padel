Perfetto 🔥
Qui sotto trovi **un prompt unico, completo e riscritto da zero**, ordinato e super chiaro, pensato per far lavorare **Gemini al massimo delle sue capacità** senza ambiguità.
Puoi copiarlo **così com’è** e darlo in pasto direttamente a Gemini.

---

## PROMPT COMPLETO PER GEMINI

Agisci come **sviluppatore web senior, UX/UI designer e product designer**.
Il tuo compito è **progettare e sviluppare un sito web moderno, pulito e accattivante** per la gestione di un torneo di padel chiamato:

# 🟡 Banana Padel Tour

---

## OBIETTIVI DEL PROGETTO

* Tracciare **partite, risultati e classifiche** del torneo
* Offrire un’esperienza **semplice, intuitiva e sportiva**
* Permettere la **gestione dinamica dei giocatori e dei risultati**
* Rendere il sito **full responsive** (mobile-first)

---

## REQUISITI GENERALI

* Design **minimal, sportivo, moderno**
* Ottima leggibilità e gerarchia visiva
* UX fluida e intuitiva
* Codice ordinato, commentato e manutenibile
* Nessuna ridondanza visiva
* Evidenziare vincitori, progressioni e risultati chiave

---

## STRUTTURA DEL SITO

---

## 1️⃣ PAGINA DI BENVENUTO

* Prima pagina all’apertura del sito
* Titolo grande: **Banana Padel Tour**
* Breve sottotitolo descrittivo
* **Bottone centrale “Entra”**
* Animazioni leggere o micro-interazioni (hover, fade-in)
* Redirect alla Home Page

---

## 2️⃣ HOME PAGE

* Menu principale **a icone**
* Voci del menu:

  * 🏆 **D&D Padel Slam**
  * 👥 **Giocatori**
* Layout pulito, responsive, touch-friendly

---

## 3️⃣ PAGINA “D&D PADEL SLAM” – TABELLONE TORNEO

Rappresentare **graficamente il tabellone del torneo**, suddiviso per fasi, con una visualizzazione chiara e intuitiva.

---

### 🔹 QUARTI DI FINALE (20 min – 4 campi)

* Q1: **Cora-Jullios vs Faber-Marcolone**
* Q2: **Braccio-Porra vs Fabio-Dile**
* Q3: **David-Dibby vs Gazza-Scimmia**
* Q4: **Valerio-Merzio vs Danti-Ema Baldi**

Per **ogni partita**:

* Celle/input per inserire il **punteggio**
* Visualizzazione:

  * Squadra vincente
  * Squadra perdente
* Evidenziazione grafica del vincitore

➡️ **Il vincitore deve essere calcolato automaticamente** in base al punteggio inserito.

---

### 🔹 SEMIFINALI (20 min – 4 campi)

**1°–4° posto**

* A1: Vinc. Q1 vs Vinc. Q2
* A2: Vinc. Q3 vs Vinc. Q4

**5°–8° posto**

* B1: Perd. Q1 vs Perd. Q2

* B2: Perd. Q3 vs Perd. Q4

* I nomi delle squadre devono **popolarsi automaticamente**

* Inserimento punteggi

* Calcolo automatico vincitori e perdenti

---

### 🔹 FINALI (35 min – 4 campi)

* Finale 1°/2°: Vinc. A1 vs Vinc. A2

* Finale 3°/4°: Perd. A1 vs Perd. A2

* Finale 5°/6°: Vinc. B1 vs Vinc. B2

* Finale 7°/8°: Perd. B1 vs Perd. B2

* Inserimento punteggi

* Aggiornamento automatico

* Evidenziazione dei piazzamenti finali

---

## 4️⃣ PAGINA “GIOCATORI”

### 📋 Lista Giocatori

* Elenco **puntato o a card**
* Per ogni giocatore mostrare:

  * Nome
  * Immagine/avatar
* Layout ordinato e responsive

### 🔗 Interazione

* **Cliccando sul nome o sull’immagine**:

  * Apertura della **pagina dettaglio giocatore**

---

## 5️⃣ PAGINA DETTAGLIO GIOCATORE

Ogni giocatore deve avere una pagina personale con:

### 🧍 Profilo

* Nome
* Foto
* Mano dominante
* Livello di gioco

### 📊 Statistiche

* Punteggio totale
* Partite giocate
* Vittorie / sconfitte
* Percentuale di vittoria

### 🕘 Risultati Recenti

* Elenco delle ultime partite
* Avversari
* Risultato
* Data
* Evidenziare vittorie e sconfitte con colori differenti

---

## 6️⃣ SEZIONE AMMINISTRATORE

* Area Admin semplice (non serve sicurezza avanzata)
* Funzionalità:

  * Modifica nomi dei partecipanti
  * Aggiunta / rimozione giocatori
  * Caricamento immagini
  * Modifica caratteristiche giocatori
  * Reset torneo
* Le modifiche devono riflettersi in:

  * Tabellone
  * Lista giocatori
  * Pagine personali

---

## LOGICA FUNZIONALE

* Il **vincitore di ogni partita** viene determinato automaticamente dal punteggio
* I risultati aggiornano:

  * Tabellone
  * Statistiche giocatori
  * Storico partite
* Coerenza totale dei dati in tutto il sito

---

## TECNOLOGIE

* Scegli lo stack più adatto (HTML/CSS/JS o framework moderni come React / Vue)
* Spiega le scelte tecniche
* Codice commentato

---

## OUTPUT RICHIESTO

* Struttura del progetto
* Codice completo frontend
* Spiegazione della logica
* Suggerimenti per miglioramenti futuri

---

Se vuoi, posso anche:

* **ridurlo in una versione ultra-compatta**
* adattarlo a **React + Firebase**
* oppure trasformarlo in un prompt **API-first** per backend futuro 🚀
