/**
 * Control component.
 */
export interface ControlComponent {
    jump: boolean;
    attack: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
}

/**
 * Position component.
 */
export interface PositionComponent {
    x: number,
    y: number
}

/**
 * Sprite component.
 */
export interface SpriteComponent {
    url: string,
    pixelRatio: number,
}

/**
 * Animation component.
 */
export interface AnimationComponent {
    sequence: string,
    currentFrame: number,
}