import {width, height, ctx, walls, myTank, bullets} from "./game.js";

export const BulletType = {
    Normal: {
        id: 0,
        speed: 23,
        backlash: -4,
        damage: 42,
        size: 5,
        maxRebound: 2,
        endTime: 400,
        loadage: 2,
        interval: 120,
        loadTime: 4000,
    },
    Spring: {
        id: 1,
        speed: 37,
        backlash: -0.5,
        damage: 13,
        size: 3.5,
        maxRebound: 10,
        endTime: 60,
        loadage: 12,
        interval: 70,
        loadTime: 1300,
    },
    Split: {
        id: 2,
        speed: 20,
        backlash: -2,
        damage: 24,
        size: 7,
        maxRebound: 0,
        endTime: 70,
        loadage: 1,
        interval: 0,
        loadTime: 5200,
    },
};

export class Bullet {
    constructor(x, y, angle, type) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.timer = 0;
        this.color = 'black';
        this.reboundTime = 0;
        
        let bulletType = type;
        this.type = bulletType.id;
        const { speed, backlash, damage, size, maxRebound, endTime, loadTime } = 
            Object.values(BulletType).find(b => b.id === this.type);
        this.speed = speed;
        this.backlash = backlash;
        this.damage = damage;
        this.size = size;
        this.maxRebound = maxRebound;
        this.endTime = endTime;
        this.loadTime = loadTime;

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
        if (this.hitTank(myTank) || this.checkTime()) {
            return true;
        } else if (this.hitWall() || this.hitBorder()) {
            return this.reboundTime > this.maxRebound;
        }
    }

    checkTime() {
        this.timer++;
        if (
            this.type === BulletType.Spring.id &&
            this.timer % 5 == 0
        ) {
            this.weaken(0.95);
        } else if (
            this.timer == this.endTime && 
            this.type === BulletType.Split.id
        ) {
            this.split();
        }
        return this.timer > this.endTime;
    }

    hitBorder() {
        let hit = false;
        if (this.x < 0 || this.x > width) {
            this.reboundTime++;
            if (this.x < 0)
                this.x = 1;
            else
                this.x = width - 1;
        
            this.velocityX = -this.velocityX;
            this.weaken(0.9);
            hit = true;
        }

        if (this.y < 0 || this.y > height) {
            this.reboundTime++;
            if (this.y < 0)
                this.y = 1;
            else 
                this.y = height - 1;
        
            this.velocityY = -this.velocityY;
            this.weaken(0.9);
            hit = true;
        }

        if (hit && this.type == BulletType.Split.id) {
            this.split();
        }
        return hit;
    }

    hitWall() {
        let hit = false;
        for (let wall of walls) {
            if (wall.isColliding(this)) {
                hit = true;
                this.reboundTime++;
            
                this.x = this.x - this.velocityX;
                this.y = this.y - this.velocityY;
                if (this.type == BulletType.Normal.id) {
                    if (Math.abs(this.velocityX) <= Math.abs(this.velocityY)) {
                        this.velocityX = -this.velocityX;
                    } else {
                        this.velocityY = -this.velocityY;
                    }
                    this.weaken(0.6);
                } else if (this.type == BulletType.Spring.id) {
                    // this algorithm may lose effect when bullet cast diagonally into corner
                    let detectLen = Math.abs(this.velocityX) + Math.abs(this.velocityY);
                    let l_x = this.x - detectLen, r_x = this.x + detectLen;
                    if (wall.within(l_x, this.y) || wall.within(r_x, this.y)) { // vertically hit
                        this.velocityX = -this.velocityX;
                    } else {                                                    // horizontally hit
                        this.velocityY = -this.velocityY;
                    }
                    this.weaken(0.7)
                } else if (this.type == BulletType.Split.id) {
                    this.split();
                }

                break;
            }
        }
        return hit;
    }

    hitTank(tank) {
        if (this.x + this.size > tank.x - tank.size / 2 &&
            this.x - this.size < tank.x + tank.size / 2 &&
            this.y + this.size > tank.y - tank.size / 2 &&
            this.y - this.size < tank.y + tank.size / 2) {        
            tank.beShot(this.damage);
            if (this.type === BulletType.Split.id) {
                this.split();
            }
            return true;
        }
        return false;
    }

    weaken(ratio) {
        this.velocityX *= ratio;
        this.velocityY *= ratio;
        this.damage *= ratio * ratio;
    }

    split() {
        if (this.type != BulletType.Split.id) { return; }
        let num = 54;
        while (num-- > 0) {
            let angle = Math.random() * Math.PI * 2;
            let piece = new Bullet(this.x, this.y, angle, BulletType.Spring);
            piece.weaken(0.7);
            bullets.push(piece);
        }
    }
}

