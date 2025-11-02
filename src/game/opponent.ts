import i18next from "https://unpkg.com/i18next@25.6.0/dist/esm/i18next.js";

import {ajaxDomain, sendRequest, wait} from "../utils.js";

import Line from "./line.js";
import LineWithMaps from "./line-with-maps.js";
import Place from "./place.js";
import Player from "./player.js";
import Station from "./station.js";

type InviteData = {
    action: "invite",
    userId: string,
    userName: string,
    profilePicture: string,
    place: string,
    useMoney: boolean
};

type AcceptInvitationData = {
    action: "accept",
    myStartingStation: string,
    yourStartingStation: string,
    stationMaps: Array<Array<number>>,
    lineMaps: Array<Array<number>>
};

type DeclineInvitationData = {
    action: "decline"
};

type GoToStationData = {
    action: "goToStation",
    lineToTake: number,
    destination: string,
    lookForLast: boolean
};

type CollectMapData = {
    action: "collect",
    map: number
};

type SpendMoneyData = {
    action: "spendMoney",
    moneySpent: number
};

type DisconnectData = {
    action: "disconnect"
}

type AnyData = InviteData | AcceptInvitationData | DeclineInvitationData | GoToStationData | CollectMapData | SpendMoneyData | DisconnectData;

export default class Opponent{
    readonly userId: string;
    readonly userName: string;

    currentStation: Station | null = null;
    currentlyRiding: boolean = false;
    maps: Set<LineWithMaps> = new Set();
    remainingMoney: number = 0;    //In two-player games, remainingMoney is negative and equals minus the amount of spent money

    readonly #place: Place;
    #connection: PeerJs.DataConnection | null = null;
    #invitationDialog: XDialog.Dialog | null = null;

    static #peer: PeerJs.Peer | null = null;

    /**
     * Constructs an Opponent object without sending an invitation, connecting to a peer or anything similar.
     *
     * @param place     The place to play a game in.
     * @param userId    The user ID of the opponent.
     * @param userName  The user name of the opponent.
     */
    constructor(place: Place, userId: string, userName: string){
        this.#place = place;
        this.userId = userId;
        this.userName = userName;

        window.addEventListener("beforeunload", () => this.disconnect());
    }

