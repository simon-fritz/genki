import initSqlJs from 'sql.js';
import JSZip from 'jszip';
import type { Card } from '@/api/cards';

interface AnkiDeck {
    name: string;
    cards: Card[];
}

export async function exportToApkg(deck: AnkiDeck): Promise<Blob> {
    // Initialize SQL.js
    const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });

    // Create a new database
    const db = new SQL.Database();

    // Create Anki database schema (simplified version)
    db.run(`
        CREATE TABLE col (
            id INTEGER PRIMARY KEY,
            crt INTEGER NOT NULL,
            mod INTEGER NOT NULL,
            scm INTEGER NOT NULL,
            ver INTEGER NOT NULL,
            dty INTEGER NOT NULL,
            usn INTEGER NOT NULL,
            ls INTEGER NOT NULL,
            conf TEXT NOT NULL,
            models TEXT NOT NULL,
            decks TEXT NOT NULL,
            dconf TEXT NOT NULL,
            tags TEXT NOT NULL
        );
    `);

    db.run(`
        CREATE TABLE notes (
            id INTEGER PRIMARY KEY,
            guid TEXT NOT NULL,
            mid INTEGER NOT NULL,
            mod INTEGER NOT NULL,
            usn INTEGER NOT NULL,
            tags TEXT NOT NULL,
            flds TEXT NOT NULL,
            sfld TEXT NOT NULL,
            csum INTEGER NOT NULL,
            flags INTEGER NOT NULL,
            data TEXT NOT NULL
        );
    `);

    db.run(`
        CREATE TABLE cards (
            id INTEGER PRIMARY KEY,
            nid INTEGER NOT NULL,
            did INTEGER NOT NULL,
            ord INTEGER NOT NULL,
            mod INTEGER NOT NULL,
            usn INTEGER NOT NULL,
            type INTEGER NOT NULL,
            queue INTEGER NOT NULL,
            due INTEGER NOT NULL,
            ivl INTEGER NOT NULL,
            factor INTEGER NOT NULL,
            reps INTEGER NOT NULL,
            lapses INTEGER NOT NULL,
            left INTEGER NOT NULL,
            odue INTEGER NOT NULL,
            odid INTEGER NOT NULL,
            flags INTEGER NOT NULL,
            data TEXT NOT NULL
        );
    `);

    db.run(`
        CREATE TABLE revlog (
            id INTEGER PRIMARY KEY,
            cid INTEGER NOT NULL,
            usn INTEGER NOT NULL,
            ease INTEGER NOT NULL,
            ivl INTEGER NOT NULL,
            lastIvl INTEGER NOT NULL,
            factor INTEGER NOT NULL,
            time INTEGER NOT NULL,
            type INTEGER NOT NULL
        );
    `);

    db.run(`
        CREATE TABLE graves (
            usn INTEGER NOT NULL,
            oid INTEGER NOT NULL,
            type INTEGER NOT NULL
        );
    `);

    const now = Date.now();
    const deckId = now; // Use timestamp as unique deck ID to avoid conflicts

    // Basic model (note type) configuration
    const models = {
        "1": {
            id: 1,
            name: "Basic",
            type: 0,
            mod: now,
            usn: -1,
            sortf: 0,
            did: deckId,
            tmpls: [{
                name: "Card 1",
                ord: 0,
                qfmt: "{{Front}}",
                afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
                bqfmt: "",
                bafmt: "",
                did: null,
                bfont: "",
                bsize: 0
            }],
            flds: [
                { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
                { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20 }
            ],
            css: ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n",
            latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
            latexPost: "\\end{document}",
            latexsvg: false,
            req: [[0, "all", [0, 1]]]
        }
    };

    // Deck configuration
    const decks = {
        [deckId]: {
            id: deckId,
            name: deck.name,
            desc: "",
            mod: Math.floor(now / 1000),
            usn: -1,
            collapsed: false,
            browserCollapsed: false,
            newToday: [0, 0],
            revToday: [0, 0],
            lrnToday: [0, 0],
            timeToday: [0, 0],
            conf: 1,
            extendNew: 0,
            extendRev: 0,
            dyn: 0
        }
    };

    // Insert collection data
    db.run(`
        INSERT INTO col VALUES (
            1, ?, ?, 0, 11, 0, 0, 0, '{}', ?, ?, '{"1":{"id":1,"mod":0,"name":"Default","usn":-1,"maxTaken":60,"autoplay":true,"timer":0,"replayq":true,"new":{"bury":false,"delays":[1.0,10.0],"initialFactor":2500,"ints":[1,4,0],"order":1,"perDay":20},"rev":{"bury":false,"ease4":1.3,"ivlFct":1.0,"maxIvl":36500,"perDay":200,"hardFactor":1.2},"lapse":{"delays":[10.0],"leechAction":1,"leechFails":8,"minInt":1,"mult":0.0},"dyn":false}}', '{}'
        )
    `, [now, now, JSON.stringify(models), JSON.stringify(decks)]);

    // Insert notes and cards
    deck.cards.forEach((card, index) => {
        const noteId = index + 1;
        const cardId = index + 1;
        const guid = `${noteId}${now}`;

        // Insert note
        db.run(`
            INSERT INTO notes VALUES (?, ?, 1, ?, 0, '', ?, ?, 0, 0, '')
        `, [
            noteId,
            guid,
            now,
            `${card.front}\x1f${card.back}`,
            card.front.substring(0, 64)
        ]);

        // Calculate due date (days from now)
        const dueInDays = Math.ceil((card.dueAt.getTime() - now) / (1000 * 60 * 60 * 24));

        // Insert card
        db.run(`
            INSERT INTO cards VALUES (?, ?, ?, 0, ?, 0, 2, 2, ?, ?, ?, ?, ?, 0, 0, 0, 0, '')
        `, [
            cardId,
            noteId,
            deckId,
            now,
            dueInDays,
            card.interval,
            Math.round(card.easeFactor * 1000), // Anki stores ease factor as integer (2.5 -> 2500)
            card.repetitions,
            card.lapses
        ]);
    });

    // Export database to binary
    const binaryArray = db.export();
    db.close();

    // Create zip file
    const zip = new JSZip();
    zip.file('collection.anki2', binaryArray);
    zip.file('media', '{}');

    // Generate blob
    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
}

export function downloadApkg(blob: Blob, deckName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deckName}.apkg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
