import {socket, ctx, bullets, myTank, tankCollidedWithWalls} from "./game.js";
import {Bullet, BulletType} from "./bullet.js";

const life = 100;
const rotateAngle = 0.008;

export default class Tank {
    constructor(x, y, color, size){
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.speed = 2.5;
        this.angle = 0;
        this.normalLoaded = true;
        this.springLoaded = true;
        this.splitLoaded = true;
        this.life = life;
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
        const nextX = this.x + Math.cos(this.angle) * this.speed * ratio;
        const nextY = this.y + Math.sin(this.angle) * this.speed * ratio;
        if (!tankCollidedWithWalls(nextX, nextY, this.size)) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    shoot(type) {
        let loaded = (type === BulletType.Normal && this.normalLoaded) ||
                     (type === BulletType.Spring && this.springLoaded) ||
                     (type === BulletType.Split && this.splitLoaded);
        if (loaded) {
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
            this.reload(type);
        }   
    }
    
    reload(type) {
        let loadTime = this.bullet.loadTime;
        if (type === BulletType.Normal) {
            this.normalLoaded = false;
        } else if (type === BulletType.Spring) {
            this.springLoaded = false;
        } else if (type === BulletType.Split) {
            this.splitLoaded = false;
        }

        setTimeout(() => {
            if (type === BulletType.Normal) {
                this.normalLoaded = true;
            } else if (type === BulletType.Spring) {
                this.springLoaded = true;
            } else if (type === BulletType.Split) {
                this.splitLoaded = true;
            }
        }, loadTime);
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
