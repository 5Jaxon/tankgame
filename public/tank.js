import {height, width, socket, ctx, bullets, myTank, walls} from "./game.js";
import {Bullet, BulletType} from "./bullet.js";

const life = 100;
const rotateAngle = 0.008;

export default class Tank {
    constructor(x, y, color, size){
        this.x = x;
        this.y = y;
        this.life = life;
        this.color = color;
        this.size = size;
        this.speed = 2.5;
        this.angle = 0;
        this.loaded = [true, true, true];
        this.magazine = [
            BulletType.Normal.loadage,
            BulletType.Spring.loadage,
            BulletType.Split.loadage
        ];
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, -this.size / 6, this.size, this.size / 3);
        ctx.restore();

        // remain life bar
        ctx.fillStyle = 'green';
        ctx.fillRect(
            this.x - this.size / 2,
            this.y + 30,
            this.size / life * this.life,
            5
        );

        // lose life bar
        ctx.fillStyle = 'red';
        ctx.fillRect(
            this.x + this.size / life * this.life - this.size / 2,
            this.y + 30,
            this.size / life * (life - this.life), 
            5
        );
    }

    rotate(ratio) {
        this.angle += rotateAngle * ratio;
    }

    move(ratio) {
        let prevX = this.x;
        let prevY = this.y;
        const nextX = this.x + Math.cos(this.angle) * this.speed * ratio;
        const nextY = this.y + Math.sin(this.angle) * this.speed * ratio;
        this.x = (nextX + width) % width;
        this.y = (nextY + height) % height;
        if (this.collidedWithWalls()) {
            this.x = prevX;
            this.y = prevY;
        }
    }

    collidedWithWalls() {
        for (let wall of walls) {
            if (
                this.x + this.size / 2 > wall.x && 
                this.x - this.size / 2 < wall.x + wall.width &&
                this.y + this.size / 2 > wall.y &&
                this.y - this.size / 2 < wall.y + wall.height
            ) {
                return true;
            }
        }

        return false;
    }


    shoot(type) {
        if (this.loaded[type.id]) {
            const x = this.x + Math.cos(this.angle) * (this.size + 10) / 2;
            const y = this.y + Math.sin(this.angle) * (this.size + 10) / 2;
            let bullet = new Bullet(x, y, this.angle, type);
            bullets.push(bullet);
            this.move(bullet.backlash);
            
            this.bullet = {
                x: x,
                y: y,
                angle: this.angle,
                loadTime: bullet.loadTime,
                BulletType: type
            };

            this.magazine[type.id]--;
            if (this.magazine[type.id] <= 0) {
                this.reload(type.id, type.loadTime);
                this.magazine[type.id] = type.loadage;
            } else {
                this.cooling(type.id, type.interval);
            }
        }   
    }
    
    reload(type, loadTime) {
        this.loaded[type] = false;

        setTimeout(() => {
            this.loaded[type] = true;
        }, loadTime);
    }

    cooling(type, interval) {
        this.loaded[type] = false;
        setTimeout(() => {
            this.loaded[type] = true;
        }, interval);
    }
     
    beShot(damage) {
        this.life -= damage;
        if(this.life <= 0){
            this.color ='black';
            socket.send(JSON.stringify({
                type: 'player_hit',
                id: myTank.id
            })); 
        }
    }

    sendState() {
        socket.send(JSON.stringify({
            x: this.x,
            y: this.y,
            angle: this.angle,
            life: this.life,
            bullet: this.bullet
        }));
        this.bullet = null;
    }
}
