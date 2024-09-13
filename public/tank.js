import {socket, ctx, bullets, myTank, tankCollidedWithWalls} from "./game.js";
import {normalBullet} from "./bullet.js";

const life = 100;
const shottingGap = 700;
const rotateAngle = 0.01;

export default class Tank {
    constructor(x, y, color, size){
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.speed = 2;
        this.angle = 0;
        this.flag = false;
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

    shot() {
        if (!this.flag) {
            const x = this.x + Math.cos(this.angle) * (this.size + 10) / 2;
            const y = this.y + Math.sin(this.angle) * (this.size + 10) / 2;
            this.bullet = normalBullet(x, y, this.angle);
            bullets.push(normalBullet(x, y, this.angle));
            this.move(this.bullet.backlash);

            this.flag = true;
            setTimeout(() => {
                this.flag = false;
            }, shottingGap);
        }   
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
