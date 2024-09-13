import {ctx} from "./game.js";

export default class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = 'gray';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    isColliding(bullet) {
        return bullet.x >= this.x && 
               bullet.x <= this.x + this.width &&
               bullet.y >= this.y && 
               bullet.y <= this.y + this.height;
    }
}
