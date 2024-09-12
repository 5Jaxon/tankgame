import {width, height, ctx, socket, walls, myTank} from "./game.js";

export default class Bullet {
    constructor(x, y, angle){
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 20;
        this.size = 4;
        this.color = 'black';
        this.timer = 0;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
        this.reboundTime = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.timer++;
        const flag=this.checkCollisionWithTank(myTank);

        if (this.x - this.size < 0 || this.x + this.size > width) {
            this.velocityX = -this.velocityX;
            this.reboundTime++;
        }

        if (this.y - this.size < 0 || this.y + this.size > height) {
            this.velocityY = -this.velocityY;
            this.reboundTime++;
        }

        for (let wall of walls) {
            if (wall.isColliding(this)) {
                this.reboundTime++;
                if (this.x - this.size < wall.x || this.x + this.size > wall.x + wall.width) {
                    this.velocityX = -this.velocityX;
                }
                else if (this.y - this.size < wall.y || this.y + this.size > wall.y + wall.height) {
                    this.velocityY = -this.velocityY;
                }
            }
        }
        return flag;
    }

    checkCollisionWithTank(tank) {
        if (this.x + this.size > tank.x - tank.size / 2 &&
            this.x - this.size < tank.x + tank.size / 2 &&
            this.y + this.size > tank.y - tank.size / 2 &&
            this.y - this.size < tank.y + tank.size / 2) {        
            tank.beshot();
            return true;
        }
        return false;
    }
}
