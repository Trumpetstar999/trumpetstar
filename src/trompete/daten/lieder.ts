/* Bekannte Stuecke, die zwischen die gewuerfelten Melodien gemischt werden.
 * Kopie aus app/data/lieder.json — gebaut von tools/mach-lovable.js. */
/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const daten: any = {
  "_hinweis": [
    "Bekannte Stuecke. Sie werden zwischen die gewuerfelten Melodien gemischt,",
    "sobald alle Toene aus 'braucht' im Tonmaterial sind. Der Name erscheint",
    "ueber dem Notenbild.",
    "",
    "Diese Datei ist zum Erweitern von Hand gedacht — es muss keine Zeile Code",
    "geaendert werden. Schema eines Eintrags:",
    "",
    "  id      eindeutige Zahl (dient auch als Schluessel in der Fortschrittsablage)",
    "  name    der Titel, wie er angezeigt wird",
    "  stufe   '2a' (Melodie, 2 Takte) oder '2b' (Melodie, 4 Takte)",
    "  zaehler Viertel je Takt; ohne Angabe 4",
    "  braucht Liste der Ton-IDs, die im Tonmaterial sein muessen",
    "  takte   Liste von Takten, jeder Takt eine Liste von [tonId, notenwert].",
    "          notenwert: 8 = Achtel, 4 = Viertel, 2 = Halbe, 1 = Ganze;",
    "          mit Punkt als Text: \"4.\" = punktierte Viertel, \"2.\" = punktierte Halbe.",
    "          tonId null = Pause. Jeder Takt muss 'zaehler' Schlaege ergeben.",
    "",
    "Alles steht in der Notation der B-Trompete: was hier c1 heisst, klingt als b.",
    "Aufgenommen sind nur gemeinfreie Melodien."
  ],
  "lieder": [
    {
      "id": 900101, "name": "Hot Cross Buns", "stufe": "2a",
      "braucht": ["c1", "d1", "e1"],
      "takte": [
        [["e1", 4], ["d1", 4], ["c1", 2]],
        [["e1", 4], ["d1", 4], ["c1", 2]]
      ]
    },
    {
      "id": 900102, "name": "Bruder Jakob (Anfang)", "stufe": "2a",
      "braucht": ["c1", "d1", "e1"],
      "takte": [
        [["c1", 4], ["d1", 4], ["e1", 4], ["c1", 4]],
        [["c1", 4], ["d1", 4], ["e1", 4], ["c1", 4]]
      ]
    },
    {
      "id": 900103, "name": "Ode an die Freude (Anfang)", "stufe": "2a",
      "braucht": ["d1", "e1", "f1", "g1"],
      "takte": [
        [["e1", 4], ["e1", 4], ["f1", 4], ["g1", 4]],
        [["g1", 4], ["f1", 4], ["e1", 4], ["d1", 4]]
      ]
    },
    {
      "id": 900201, "name": "Au clair de la lune", "stufe": "2b",
      "braucht": ["c1", "d1", "e1"],
      "takte": [
        [["c1", 4], ["c1", 4], ["c1", 4], ["d1", 4]],
        [["e1", 2], ["d1", 2]],
        [["c1", 4], ["e1", 4], ["d1", 4], ["d1", 4]],
        [["c1", 1]]
      ]
    },
    {
      "id": 900202, "name": "Mary Had a Little Lamb", "stufe": "2b",
      "braucht": ["c1", "d1", "e1", "g1"],
      "takte": [
        [["e1", 4], ["d1", 4], ["c1", 4], ["d1", 4]],
        [["e1", 4], ["e1", 4], ["e1", 2]],
        [["d1", 4], ["d1", 4], ["d1", 2]],
        [["e1", 4], ["g1", 4], ["g1", 2]]
      ]
    },
    {
      "id": 900203, "name": "Jingle Bells (Refrain)", "stufe": "2b",
      "braucht": ["c1", "d1", "e1", "g1"],
      "takte": [
        [["e1", 4], ["e1", 4], ["e1", 2]],
        [["e1", 4], ["e1", 4], ["e1", 2]],
        [["e1", 4], ["g1", 4], ["c1", "4."], ["d1", 8]],
        [["e1", 1]]
      ]
    },
    {
      "id": 900204, "name": "When the Saints Go Marching In", "stufe": "2b",
      "braucht": ["c1", "e1", "f1", "g1"],
      "takte": [
        [[null, 4], ["c1", 4], ["e1", 4], ["f1", 4]],
        [["g1", 1]],
        [[null, 4], ["c1", 4], ["e1", 4], ["f1", 4]],
        [["g1", 1]]
      ]
    },
    {
      "id": 900205, "name": "Bruder Jakob", "stufe": "2b",
      "braucht": ["c1", "d1", "e1", "f1", "g1"],
      "takte": [
        [["c1", 4], ["d1", 4], ["e1", 4], ["c1", 4]],
        [["c1", 4], ["d1", 4], ["e1", 4], ["c1", 4]],
        [["e1", 4], ["f1", 4], ["g1", 2]],
        [["e1", 4], ["f1", 4], ["g1", 2]]
      ]
    },
    {
      "id": 900206, "name": "Ode an die Freude", "stufe": "2b",
      "braucht": ["c1", "d1", "e1", "f1", "g1"],
      "takte": [
        [["e1", 4], ["e1", 4], ["f1", 4], ["g1", 4]],
        [["g1", 4], ["f1", 4], ["e1", 4], ["d1", 4]],
        [["c1", 4], ["c1", 4], ["d1", 4], ["e1", 4]],
        [["e1", "4."], ["d1", 8], ["d1", 2]]
      ]
    },
    {
      "id": 900207, "name": "Scarborough Fair", "stufe": "2b", "zaehler": 3,
      "braucht": ["d1", "e1", "f1", "a1"],
      "takte": [
        [["d1", 2], ["d1", 4]],
        [["a1", 2], ["a1", 4]],
        [["e1", "4."], ["f1", 8], ["e1", 4]],
        [["d1", "2."]]
      ]
    },
    {
      "id": 900208, "name": "Morgen kommt der Weihnachtsmann", "stufe": "2b",
      "braucht": ["c1", "d1", "e1", "f1", "g1", "a1"],
      "takte": [
        [["c1", 4], ["c1", 4], ["g1", 4], ["g1", 4]],
        [["a1", 4], ["a1", 4], ["g1", 2]],
        [["f1", 4], ["f1", 4], ["e1", 4], ["e1", 4]],
        [["d1", 4], ["d1", 4], ["c1", 2]]
      ]
    },
    {
      "id": 900209, "name": "Aura Lee", "stufe": "2b",
      "braucht": ["g1", "a1", "h1", "c2", "d2"],
      "takte": [
        [["g1", 4], ["c2", 4], ["h1", 4], ["c2", 4]],
        [["d2", 4], ["a1", 4], ["d2", 2]],
        [["c2", 4], ["h1", 4], ["a1", 4], ["h1", 4]],
        [["c2", 1]]
      ]
    }
  ]
};
export default daten;
