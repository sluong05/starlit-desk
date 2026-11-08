/**
 * Hand-written puzzle content for the break games. All original.
 * Alternate spellings/names are separated with "|" (first one is shown).
 */

/* ------------------------------------------------------------------
   Constellations — 16 words, 4 hidden groups (with deliberate red herrings).
   level: 0 easiest … 3 trickiest
   ------------------------------------------------------------------ */

export type ConGroup = { name: string; words: string[]; level: number };

export const CONSTELLATION_PUZZLES: ConGroup[][] = [
  [
    { name: "Chocolate bars", words: ["TWIX", "SNICKERS", "BOUNTY", "AERO"], level: 0 },
    { name: "Planets", words: ["VENUS", "MERCURY", "NEPTUNE", "MARS"], level: 1 },
    { name: "Watch brands", words: ["ROLEX", "SWATCH", "CASIO", "TIMEX"], level: 2 },
    { name: "Greek letters", words: ["ALPHA", "DELTA", "SIGMA", "OMEGA"], level: 3 },
  ],
  [
    { name: "Coffee drinks", words: ["LATTE", "ESPRESSO", "AMERICANO", "MOCHA"], level: 0 },
    { name: "Trees", words: ["OAK", "ASH", "ELM", "PINE"], level: 1 },
    { name: "Shades of brown", words: ["TAN", "KHAKI", "UMBER", "CHESTNUT"], level: 2 },
    { name: "Poker terms", words: ["FLUSH", "RIVER", "BLIND", "CHECK"], level: 3 },
  ],
  [
    { name: "Pasta shapes", words: ["PENNE", "FUSILLI", "ORZO", "RIGATONI"], level: 0 },
    { name: "Dog breeds", words: ["BOXER", "PUG", "BEAGLE", "POODLE"], level: 1 },
    { name: "Boxing moves", words: ["JAB", "UPPERCUT", "CROSS", "CLINCH"], level: 2 },
    { name: "Fictional captains", words: ["HOOK", "AHAB", "NEMO", "KIRK"], level: 3 },
  ],
  [
    { name: "Fish", words: ["SALMON", "TUNA", "COD", "BASS"], level: 0 },
    { name: "Orchestra instruments", words: ["CELLO", "TUBA", "OBOE", "HARP"], level: 1 },
    { name: "Shades of pink", words: ["CORAL", "ROSE", "BLUSH", "FUCHSIA"], level: 2 },
    { name: "Wedding words", words: ["VOWS", "VEIL", "RINGS", "TOAST"], level: 3 },
  ],
  [
    { name: "Weather", words: ["HAIL", "SLEET", "FOG", "SNOW"], level: 0 },
    { name: "Chess pieces", words: ["KING", "BISHOP", "KNIGHT", "ROOK"], level: 1 },
    { name: "Apps", words: ["SNAPCHAT", "TIKTOK", "REDDIT", "DISCORD"], level: 2 },
    { name: "___BOARD", words: ["SKATE", "KEY", "CHALK", "DASH"], level: 3 },
  ],
  [
    { name: "Fruits", words: ["KIWI", "MANGO", "PLUM", "PEACH"], level: 0 },
    { name: "Keyboard keys", words: ["SHIFT", "TAB", "ESCAPE", "ENTER"], level: 1 },
    { name: "Shades of green", words: ["OLIVE", "JADE", "SAGE", "MINT"], level: 2 },
    { name: "___LIGHT", words: ["LIME", "MOON", "SPOT", "FLASH"], level: 3 },
  ],
  [
    { name: "Sea creatures", words: ["SHARK", "WHALE", "SQUID", "SEAL"], level: 0 },
    { name: "Mythical creatures", words: ["DRAGON", "UNICORN", "PHOENIX", "KRAKEN"], level: 1 },
    { name: "NBA team names", words: ["HEAT", "SUNS", "BULLS", "NETS"], level: 2 },
    { name: "___FISH", words: ["SWORD", "CAT", "STAR", "JELLY"], level: 3 },
  ],
  [
    { name: "Birds", words: ["ROBIN", "WREN", "FINCH", "CROW"], level: 0 },
    { name: "Snakes", words: ["COBRA", "VIPER", "MAMBA", "ADDER"], level: 1 },
    { name: "Gemstones", words: ["OPAL", "PEARL", "TOPAZ", "ONYX"], level: 2 },
    { name: "Programming languages", words: ["PYTHON", "RUST", "RUBY", "SWIFT"], level: 3 },
  ],
  [
    { name: "Card games", words: ["UNO", "POKER", "RUMMY", "SNAP"], level: 0 },
    { name: "Camera words", words: ["FLASH", "LENS", "SHUTTER", "ZOOM"], level: 1 },
    { name: "Royal things", words: ["THRONE", "SCEPTER", "PALACE", "ORB"], level: 2 },
    { name: "Dental work", words: ["FILLING", "BRACES", "BRIDGE", "CROWN"], level: 3 },
  ],
  [
    { name: "Breakfast foods", words: ["WAFFLE", "PANCAKE", "BAGEL", "OMELET"], level: 0 },
    { name: "Winter wear", words: ["SCARF", "MITTEN", "BEANIE", "PARKA"], level: 1 },
    { name: "Footwear", words: ["SNEAKER", "LOAFER", "SANDAL", "BOOT"], level: 2 },
    { name: "Car parts", words: ["TRUNK", "HOOD", "BUMPER", "MUFFLER"], level: 3 },
  ],
  [
    { name: "Spices", words: ["CUMIN", "PAPRIKA", "NUTMEG", "CLOVE"], level: 0 },
    { name: "___BALL", words: ["SNOW", "BASKET", "FOOT", "MEAT"], level: 1 },
    { name: "Soccer positions", words: ["STRIKER", "KEEPER", "WINGER", "DEFENDER"], level: 2 },
    { name: "Shades of orange", words: ["SAFFRON", "TANGERINE", "APRICOT", "AMBER"], level: 3 },
  ],
  [
    { name: "Dances", words: ["SALSA", "TANGO", "WALTZ", "POLKA"], level: 0 },
    { name: "Units of time", words: ["SECOND", "MINUTE", "HOUR", "DECADE"], level: 1 },
    { name: "Dips", words: ["GUACAMOLE", "HUMMUS", "QUESO", "TZATZIKI"], level: 2 },
    { name: "Tiny", words: ["WEE", "PETITE", "MINI", "TEENY"], level: 3 },
  ],
  [
    { name: "Board games", words: ["RISK", "SORRY", "CATAN", "CLUE"], level: 0 },
    { name: "Things with shells", words: ["TURTLE", "SNAIL", "TACO", "EGG"], level: 1 },
    { name: "Detective words", words: ["SUSPECT", "ALIBI", "MOTIVE", "WITNESS"], level: 2 },
    { name: "Investing words", words: ["STOCK", "BOND", "SHARE", "FUND"], level: 3 },
  ],
  [
    { name: "Zodiac signs", words: ["ARIES", "LEO", "VIRGO", "PISCES"], level: 0 },
    { name: "Moons", words: ["TITAN", "EUROPA", "IO", "PHOBOS"], level: 1 },
    { name: "Space telescopes", words: ["HUBBLE", "WEBB", "KEPLER", "CHANDRA"], level: 2 },
    { name: "Space missions", words: ["APOLLO", "GEMINI", "ARTEMIS", "VOYAGER"], level: 3 },
  ],
  [
    { name: "Kitchen tools", words: ["POT", "WHISK", "LADLE", "KETTLE"], level: 0 },
    { name: "Birds of prey", words: ["HAWK", "FALCON", "OWL", "OSPREY"], level: 1 },
    { name: "Golf scores", words: ["PAR", "BIRDIE", "EAGLE", "BOGEY"], level: 2 },
    { name: "___CAKE", words: ["CUP", "PAN", "CHEESE", "SHORT"], level: 3 },
  ],
  [
    { name: "Car brands", words: ["FORD", "HONDA", "KIA", "AUDI"], level: 0 },
    { name: "Islands", words: ["BALI", "CUBA", "MALTA", "FIJI"], level: 1 },
    { name: "Scientists", words: ["NEWTON", "CURIE", "DARWIN", "TESLA"], level: 2 },
    { name: "Units named after people", words: ["WATT", "OHM", "HERTZ", "JOULE"], level: 3 },
  ],
  [
    { name: "Breads", words: ["BAGUETTE", "BRIOCHE", "NAAN", "PITA"], level: 0 },
    { name: "In your wallet", words: ["CASH", "CARDS", "ID", "RECEIPT"], level: 1 },
    { name: "Hairstyles", words: ["BUN", "BRAID", "MULLET", "PIXIE"], level: 2 },
    { name: "Palindrome names", words: ["ANNA", "OTTO", "HANNAH", "BOB"], level: 3 },
  ],
  [
    { name: "Game consoles", words: ["XBOX", "PLAYSTATION", "GAMECUBE", "WII"], level: 0 },
    { name: "Gym exercises", words: ["SQUAT", "PLANK", "LUNGE", "CRUNCH"], level: 1 },
    { name: "Electrical things", words: ["FUSE", "PLUG", "SOCKET", "WIRE"], level: 2 },
    { name: "Things you flip", words: ["SWITCH", "COIN", "PANCAKE", "BURGER"], level: 3 },
  ],
  [
    { name: "Card suits", words: ["HEARTS", "CLUBS", "SPADES", "DIAMONDS"], level: 0 },
    { name: "Nuts", words: ["CASHEW", "PECAN", "PISTACHIO", "WALNUT"], level: 1 },
    { name: "Frozen desserts", words: ["VANILLA", "NEAPOLITAN", "SPUMONI", "SORBET"], level: 2 },
    { name: "Shades of white", words: ["IVORY", "PEARL", "CREAM", "ALMOND"], level: 3 },
  ],
  [
    { name: "Countries", words: ["CHAD", "PERU", "OMAN", "MALI"], level: 0 },
    { name: "Thanksgiving table", words: ["TURKEY", "STUFFING", "GRAVY", "PIE"], level: 1 },
    { name: "Ways to eat", words: ["MUNCH", "NIBBLE", "GOBBLE", "CHEW"], level: 2 },
    { name: "Units of data", words: ["BIT", "BYTE", "KILOBYTE", "PETABYTE"], level: 3 },
  ],
];

