import {width, height, ctx, walls, myTank} from "./game.js";

export const BulletType = {
    "Normal": 0,
    "Spring": 1,
}

export class Bullet {
    constructor(x, y, angle, type) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.BulletType = type;

        if (this.BulletType === BulletType.Normal) {
            this.speed = 20;
            this.backlash = -3;
            this.damage = 34;
            this.size = 5;
            this.maxRebound = 2;
            this.endTime = 500;
            this.loadTime = 700;
        } else if (this.BulletType === BulletType.Spring) {
            this.speed = 43;
            this.backlash = -2;
            this.damage = 3;
            this.size = 3;
            this.maxRebound = 10;
            this.endTime = 60;
            this.loadTime = 200;
        }
    
        this.timer = 0;
        this.color = 'black';
        this.reboundTime = 0;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
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
        const hit = this.checkCollisionWithTank(myTank);

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

                if (this.BulletType === BulletType.Normal) {
                    if (Math.abs(this.velocityX) <= Math.abs(this.velocityY)) {
                        this.velocityX = -this.velocityX;
                    } else {
                        this.velocityY = -this.velocityY;
                    }
                } else if (this.BulletType === BulletType.Spring) {
                    let detectLen = Math.abs(this.velocityX) + Math.abs(this.velocityY);
                    let l_x = this.x - detectLen, r_x = this.x + detectLen;
                    if (wall.within(l_x, this.y) || wall.within(r_x, this.y)) { // vertically hit
                        this.velocityX = -this.velocityX;
                    } else {                                                    // horizontally hit
                        this.velocityY = -this.velocityY;
                    }
                }

                break;
            }
        }

        return hit;
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