    /**
     * Initializes Peer.js so that invitations can be received. Should be called on page load.
     *
     * @param allPlaces An array with all places. Used to determine which Place object to play in when an invitation is received.
     */
    static initializePeer(allPlaces: ReadonlyArray<Place>): void {
        const myId = document.querySelector<HTMLMetaElement>("meta[name=user-id]")?.content ?? null;
        if(myId !== null){
            Opponent.#peer = new Peer(`gustavlindberg99-mapcollector-${myId}-${new Date().getTime()}`);
            sendRequest(ajaxDomain() + "/ajax/multiplayer.php", new URLSearchParams({"setId": Opponent.#peer.id}));

            Opponent.#peer.on("connection", (connection: PeerJs.DataConnection) => {
                if(!/^gustavlindberg99-mapcollector-[0-9]+-[0-9]+$/.test(connection.peer)){    //If the peer's ID doesn't match a Map Collector ID
                    connection.close();
                    return;
                }
                let opponent: Opponent;
                connection.on("data", (data: unknown) => {
                    if(!Opponent.#validateData(data)){
                        return;
                    }
                    if(data.action === "invite"){
                        const place = allPlaces.find(it => it.filename === data.place);
                        opponent = new Opponent(place!!, data.userId, data.userName);
                        opponent.#connection = connection;
                    }
                    opponent.#handleReceivedData(data);
                });
            });
        }
    }

    /**
     * Sends an invitation to the opponent.
     *
     * @return Null if the opponent declined the invitation or if an error occurred. If the opponent accepted the invitation, returns a tuple with the opponent's starting station id, this player's starting station id, which maps are available at which station, and which maps are available on each line.
     * The structure of the available maps arrays is as follows: They have the same outer structure as the place's stations and lines arrays, but instead of stations and lines they contain inner arrays with the available maps, where the available maps are represened by the index of the map's line in the place's lines array. Walking lines are considered like any other lines, except they always have an empty available maps array and no index in another available maps array ever corresponds to a walking line.
     */
    async sendInvitation(): Promise<[string, string, Array<Array<number>>, Array<Array<number>>] | null> {
        const response = await sendRequest(ajaxDomain() + "/ajax/multiplayer.php", new URLSearchParams({"getId": this.userId}));
        if(response === null){
            Toastify({
                text: i18next.t("An error occurred when preparing for a two-player game. Check your internet connection and try again."),
                close: true,
                style: {
                    background: "red"
                }
            }).showToast();
            return null;
        }
        const peerJsIds: ReadonlyArray<string> = await response.json();
        let connections: Array<PeerJs.DataConnection> | null = [];
        this.disconnect();

        //Try to create a connection for each ID so that if the opponent has multiple browsers open without knowing about it, they get a request in all of them
        const data = peerJsIds.length === 0 ? undefined : await Promise.race([
            wait(20000),
            ...peerJsIds.map(peerJsId => new Promise<(AnyData | DeclineInvitationData) & {connection: PeerJs.DataConnection}>(async (resolvePromise) => {
                const connection = await this.#createConnection(peerJsId);
                if(
                    connection === null        //If the connection failed
                    || connections === null    //If another connection already started a game
                ){
                    connection?.close();
                    return;
                }

                const profilePictureImg = document.querySelector<HTMLImageElement>("a[href='/users/profile.php'] img")!!;
                this.#send({
                    action: "invite",
                    userId: document.querySelector<HTMLMetaElement>("meta[name=user-id]")!!.content,
                    userName: profilePictureImg.alt,
                    profilePicture: profilePictureImg.src,
                    place: this.#place.filename,
                    useMoney: this.#place.playingWithMoney!!
                }, connection);

                connections.push(connection);
                connection.on("data", (data: unknown) => Opponent.#validateData(data) && resolvePromise({...data, connection: connection}));
            }))
        ]);

        if(data === undefined){
            Toastify({
                text: i18next.t("Could not connect with {{arg}}. If you know them, contact them and make sure that they have this page opened and that they're logged in. If this error persists, make sure both you and the other user refresh the page.", {arg: this.userName}),
                close: true,
                style: {
                    background: "red"
                }
            }).showToast();
            return null;
        }

        this.#connection = data.connection;
        this.#connection!!.off("data", () => {});    //Don't resolve the above promise again

        //When the opponent has replied to a request in one browser, close the other ones
        for(let connection of connections){
            if(connection !== this.#connection){
                this.#send({action: "disconnect"}, connection);
                connection.close();
            }
        }
        connections = null;    //If another connection tries to open after a reply, this will allow it to know that it should close immediately

        if(data.action === "accept"){
            this.#connection!!.on("data", (data: unknown) => Opponent.#validateData(data) && this.#handleReceivedData(data));
            return [data.myStartingStation, data.yourStartingStation, data.stationMaps, data.lineMaps];
        }
        else{
            Toastify({
                text: data.action === undefined ? i18next.t("{{arg}} didn't respond.", {arg: this.userName}) : i18next.t("{{arg}} declined your invitation.", {arg: this.userName}),
                close: true,
                style: {
                    background: "red"
                }
            }).showToast();
            this.disconnect();
            return null;
        }
    }

    /**
     * Disconnects in order to close the game.
     */
    disconnect(): void {
        this.#send({action: "disconnect"});
        this.#connection?.close();
        this.#connection = null;
    }

