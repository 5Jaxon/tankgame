import {width, height, ctx, walls, myTank} from "./game.js";

const Type = {
    "Normal": 0
}

export default class Bullet {
    constructor(x, y, angle, speed, backlash){
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.backlash = backlash;
        this.damage = 34;
        this.size = 4;
        this.color = 'black';
        this.timer = 0;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
        this.reboundTime = 0;
        this.maxRebound = 2;
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
        const flag = this.checkCollisionWithTank(myTank);

        if (this.x < 0 || this.x > width) {
            this.velocityX = -this.velocityX;
            this.reboundTime++;
            if (this.x < 0) this.x = 0;
            else this.x = width;
        }

        if (this.y < 0 || this.y > height) {
            this.velocityY = -this.velocityY;
            this.reboundTime++;
            if (this.y < 0) this.y = 0;
            else this.y = height;
        }

        for (let wall of walls) {
            if (wall.isColliding(this)) {
                this.reboundTime++;
                this.x = this.x - this.velocityX;
                this.y = this.y - this.velocityY;
                if (Math.abs(this.velocityX) <= Math.abs(this.velocityY)) {
                    this.velocityX = -this.velocityX;
                } else {
                    this.velocityY = -this.velocityY;
                }
                break;
            }
        }

        return flag;
    }

    checkCollisionWithTank(tank) {
        if (this.x + this.size > tank.x - tank.size / 2 &&
            this.x - this.size < tank.x + tank.size / 2 &&
            this.y + this.size > tank.y - tank.size / 2 &&
            this.y - this.size < tank.y + tank.size / 2) {        
            tank.beShot(this.damage);
            return true;
        }
        return false;
    }
}
