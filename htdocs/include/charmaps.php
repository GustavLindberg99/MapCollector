<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

class Map{
    public $color;
    public $endStations;

    public function __construct(string $color, string $endStations){
        $this->color = $color;
        $this->endStations = $endStations;
    }
}

define('DEFAULT_CHAR_MAP', '&#x1F686;&#xFE0E;');

$charMaps = [
    '0' => [
        new Map('#808183', "Times Sq/42 St - \nGrand Central/42 St")
    ],
    '1' => [
        new Map('#ee352e', "Van Cortlandt \nPark/242 St - \nSouth Ferry"),
        new Map('#EF4822', "Kivenlahti - Vuosaari"),
        new Map('#007756', "Vanløse - Vestamager"),
        new Map('#FED304', "Vörösmarty tér - \nMexikói út")
    ],
    '2' => [
        new Map('#ee352e', "Wakefield/241 St - \nFlatbush Av \nBrooklyn College"),
        new Map('#8e9091', "Østerport - Göteborg"),
        new Map('#EF4822', "Tapiola - Mellunmäki"),
        new Map('#FDC300', "Vanløse - CPH Lufthavn"),
        new Map('#EE2D28', "Déli pályaudvar - \nÖrs vezér tere")
    ],
    '3' => [
        new Map('#ee352e', "Harlem/148 St - \nNew Lots Av"),
        new Map('#5060ac', "Ystad - Helsingborg C \n(via Teckomatorp)"),
        new Map('#E30613', "Nørrebro (Circular)"),
        new Map('#0067AF', "Újpest-központ - \nKőbánya-Kispest")
    ],
    '4' => [
        new Map('#00933c', "Woodlawn - \nCrown Hts Utica Av"),
        new Map('#5060ac', "Hyllie - Kristianstad"),
        new Map('#0095BC', "København Syd - \nOrientkaj"),
        new Map('#43A842', "Keleti pályaudvar - \nKelenföld vasútállomás")
    ],
    '5' => [
        new Map('#00933c', "Eastchester Dyre Av - \nFlatbush Av \nBrooklyn College"),
        new Map('#5060ac', "Kristianstad - \nHelsingborg C"),
        new Map('#820C71', "Szentendre - \nBatthyány tér")
    ],
    '6' => [
        new Map('#00933c', "Pelham Bay Park - \nBrooklyn Bridge/City Hall"),
        new Map('#7C4400', "Közvágóhíd - Ráckeve")
    ],
    '7' => [
        new Map('#b933ad', "34 St/Hudson Yards - \nFlushing Main St"),
        new Map('#5060ac', "Hässleholm - Markaryd"),
        new Map('#F47921', "Boráros tér - Csepel")
    ],
    '8' => [
        new Map('#5060ac', "Hyllie - Åstorp"),
        new Map('#ED6E86', "Örs vezér tere - Gödöllő")
    ],
    '9' => [
        new Map('#5060ac', "Trelleborg - \nHelsingborg C \n(via Landskrona)"),
        new Map('#ED6E86', "Örs vezér tere - Csömör")
    ],
    'A' => [
        new Map('#2850ad', "Inwood/207 St - \nOzone Park Lefferts Blvd / \nFar Rockaway Mott Av"),
        new Map('#ed1c2b', "Marne-la-Vallée Chessy - \nSaint-Germain-en-Laye"),
        new Map('#ed1c2b', "Boissy Saint-Léger - \nCergy Le Haut"),
        new Map('#ed1c2b', "Torcy - Poissy"),
        new Map('#52C1E9', "Union Station - \nDenver Airport"),
        new Map('#963181', "Helsinki - Leppävaara"),
        new Map('#F26D1B', "Battistini - Anagnina"),
        new Map('#0072BD', "APU/Citrus College - \n1st St"),
        new Map('#00A8E7', "Hillerød - Hundige")
    ],
    'B' => [
        new Map('#ff6319', "145 St - Brighton Beach"),
        new Map('#4890cd', "Mitry Claye - Robinson"),
        new Map('#4890cd', "Aéroport Charles \nde Gaulle 2 - \nSaint-Rémy-\nlès-Chevreuse"),
        new Map('#4890cd', "Aéroport Charles \nde Gaulle 2 - \nMassy Palaiseau"),
        new Map('#4B9C2E', "Union Station - \nWestminster"),
        new Map('#0071BA', "Laurentina - \nRebibbia / Jonio"),
        new Map('#ee1d23', "North Hollywood - \nUnion Station"),
        new Map('#52AE32', "Farum - Høje Taastrup")
    ],
    'C' => [
        new Map('#2850ad', "168 St - Euclid Av"),
        new Map('#eec604', "Massy Palaiseau - \nPontoise"),
        new Map('#eec604', "Saint-Martin d'Étampes - \nSaint-Quentin-en-Yvelines"),
        new Map('#eec604', "Dourdan-la-Forêt - \nInvalides"),
        new Map('#eec604', "Juvisy - \nVersailles Château \nRive Gauche"),
        new Map('#008751', "San Giovanni - \nMonte Comptatri/Pantano"),
        new Map('#6bc067', "Norwalk - \nRedondo Beach"),
        new Map('#F39200', "Klampenborg - \nFrederikssund")
    ],
    'D' => [
        new Map('#ff6319', "Norwood/205 St - \nConey Island Stillwell Av"),
        new Map('#00ab67', "Creil - \nCorbeil Essonnes \n(via Évry \nCourcouronnes Centre)"),
        new Map('#00ab67', "Goussainville - \nMelun \n(via Combs-la-Ville \nQuincy)"),
        new Map('#00ab67', "Corbeil Essonnes - \nMelun"),
        new Map('#00ab67', "Juvisy - Malesherbes \n(via Ris-Orangis)"),
        new Map('#007935', "18th/California - \nLittleton-Mineral"),
        new Map('#1BA63F', "Helsinki - Hämeenlinna"),
        new Map('#a05ea6', "Wilshire/Western - \nUnion Station")
    ],
    'E' => [
        new Map('#2850ad', "Jamaica Center \nParsons/Archer - \nWorld Trade Center"),
        new Map('#d17fb6', "Haussmann \nSaint-Lazare - \nChelles Gournay"),
        new Map('#d17fb6', "Haussmann \nSaint-Lazare - \nVilliers-sur-Marne \nLe Plessis-Trévise"),
        new Map('#d17fb6', "Haussmann \nSaint-Lazare - \nTournan"),
        new Map('#d17fb6', "Nanterre La Folie - \nMagenta"),
        new Map('#691F75', "Union Station - \nRidgeGate Parkway"),
        new Map('#963181', "Helsinki - Kauklahti"),
        new Map('#FDB914', "Atlantic - \nDowntown Santa Monica"),
        new Map('#8779B7', "Holte - Køge")
    ],
    'F' => [
        new Map('#ff6319', "Jamaica/179 St - \nConey Island Stillwell Av"),
        new Map('#FDC300', "Hellerup - \nKøbenhavn Syd")
    ],
    'G' => [
        new Map('#6cbe45', "Court Sq - Church Av"),
        new Map('#F5B321', "Union Station - \nWheat Ridge-Ward"),
        new Map('#1BA63F', "Riihimäki - Lahti")
    ],
    'H' => [
        new Map('#808183', "Broad Channel - \nRockaway Park \nBeach 116 St"),
        new Map('#a1656a', "Paris Nord - Luzarches"),
        new Map('#a1656a', "Paris Nord - \nPersan Beaumont \n(via Montsoult-Maffliers)"),
        new Map('#a1656a', "Paris Nord - Pontoise"),
        new Map('#a1656a', "Paris Nord - \nPersan Beaumont \n(via Valmondois)"),
        new Map('#a1656a', "Creil - Pontoise"),
        new Map('#0055B7', "18th/California - Florida"),
        new Map('#E74011', "Østerport - Ballerup")
    ],
    'I' => [
        new Map('#963181', "Helsinki (Circular)")
    ],
    'J' => [
        new Map('#996633', "Broad St - \nJamaica Center \nParsons/Archer"),
        new Map('#bacf2b', "Paris Saint-Lazare - \nMantes-la-Jolie \n(via Conflans \nSainte-Honorine)"),
        new Map('#bacf2b', "Paris Saint-Lazare - \nVernon (via Poissy)"),
        new Map('#bacf2b', "Paris Saint-Lazare - \nErmont-Eaubonne"),
        new Map('#bacf2b', "Paris Saint-Lazare - \nGisors")
    ],
    'K' => [
        new Map('#a99300', "Paris Nord - \nCrépy-en-Valois"),
        new Map('#963181', "Helsinki - Kerava"),
        new Map('#E770AB', "Expo/Crenshaw - \nWestchester/Veterans")
    ],
    'L' => [
        new Map('#a7a9ac', "8 Av/14 St - \nCanarsie Rockaway Pkwy"),
        new Map('#716fb3', "Paris Saint-Lazare - \nCergy Le Haut"),
        new Map('#716fb3', "Paris Saint-Lazare - \nSaint-Nom-la-Bretèche \nForêt de Marly"),
        new Map('#716fb3', "Paris Saint-Lazare - \nVersailles Rive Droite"),
        new Map('#FECE00', "30th/Downing - \n16th/Stout"),
        new Map('#963181', "Helsinki - Kirkkonummi")
    ],
    'M' => [
        new Map('#ff6319', "Forest Hills/71 Av - \nMiddle Village \nMetropolitan Av"),
        new Map('#1BA63F', "Toijala - Nokia")
    ],
    'N' => [
        new Map('#fccc0a', "Astoria Ditmars Blvd - \nConey Island Stillwell Av"),
        new Map('#66c6b2', "Paris Montparnasse - \nRambouillet"),
        new Map('#66c6b2', "Paris Montparnasse - \nMantes-la-Jolie"),
        new Map('#66c6b2', "Paris Montparnasse - \nDreux"),
        new Map('#8E3DA2', "Union Station - \nEastlake-124th")
    ],
    'O' => [
        new Map('#1BA63F', "Lahti - Kotkan satama")
    ],
    'P' => [
        new Map('#f3ac14', "Paris Est - Coulommiers"),
        new Map('#f3ac14', "Paris Est - Provins"),
        new Map('#f3ac14', "Paris Est - \nChâteau-Thierry"),
        new Map('#f3ac14', "Paris Est - Meaux"),
        new Map('#f3ac14', "Meaux - La Ferté Milon"),
        new Map('#f3ac14', "Esbly - Crécy-la-Chapelle")
    ],
    'Q' => [
        new Map('#fccc0a', "96 St - \nConey Island Stillwell Av")
    ],
    'R' => [
        new Map('#fccc0a', "Forest Hills/71 Av - \nBay Ridge 95 St"),
        new Map('#df98c3', "Gare de Lyon - Montargis"),
        new Map('#df98c3', "Gare de Lyon - \nMontereau \n(via Moret \nVeneux les Sablons)"),
        new Map('#df98c3', "Melun - Montereau \n(via Champagne-\nsur-Seine)"),
        new Map('#C3D600', "Peoria - Lincoln"),
        new Map('#1BA63F', "Helsinki - Nokia")
    ],
    'S' => [
        new Map('#808183', "Franklin Av - \nProspect Park")
    ],
    'T' => [
        new Map('#1BA63F', "Helsinki - Riihimäki")
    ],
    'U' => [
        new Map('#dc0962', "La Défense - La Verrière"),
        new Map('#963181', "Helsinki - Kirkkonummi")
    ],
    'V' => [
        new Map('#8AAB00', "Versailles Chantiers - \nMassy Palaiseau")
    ],
    'W' => [
        new Map('#fccc0a', "Astoria Ditmars Blvd - \nWhitehall St/South Ferry"),
        new Map('#0091B3', "Union Station - \nJeffco Government \nCenter-Golden")
    ],
    'X' => [
        new Map('#963181', "Helsinki - Siuntio")
    ],
    'Y' => [
        new Map('#963181', "Helsinki - Siuntio")
    ],
    'Z' => [
        new Map('#996633', "Broad St - \nJamaica Center \nParsons/Archer"),
        new Map('#1BA63F', "Helsinki - Kouvola")
    ],
    '&#x1F686;&#xFE0E;' => [
        new Map('#00a261', "Göteborg C - Strömstad"),
        new Map('#6fcef4', "Göteborg C - \nVänersborg / Säffle"),
        new Map('#FDCC99', "Trollhättan - Ed"),
        new Map('#a54499', "Uddevalla C - Borås"),
        new Map('#0079c2', "Göteborg C - Töreboda"),
        new Map('#ee3a41', "Göteborg C - Nässjö"),
        new Map('#c7df8e', "Örebro C - Nässjö"),
        new Map('#f79727', "Göteborg C - Örebro C"),
        new Map('#9c5506', "Göteborg C - Borås"),
        new Map('#ffdc01', "Borås - Varberg"),
        new Map('#e896c1', "Göteborg C - Varberg"),
        new Map('#A6A7A9', "Göteborg C - \nKungsbacka"),
        new Map('#231f20', "Göteborg C - Alingsås"),
        new Map('#4e575c', "Göteborg C - Älvängen"),
        new Map('#26BFF0', "Porta San Paulo - \nCristoforo Colombo"),
        new Map('#42B649', "Flaminio - Montebello"),
        new Map('#42B649', "Flaminio - Viterbo"),
        new Map('#FBB416', "Termini - Giardinetti")
    ]
];