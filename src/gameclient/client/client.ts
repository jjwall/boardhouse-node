import { BufferGeometry, ShapeBufferGeometry, WebGLRenderer, Audio, AudioListener, Scene, Camera, Color, OrthographicCamera} from "three";
import { UrlToTextureMap, UrlToFontMap, UrlToAudioBufferMap } from "./interfaces";
import { handleKeyDownEvent, handleKeyUpEvent } from "../events/keyboardevents";
import { loadFonts, loadTextures, loadAudioBuffers } from "./loaders";
import { GameServerStateTypes } from "../../packets/gameserverstatetypes";
import { ClientRoleTypes } from "../../packets/clientroletypes";
import { EventTypes } from "../events/eventtypes";

export interface ClientConfig {
    /// state stuff ///



    /// end state stuff ///
    role: ClientRoleTypes;
    /// old configs
    connection: WebSocket;
    currentPort: number;
    currentClientId: string;
    hostName: string;
    keyLeftIsDown: boolean;
    keyRightIsDown: boolean;
    // end old configs
    screenWidth: number;
    screenHeight: number;
    // gameTicksPerSecond: number; // -> don't need
    // displayFPS: boolean; // -> set up later
    // displayHitBoxes: boolean; // -> set up later
    // globalErrorHandling: boolean; // -> set up later
    fontUrls: string[];
    textureUrls: string[];
    audioUrls: string[];
}

export class Client {
    constructor(config: ClientConfig) {
        ///
        this.role = config.role;
        ///
        // vvv merged from old configs vvv
        this.connection = config.connection;
        this.currentPort = config.currentPort;
        this.currentClientId = config.currentClientId;
        this.hostName = config.hostName;
        this.keyLeftIsDown = config.keyLeftIsDown;
        this.keyRightIsDown = config.keyRightIsDown;

        // ...
        // vvv regular engine stuff vvv
        this.screenWidth = config.screenWidth;
        this.screenHeight = config.screenHeight;
        // this.millisecondsPerGameTick = 1000 / config.gameTicksPerSecond;
        // this.displayFPS = config.displayFPS;
        // this.displayHitBoxes = config.displayHitBoxes;
        // this.globalErrorHandling = config.globalErrorHandling;
        this.fontUrls = config.fontUrls;
        this.textureUrls = config.textureUrls;
        this.audioUrls = config.audioUrls;
    }

    /// state stuff
    public role: ClientRoleTypes;
    public gameScene: Scene;
    public gameCamera: Camera;
    public uiScene: Scene;
    public uiCamera: Camera;
    public entityList: ClientEntity[] = [];

    /// end state stuff

    /// vvv old configs vvv
    connection: WebSocket;
    currentPort: number;
    currentClientId: string;
    hostName: string;
    keyLeftIsDown: boolean;
    keyRightIsDown: boolean;

    /// ^^^ old configs ^^^

    public screenWidth: number;

    public screenHeight: number;

    public millisecondsPerGameTick: number;

    public displayFPS: boolean;

    public globalErrorHandling: boolean;

    public displayHitBoxes: boolean;

    public FPS: number;

    public renderer: WebGLRenderer;

    public fontUrls: string[];

    public textureUrls: string[];

    public audioUrls: string[];
    
    private _textures: UrlToTextureMap = {};

    private _fonts: UrlToFontMap = {};

    private _audioBuffers: UrlToAudioBufferMap = {};

    private _textGeometries: { [k: string]: BufferGeometry } = {};

    private setFonts(value: UrlToFontMap) {
        this._fonts = value;
    }

    private setTextures(value: UrlToTextureMap) {
        this._textures = value;
    }

    private setAudioBuffers(value: UrlToAudioBufferMap) {
        this._audioBuffers = value;
    }

    public async loadAssets() {
        await Promise.all([
            loadFonts(this.fontUrls),
            loadTextures(this.textureUrls),
            loadAudioBuffers(this.audioUrls)
        ]).then((assets) => {
            this.setFonts(assets[0]);
            this.setTextures(assets[1]);
            this.setAudioBuffers(assets[2]);
        });
    }

    public getFont(url: string) {
        if (!this._fonts[url]) {
            throw new Error("Font not found. Check url and ensure font url is being passed in to loadFonts().");
        }

        return this._fonts[url];
    }

    public getTexture(url: string) {
        if (!this._textures[url]) {
            throw new Error("Texture not found. Check url and ensure texture url is being passed in to loadTextures().");
        }

        return this._textures[url];
    }

    public getAudioBuffer(url: string) {
        if (!this._audioBuffers[url]) {
            throw new Error("Audio element not found. Check url and ensure audio element url is being passed in to loadAudioElements().");
        }

        return this._audioBuffers[url];
    }

    public getTextGeometry(contents: string, fontUrl: string, font_size: number) {
        const key = `${contents}|${fontUrl}|${font_size}`;
        const geom = this._textGeometries[key];
        if (geom) {
            return geom;
        } else {
            const font = this.getFont(fontUrl);
            const shapes = font.generateShapes(contents, font_size);
            const geometry = new ShapeBufferGeometry(shapes);

            // Ensure font is centered on (parent) widget.
            geometry.computeBoundingBox();
            const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
            geometry.translate(xMid, 0, 0);

            this._textGeometries[key] = geometry;

            return geometry;
        }
    }

    public playAudio(url: string, scene: Scene, camera: Camera, volume?: number, loop?: boolean) {
        const audioListener = new AudioListener();
        const audio = new Audio(audioListener);

        // add the listener to the camera
        camera.add(audioListener);

        // add the audio object to the scene
        scene.add(audio);

        audio.setBuffer(this.getAudioBuffer(url));

        if (volume) {
            if (volume < 0 || volume > 1)
                throw Error("volume can't be a value less than 0 or greater than 1.");
            
            audio.setVolume(volume);
        }

        if (loop)
            audio.loop = loop;

        audio.play();
    }

    /**
     * Initialize Game Client state based on Game Server state.
     * @param gameServerState
     */
    public initializeState(gameServerState: GameServerStateTypes) {
        switch (gameServerState) {
            case GameServerStateTypes.GAMEPLAY:
                // do stuff based on game server state
                console.log("initializing client for game play state");
                // Set up game scene.
                this.gameScene = new Scene();
                this.gameScene.background = new Color("#FFFFFF");

                // Set up game camera.
                this.gameCamera = new OrthographicCamera(0, this.screenWidth, this.screenHeight, 0, -1000, 1000);

                // Set up ui scene.
                this.uiScene = new Scene();

                // Set up ui camera.
                this.uiCamera = new OrthographicCamera(0, this.screenWidth, 0, -this.screenHeight, -1000, 1000);
                break;
        }
    }

    public handleEvent(e: Event) : void {
        switch(e.type) {
            case EventTypes.KEY_DOWN:
                if (this.role === ClientRoleTypes.PLAYER)
                    handleKeyDownEvent(this, e as KeyboardEvent);
                break;
            case EventTypes.KEY_UP:
                if (this.role === ClientRoleTypes.PLAYER)
                    handleKeyUpEvent(this, e as KeyboardEvent);
                break;
        }
    }

    public render() : void {
        this.renderer.clear();
        this.renderer.render(this.gameScene, this.gameCamera);
        this.renderer.clearDepth();
        this.renderer.render(this.uiScene, this.uiCamera);

        // Render UI updates. // -> set up later
        // layoutWidget(this.rootWidget, this.engine);
    }
}