    /**
     * Sends a signal to the opponent that the player is going to a station.
     *
     * @param lineToTake    The line to take to get to the destination.
     * @param destination   The station to go to.
     * @param lookForLast   False if it should go the way it thinks is natural and true otherwise. Only useful for loops and circular lines.
     */
    sendGoingToStationSignal(lineToTake: Line, destination: Station, lookForLast: boolean): void {
        this.#send({
            action: "goToStation",
            lineToTake: this.#place.lines!!.indexOf(lineToTake),
            destination: destination.id,
            lookForLast: lookForLast
        });
    }

    /**
     * Displays that the opponent is going to a station. Does not deduct the cost when playing with money, that's done with a separate signal. This is an async function that returns when the player has reached the destination.
     *
     * @param lineToTake    The line to take to get to the destination.
     * @param destination   The station to go to.
     * @param lookForLast   False if it should go the way it thinks is natural and true otherwise. Only useful for loops and circular lines.
     */
    async #goToStation(lineToTake: Line, destination: Station, lookForLast: boolean): Promise<void> {
        const branchToTake = lineToTake.branchBetweenStations(this.currentStation!!, destination);
        const segments = branchToTake!!.segmentsBetweenStations(this.currentStation!!, destination, lookForLast);

        this.#place.gameView!!.gameInfoBox.setCurrentLine(lineToTake, destination, this);
        this.currentStation = destination;
        this.currentlyRiding = true;

        for(let segment of segments!!){
            const speed = lineToTake.speed(segment);
            for(
                let position = 0;
                position < segment.length;
                position += this.#place.gameIsPaused ? 0 : Player.REFRESH_FREQUENCY * speed * lineToTake.speedFactor(branchToTake!!, segment, position)
            ){
                this.#place.gameView!!.setOpponentPosition(segment.pointAtLength(position)!!);
                await wait(Player.REFRESH_FREQUENCY * 1000);
                if(!this.#place.isPlayingGame() || this.currentStation !== destination){
                    break;
                }
            }
        }

        const [point] = lineToTake.pointsAtStation(destination);
        this.#place.gameView!!.setOpponentPosition(point);
        this.#place.gameView!!.gameInfoBox.setCurrentStation(destination, this);
        this.currentlyRiding = false;
    }

    /**
     * Sends a signal to the opponent that the player collected a map.
     *
     * @param map   The map to collect.
     */
    sendCollectSignal(map: LineWithMaps): void {
        this.#send({
            action: "collect",
            map: this.#place.lines!!.indexOf(map)
        });
    }

    /**
     * Displays that the opponent collected a map.
     *
     * @param map   The map to collect.
     */
    #collect(map: LineWithMaps): void {
        this.maps.add(map);
        this.#place.gameView!!.gameInfoBox.setNumberOfMaps(this.maps.size, this.#place.maps!!.length, this);
        this.#place.gameView!!.updateOpponentStillNeededMaps();

        //The opponent wins (and the player loses) if they have all maps, except when playing with money in a two-player game and the player has less money in which case it's still possible that the player gets all maps later without spending more money
        if(this.maps.size === this.#place.maps!!.length && (!this.#place.playingWithMoney || this.#place.player!!.remainingMoney < this.remainingMoney)){
            this.#place.player!!.endGame(false);
        }
        //If it's a two-player game and both players have the same amount of money and all maps, it's a draw, in that case both players are considered to win
        if(this.maps.size === this.#place.maps!!.length && this.#place.player!!.maps.size === this.#place.maps!!.length && this.#place.playingWithMoney && this.#place.player!!.remainingMoney === this.remainingMoney){
            this.#place.player!!.endGame(true);
        }
    }

    /**
     * Sends a signal to the opponent that the player spent money.
     *
     * @param moneySpent    The amount of money to spend.
     */
    sendSpentMoneySignal(moneySpent: number): void {
        this.#send({
            action: "spendMoney",
            moneySpent: moneySpent
        });
    }

    /**
     * Decreases the amount of money the opponent has, and updates the game info box accordingly.
     *
     * @param moneySpent    The amount of money to spend.
     */
    #spendMoney(moneySpent: number): void {
        this.remainingMoney -= moneySpent;

        const playerMoney = Math.abs(this.#place.player!!.remainingMoney);
        const opponentMoney = Math.abs(this.remainingMoney);
        const maxMoney = Math.max(playerMoney, opponentMoney, 1);
        this.#place.gameView!!.gameInfoBox.setMoney(opponentMoney, maxMoney, true, this);
        this.#place.gameView!!.gameInfoBox.setMoney(playerMoney, maxMoney, true, null);

        if(this.#place.playingWithMoney && this.remainingMoney < this.#place.player!!.remainingMoney && this.#place.player!!.maps.size === this.#place.maps!!.length){
            this.#place.player!!.endGame(true);
        }
    }

    /**
     * Creates and opens a new connection when sending an invitation.
     *
     * @param peerJsId  The opponent's Peer.js ID.
     *
     * @return The connection, or null if connecting failed.
     */
    async #createConnection(peerJsId: string): Promise<PeerJs.DataConnection | null> {
        //Sometimes it won't respond for some reason, so try again after 2 seconds
        for(let i = 0; i < 10; i++){
            const connection = Opponent.#peer!!.connect(peerJsId);
            if(connection === undefined){
                return null;
            }
            const success = await Promise.race([wait(2000), new Promise((resolvePromise) => {
                connection.on("open", () => {
                    resolvePromise(true);
                });
            })]);
            if(success){
                return connection;
            }
            connection.close();    //Close the old connection before opening a new one
        }

        return null;    //If it still doesn't work, it's because the user closed the tab
    }

    /**
     * Handles data sent by the peer.
     *
     * @param data  The data sent by the peer.
     */
    #handleReceivedData(data: AnyData): void {
        switch(data.action){
        case "collect":
            const map = this.#place.lines!![data.map] as LineWithMaps;
            this.#collect(map);
            break;

        case "disconnect":
            this.#connection?.close();
            this.#connection = null;
            this.#invitationDialog?.close();
            if(this.#place.isPlayingGame()){
                Toastify({
                    text: i18next.t("The game was ended by {{arg}}.", {arg: this.userName}),
                    close: true,
                    style: {
                        background: "orange"
                    }
                }).showToast();
                this.#place.closeGame();
            }
            break;

        case "goToStation":
            const lineToTake = this.#place.lines!![data.lineToTake];
            const destination = this.#place.stations!!.find(it => it.id === data.destination);
            this.#goToStation(lineToTake, destination!!, data.lookForLast);
            break;

        case "invite":
            const profilePicture = document.createElement("img");
            profilePicture.src = data.profilePicture;
            profilePicture.alt = data.userName;
            profilePicture.width = profilePicture.height = 32;
            profilePicture.style.verticalAlign = "middle";

            const text = document.createElement("span");
            text.textContent = i18next.t("{{user}} wants to play a game with you in {{place}}.", {user: this.userName, place: this.#place.name});

            this.#invitationDialog = xdialog.open({
                title: i18next.t("Two-player game invitation"),
                body: (window.Android ? "" : profilePicture.outerHTML) + text.outerHTML,
                buttons: {ok: i18next.t("Yes"), delete: i18next.t("No")},
                onok: () => this.#acceptInvitation(data.useMoney),
                ondelete: () => this.#declineInvitation(),
                oncancel: () => this.#declineInvitation()
            });
            break;

        case "spendMoney":
            this.#spendMoney(data.moneySpent);
            break;
        }
    }

    /**
     * Accepts an invitation for a two-player game.
     *
     * @param useMoney  True if playing with money, false if playing with time.
     */
    async #acceptInvitation(useMoney: boolean): Promise<void> {
        const startGameSucceeded = await this.#place.startGame(useMoney, this, false);
        if(!startGameSucceeded){
            Toastify({
                text: i18next.t("An error occurred when opening {{arg}}. Check your internet connection and try again.", {arg: this.#place.name}),
                close: true,
                style: {
                    background: "red"
                }
            }).showToast();
        }
        if(!this.#place.isPlayingGame()){    //If it failed of if they pressed the cancel button
            this.#declineInvitation();
            return;
        }

        const mapToNumber: (it: LineWithMaps) => number = it => this.#place.lines!!.indexOf(it);
        const stationMaps: Array<Array<number>> = this.#place.stations!!.map(it => it.availableMaps.map(mapToNumber));
        const lineMaps: Array<Array<number>> = this.#place.lines!!.map(it => it instanceof LineWithMaps ? it.availableMaps.map(mapToNumber) : []);

        this.#send({
            action: "accept",
            myStartingStation: this.#place.player!!.currentStation!!.id,
            yourStartingStation: this.currentStation!!.id,
            stationMaps: stationMaps,
            lineMaps: lineMaps
        });
    }

    /**
     * Declines an invitation for a two-player game.
     */
    #declineInvitation(): void {
        this.#send({action: "decline"});
    }

    /**
     * Type safe wrapper arround `connection.send()`.
     *
     * @param data          The data to send.
     * @param connection    The connection to send the data with.
     */
    #send(data: AnyData, connection: PeerJs.DataConnection | null = this.#connection): void {
        connection?.send(data);
    }

    /**
     * Validates that data received from a peer is valid.
     *
     * @param data  The data to validate.
     *
     * @returns True if it's valid, false if it's invalid.
     */
    static #validateData(data: unknown): data is AnyData {
        if(typeof(data) !== "object" || data === null || !("action" in data)){
            console.warn("Peer sent invalid data: invalid type");
            return false;
        }
        switch(data.action){
        case "invite":
            if(!("userId" in data) || typeof(data.userId) !== "string"){
                console.warn("Peer sent invalid data: invalid userId");
                return false;
            }
            if(!("userName" in data) || typeof(data.userName) !== "string"){
                console.warn("Peer sent invalid data: invalid userName");
                return false;
            }
            if(!("profilePicture" in data) || typeof(data.profilePicture) !== "string" || !(data.profilePicture.startsWith("https://www.gravatar.com/avatar/") || data.profilePicture.startsWith(location.origin))){
                console.warn("Peer sent invalid data: invalid profilePicture");
                return false;
            }
            if(!("place" in data) || typeof(data.place) !== "string"){
                console.warn("Peer sent invalid data: invalid place");
                return false;
            }
            if(!("useMoney" in data) || typeof(data.useMoney) !== "boolean"){
                console.warn("Peer sent invalid data: invalid useMoney");
                return false;
            }
            return true;
        case "accept":
            if(!("myStartingStation" in data) || typeof(data.myStartingStation) !== "string"){
                console.warn("Peer sent invalid data: invalid myStartingStation");
                return false;
            }
            if(!("yourStartingStation" in data) || typeof(data.yourStartingStation) !== "string"){
                console.warn("Peer sent invalid data: invalid yourStartingStation");
                return false;
            }
            if(!("stationMaps" in data) || !(data.stationMaps instanceof Array) || !data.stationMaps.every(a => a instanceof Array && a.every(n => typeof(n) === "number"))){
                console.warn("Peer sent invalid data: invalid stationMaps");
                return false;
            }
            if(!("lineMaps" in data) || !(data.lineMaps instanceof Array) || !data.lineMaps.every(a => a instanceof Array && a.every(n => typeof(n) === "number"))){
                console.warn("Peer sent invalid data: invalid lineMaps");
                return false;
            }
            return true;
        case "decline":
            return true;
        case "goToStation":
            if(!("lineToTake" in data) || typeof(data.lineToTake) !== "number"){
                console.warn("Peer sent invalid data: invalid lineToTake");
                return false;
            }
            if(!("destination" in data) || typeof(data.destination) !== "string"){
                console.warn("Peer sent invalid data: invalid destination");
                return false;
            }
            if(!("lookForLast" in data) || typeof(data.lookForLast) !== "boolean"){
                console.warn("Peer sent invalid data: invalid lookForLast");
                return false;
            }
            return true;
        case "collect":
            if(!("map" in data) || typeof(data.map) !== "number"){
                console.warn("Peer sent invalid data: invalid map");
                return false;
            }
            return true;
        case "spendMoney":
            if(!("moneySpent" in data) || typeof(data.moneySpent) !== "number" || data.moneySpent < 0){
                console.warn("Peer sent invalid data: invalid moneySpent");
                return false;
            }
            return true;
        case "disconnect":
            return true;
        default:
            console.warn("Peer sent invalid data: invalid action");
            return false;
        }
    }
}