/* ------------------------------------------------------------------
   Deep Sky — name something in the category; rarer answers score more.
   Each list is the complete set of accepted answers, by tier:
   [10 pts common, 30 pts, 60 pts, 100 pts deep cut]
   ------------------------------------------------------------------ */

export type SkyPrompt = { q: string; tiers: [string[], string[], string[], string[]] };

export const DEEP_SKY: SkyPrompt[] = [
  {
    q: "Name a US state",
    tiers: [
      ["California", "Texas", "Florida", "New York", "Hawaii", "Alaska", "Washington"],
      ["Arizona", "Nevada", "Colorado", "Georgia", "Ohio", "Michigan", "Illinois", "Oregon", "Utah", "Virginia", "Massachusetts", "New Jersey", "Pennsylvania", "North Carolina", "Tennessee", "Louisiana", "Minnesota", "Wisconsin"],
      ["Alabama", "Mississippi", "Kentucky", "Indiana", "Missouri", "Iowa", "Kansas", "Oklahoma", "Arkansas", "South Carolina", "Maryland", "Connecticut", "Maine", "New Mexico", "Idaho", "Montana", "West Virginia", "New Hampshire"],
      ["Delaware", "Rhode Island", "Vermont", "Wyoming", "North Dakota", "South Dakota", "Nebraska"],
    ],
  },
  {
    q: "Name a country in Africa",
    tiers: [
      ["Egypt", "South Africa", "Nigeria", "Kenya", "Morocco", "Ethiopia"],
      ["Ghana", "Madagascar", "Algeria", "Tunisia", "Libya", "Sudan", "Somalia", "Zimbabwe", "Uganda", "Tanzania", "Rwanda", "Senegal", "Cameroon", "Angola", "Namibia", "Botswana", "Mali", "DR Congo|Democratic Republic of the Congo|DRC|Congo|Congo Kinshasa", "Ivory Coast|Cote d'Ivoire", "Mozambique", "Zambia"],
      ["Niger", "Chad", "Liberia", "Sierra Leone", "Guinea", "Gambia", "Malawi", "Burundi", "Benin", "Togo", "Gabon", "Eritrea", "Mauritania", "Mauritius", "Burkina Faso", "South Sudan", "Central African Republic|CAR", "Lesotho", "Seychelles", "Djibouti", "Republic of the Congo|Congo Brazzaville"],
      ["Eswatini|Swaziland", "Comoros", "Cabo Verde|Cape Verde", "Sao Tome and Principe|Sao Tome", "Equatorial Guinea", "Guinea-Bissau"],
    ],
  },
  {
    q: "Name a country in South America",
    tiers: [["Brazil", "Argentina"], ["Chile", "Peru", "Colombia"], ["Venezuela", "Ecuador", "Bolivia", "Uruguay"], ["Paraguay", "Guyana", "Suriname"]],
  },
  {
    q: "Name a European Union member country",
    tiers: [
      ["France", "Germany", "Italy", "Spain"],
      ["Netherlands|Holland", "Belgium", "Portugal", "Greece", "Sweden", "Poland", "Austria", "Ireland", "Denmark", "Finland"],
      ["Czechia|Czech Republic", "Hungary", "Romania", "Croatia", "Bulgaria", "Slovakia", "Luxembourg"],
      ["Slovenia", "Estonia", "Latvia", "Lithuania", "Malta", "Cyprus"],
    ],
  },
  {
    q: "Name a chemical element",
    tiers: [
      ["Hydrogen", "Oxygen", "Carbon", "Helium", "Gold", "Iron", "Nitrogen", "Silver"],
      ["Lithium", "Sodium", "Calcium", "Copper", "Zinc", "Aluminum|Aluminium", "Neon", "Uranium", "Lead", "Mercury", "Platinum", "Sulfur|Sulphur", "Chlorine", "Potassium", "Magnesium", "Silicon", "Nickel", "Tin", "Titanium", "Plutonium", "Iodine", "Fluorine", "Phosphorus", "Argon", "Cobalt", "Chromium", "Tungsten", "Radon"],
      ["Boron", "Beryllium", "Manganese", "Krypton", "Xenon", "Radium", "Arsenic", "Bromine", "Barium", "Cadmium", "Bismuth", "Antimony", "Selenium", "Strontium", "Cesium|Caesium", "Francium", "Palladium", "Osmium", "Iridium", "Gallium", "Germanium", "Vanadium", "Zirconium", "Molybdenum", "Polonium", "Americium", "Einsteinium", "Thorium", "Neptunium", "Tellurium", "Scandium", "Rubidium", "Indium", "Astatine", "Tantalum", "Rhodium", "Ruthenium", "Niobium", "Californium", "Curium", "Neodymium"],
      ["Yttrium", "Technetium", "Lanthanum", "Cerium", "Praseodymium", "Promethium", "Samarium", "Europium", "Gadolinium", "Terbium", "Dysprosium", "Holmium", "Erbium", "Thulium", "Ytterbium", "Lutetium", "Hafnium", "Rhenium", "Thallium", "Actinium", "Protactinium", "Berkelium", "Fermium", "Mendelevium", "Nobelium", "Lawrencium", "Rutherfordium", "Dubnium", "Seaborgium", "Bohrium", "Hassium", "Meitnerium", "Darmstadtium", "Roentgenium", "Copernicium", "Nihonium", "Flerovium", "Moscovium", "Livermorium", "Tennessine", "Oganesson"],
    ],
  },
  {
    q: "Name one of the 88 constellations",
    tiers: [
      ["Orion", "Ursa Major|Great Bear", "Ursa Minor|Little Bear", "Cassiopeia", "Leo", "Scorpius|Scorpio", "Gemini", "Taurus"],
      ["Aries", "Cancer", "Virgo", "Libra", "Sagittarius", "Capricornus|Capricorn", "Aquarius", "Pisces", "Draco", "Pegasus", "Andromeda", "Cygnus", "Lyra", "Perseus", "Hercules", "Canis Major", "Phoenix", "Hydra", "Crux|Southern Cross", "Centaurus"],
      ["Aquila", "Auriga", "Bootes", "Cepheus", "Cetus", "Corona Borealis", "Corvus", "Delphinus", "Eridanus", "Lepus", "Lupus", "Lynx", "Monoceros", "Ophiuchus", "Serpens", "Triangulum", "Vela", "Carina", "Puppis", "Columba", "Canis Minor", "Leo Minor", "Corona Australis", "Sagitta", "Vulpecula", "Crater", "Chamaeleon", "Pavo", "Grus", "Tucana"],
      ["Antlia", "Apus", "Ara", "Caelum", "Camelopardalis", "Canes Venatici", "Circinus", "Coma Berenices", "Dorado", "Equuleus", "Fornax", "Horologium", "Hydrus", "Indus", "Lacerta", "Mensa", "Microscopium", "Musca", "Norma", "Octans", "Pictor", "Piscis Austrinus", "Pyxis", "Reticulum", "Sculptor", "Scutum", "Sextans", "Telescopium", "Triangulum Australe", "Volans"],
    ],
  },
  {
    q: "Name a letter of the Greek alphabet",
    tiers: [
      ["Alpha", "Beta", "Gamma", "Delta", "Omega"],
      ["Pi", "Sigma", "Theta", "Lambda", "Epsilon", "Mu", "Tau", "Phi", "Psi"],
      ["Zeta", "Eta", "Kappa", "Rho", "Chi", "Iota", "Nu", "Xi"],
      ["Omicron", "Upsilon"],
    ],
  },
  {
    q: "Name a word in the NATO phonetic alphabet",
    tiers: [
      ["Alpha|Alfa", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Zulu", "Tango"],
      ["Golf", "Hotel", "India", "Kilo", "Lima", "Oscar", "Romeo", "Sierra", "Victor", "Whiskey|Whisky", "X-ray", "Yankee"],
      ["Mike", "November", "Papa", "Juliett|Juliet"],
      ["Quebec", "Uniform"],
    ],
  },
  {
    q: "Name a US president (last name)",
    tiers: [
      ["Washington", "Lincoln", "Obama", "Trump", "Biden", "Kennedy", "Roosevelt"],
      ["Jefferson", "Adams", "Reagan", "Clinton", "Bush", "Nixon", "Carter", "Jackson", "Grant", "Madison", "Truman", "Eisenhower", "Ford", "Johnson"],
      ["Monroe", "Wilson", "Hoover", "Taft", "McKinley", "Coolidge", "Harding", "Polk", "Cleveland", "Garfield", "Hayes", "Van Buren", "Harrison", "Tyler", "Buchanan"],
      ["Fillmore", "Pierce", "Arthur", "Taylor"],
    ],
  },
  {
    q: "Name a Chinese zodiac animal",
    tiers: [["Dragon", "Tiger", "Rabbit", "Snake"], ["Horse", "Monkey", "Dog", "Rat", "Pig"], ["Ox", "Rooster|Chicken"], ["Goat|Sheep|Ram"]],
  },
  {
    q: "Name a Canadian province or territory",
    tiers: [
      ["Ontario", "Quebec", "British Columbia"],
      ["Alberta", "Nova Scotia", "Manitoba"],
      ["Saskatchewan", "New Brunswick", "Newfoundland and Labrador|Newfoundland", "Yukon"],
      ["Prince Edward Island|PEI", "Northwest Territories", "Nunavut"],
    ],
  },
  {
    q: "Name a planet or dwarf planet",
    tiers: [["Earth", "Mars", "Jupiter", "Saturn"], ["Venus", "Mercury", "Neptune", "Uranus", "Pluto"], ["Ceres", "Eris"], ["Haumea", "Makemake"]],
  },
  {
    q: "Name a country that borders China",
    tiers: [
      ["India", "Russia"],
      ["Mongolia", "Vietnam", "North Korea", "Pakistan", "Nepal"],
      ["Afghanistan", "Kazakhstan", "Laos", "Myanmar|Burma", "Bhutan"],
      ["Kyrgyzstan", "Tajikistan"],
    ],
  },
  {
    q: "Name an Ivy League school",
    tiers: [["Harvard", "Yale"], ["Princeton", "Columbia"], ["Cornell", "Brown"], ["Dartmouth", "Penn|UPenn|University of Pennsylvania"]],
  },
  {
    q: "Name a programming language",
    tiers: [
      ["Python", "JavaScript|JS", "Java", "C", "C++|CPP"],
      ["C#|C Sharp", "TypeScript|TS", "Ruby", "Go|Golang", "Rust", "Swift", "Kotlin", "PHP", "SQL", "R", "MATLAB", "Scala", "Perl", "Dart"],
      ["Haskell", "Lua", "Objective-C|ObjC", "Elixir", "Erlang", "Clojure", "F#|F Sharp", "Julia", "Assembly|ASM", "Bash", "Fortran", "COBOL", "Lisp", "Groovy", "Visual Basic|VB", "Pascal", "Prolog", "Scheme", "OCaml", "Zig", "Solidity", "PowerShell", "BASIC"],
      ["Ada", "Smalltalk", "Nim", "Crystal", "Elm", "Racket", "APL", "Forth", "Haxe", "Gleam", "Odin", "Simula", "ALGOL", "Mojo", "Vala", "PureScript", "Idris", "Delphi", "Raku", "Hack", "D"],
    ],
  },
];

/* ------------------------------------------------------------------
   Emoji Cinema — guess the movie from emoji.
   ------------------------------------------------------------------ */

export type EmojiMovie = { emoji: string; title: string; year: number };

export const EMOJI_MOVIES: EmojiMovie[] = [
  { emoji: "🚢🧊💔", title: "Titanic", year: 1997 },
  { emoji: "🦁👑", title: "The Lion King", year: 1994 },
  { emoji: "🔍🐠", title: "Finding Nemo", year: 2003 },
  { emoji: "🦖🏞️🎢", title: "Jurassic Park", year: 1993 },
  { emoji: "❄️👸⛄", title: "Frozen", year: 2013 },
  { emoji: "🧸📖", title: "Toy Story", year: 1995 },
  { emoji: "⭐⚔️🌌", title: "Star Wars|A New Hope", year: 1977 },
  { emoji: "🧙‍♂️⚡👓🪄", title: "Harry Potter and the Sorcerer's Stone|Harry Potter|Harry Potter and the Philosopher's Stone", year: 2001 },
  { emoji: "🕷️👨", title: "Spider-Man|Spiderman", year: 2002 },
  { emoji: "👻🚫", title: "Ghostbusters", year: 1984 },
  { emoji: "🦈🏖️😱", title: "Jaws", year: 1975 },
  { emoji: "🔙⏰🚗", title: "Back to the Future", year: 1985 },
  { emoji: "🌪️👠🦁🤖", title: "The Wizard of Oz|Wizard of Oz", year: 1939 },
  { emoji: "🎈🏠👴", title: "Up", year: 2009 },
  { emoji: "🏎️🏁⚡", title: "Cars", year: 2006 },
  { emoji: "🟢👹🏰🫏", title: "Shrek", year: 2001 },
  { emoji: "😊😢😡🧠", title: "Inside Out", year: 2015 },
  { emoji: "🐀👨‍🍳", title: "Ratatouille", year: 2007 },
  { emoji: "🔵👽🌳", title: "Avatar", year: 2009 },
  { emoji: "🎲🦏🌴", title: "Jumanji", year: 1995 },
  { emoji: "🏴‍☠️🌊⚓", title: "Pirates of the Caribbean", year: 2003 },
  { emoji: "💊🕶️💻", title: "The Matrix|Matrix", year: 1999 },
  { emoji: "🏠👦🎄", title: "Home Alone", year: 1990 },
  { emoji: "⚫🐆👑", title: "Black Panther", year: 2018 },
  { emoji: "🔩👨", title: "Iron Man", year: 2008 },
  { emoji: "🔝✈️😎", title: "Top Gun", year: 1986 },
  { emoji: "🌹👸👹", title: "Beauty and the Beast", year: 1991 },
  { emoji: "💀🎸🌼", title: "Coco", year: 2017 },
  { emoji: "🌊⛵🐔", title: "Moana", year: 2016 },
  { emoji: "🏠🦋✨🕯️", title: "Encanto", year: 2021 },
  { emoji: "🐰🦊🚓", title: "Zootopia", year: 2016 },
  { emoji: "👾🏢🚪", title: "Monsters, Inc.|Monsters Inc", year: 2001 },
  { emoji: "🦸‍♂️👨‍👩‍👧‍👦💥", title: "The Incredibles|Incredibles", year: 2004 },
  { emoji: "💅👱‍♀️🎀", title: "Barbie", year: 2023 },
  { emoji: "🚀🌌🌽⏳", title: "Interstellar", year: 2014 },
  { emoji: "🧑‍🚀🔴🥔", title: "The Martian|Martian", year: 2015 },
  { emoji: "🐼🥋", title: "Kung Fu Panda", year: 2008 },
  { emoji: "🦹‍♂️🍌👓", title: "Despicable Me", year: 2010 },
  { emoji: "🏎️💨😠", title: "The Fast and the Furious|Fast and Furious|Fast & Furious", year: 2001 },
  { emoji: "🤖🌱🗑️", title: "WALL-E|Wall E|Walle", year: 2008 },
  { emoji: "🧜‍♀️🐠🦀", title: "The Little Mermaid|Little Mermaid", year: 1989 },
  { emoji: "🌙🏛️🦖", title: "Night at the Museum", year: 2006 },
  { emoji: "🧊🦣🐿️", title: "Ice Age", year: 2002 },
  { emoji: "🦁🦓🦒🌴", title: "Madagascar", year: 2005 },
  { emoji: "🍫🏭🎫", title: "Charlie and the Chocolate Factory|Willy Wonka and the Chocolate Factory|Willy Wonka", year: 2005 },
  { emoji: "🧑‍🚀🛰️🌍", title: "Gravity", year: 2013 },
  { emoji: "👸🏰👠🕛", title: "Cinderella", year: 1950 },
];

/* ------------------------------------------------------------------
   Timeline — put events in order.
   ------------------------------------------------------------------ */

export type TimelineEvent = { text: string; year: number };

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { text: "Magna Carta is sealed", year: 1215 },
  { text: "Constantinople falls to the Ottomans", year: 1453 },
  { text: "Columbus reaches the Americas", year: 1492 },
  { text: "Martin Luther posts his 95 Theses", year: 1517 },
  { text: "Shakespeare's First Folio is published", year: 1623 },
  { text: "Great Fire of London", year: 1666 },
  { text: "US Declaration of Independence", year: 1776 },
  { text: "Storming of the Bastille", year: 1789 },
  { text: "Napoleon is defeated at Waterloo", year: 1815 },
  { text: "Darwin publishes On the Origin of Species", year: 1859 },
  { text: "The US Civil War ends", year: 1865 },
  { text: "Statue of Liberty is dedicated", year: 1886 },
  { text: "Eiffel Tower is completed", year: 1889 },
  { text: "First modern Olympic Games, in Athens", year: 1896 },
  { text: "Wright brothers' first powered flight", year: 1903 },
  { text: "Einstein publishes special relativity", year: 1905 },
  { text: "Titanic sinks", year: 1912 },
  { text: "World War I begins", year: 1914 },
  { text: "US women win the right to vote (19th Amendment)", year: 1920 },
  { text: "Penicillin is discovered", year: 1928 },
  { text: "Gandhi leads the Salt March", year: 1930 },
  { text: "Empire State Building opens", year: 1931 },
  { text: "Golden Gate Bridge opens", year: 1937 },
  { text: "World War II ends", year: 1945 },
  { text: "First ascent of Mount Everest", year: 1953 },
  { text: "Disneyland opens", year: 1955 },
  { text: "Sputnik, the first satellite, is launched", year: 1957 },
  { text: "The Berlin Wall is built", year: 1961 },
  { text: "Cuban Missile Crisis", year: 1962 },
  { text: "MLK's \"I Have a Dream\" speech", year: 1963 },
  { text: "The Beatles appear on The Ed Sullivan Show", year: 1964 },
  { text: "First human heart transplant", year: 1967 },
  { text: "Apollo 11 lands on the Moon", year: 1969 },
  { text: "The first email is sent", year: 1971 },
  { text: "Microsoft is founded", year: 1975 },
  { text: "Apple is founded", year: 1976 },
  { text: "The first Star Wars film is released", year: 1977 },
  { text: "The NES launches in North America", year: 1985 },
  { text: "Chernobyl disaster", year: 1986 },
  { text: "The Berlin Wall falls", year: 1989 },
  { text: "Hubble Space Telescope is launched", year: 1990 },
  { text: "Amazon is founded", year: 1994 },
  { text: "Toy Story, the first fully CGI feature film, is released", year: 1995 },
  { text: "Pokémon Red and Green release in Japan", year: 1996 },
  { text: "The first Harry Potter book is published", year: 1997 },
  { text: "Google is founded", year: 1998 },
  { text: "Wikipedia launches", year: 2001 },
  { text: "Euro coins and notes enter circulation", year: 2002 },
  { text: "Human Genome Project is completed", year: 2003 },
  { text: "Facebook is founded", year: 2004 },
  { text: "YouTube launches", year: 2005 },
  { text: "Roblox is released to the public", year: 2006 },
  { text: "The first iPhone is released", year: 2007 },
  { text: "Spotify launches", year: 2008 },
  { text: "Instagram launches", year: 2010 },
  { text: "Minecraft 1.0 is released", year: 2011 },
  { text: "Fortnite Battle Royale is released", year: 2017 },
  { text: "COVID-19 is declared a pandemic", year: 2020 },
  { text: "James Webb Space Telescope launches", year: 2021 },
  { text: "ChatGPT is released", year: 2022 },
];

/* ------------------------------------------------------------------
   Alphabet Sprint — one letter, six categories, 90 seconds.
   ------------------------------------------------------------------ */

export const SPRINT_CATEGORIES = [
  "A fruit",
  "An animal",
  "A country",
  "A city",
  "A food",
  "Something in a kitchen",
  "A movie",
  "A singer or band",
  "A brand",
  "A sport",
  "A first name",
  "Something cold",
  "A school subject",
  "A job",
  "Something at the beach",
  "A color",
  "A TV show",
  "A video game",
  "A body part",
  "A vegetable",
  "A dessert",
  "A drink",
  "Something in space",
  "A college",
  "Something with wheels",
  "A famous person",
  "A hobby",
  "Something you're afraid of",
  "A cartoon character",
  "Clothing",
  "A superhero",
  "Something in a classroom",
  "A tool",
  "A flower",
  "A US state",
  "Something sticky",
  "A bird",
  "An app or website",
  "Something that's round",
  "A musical instrument",
  "Something you'd pack for a trip",
  "A word that means happy",
];

export const SPRINT_LETTERS = "ABCDEFGHIJKLMNOPRSTW".split("");
