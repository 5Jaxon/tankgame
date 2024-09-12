import { width, height, socket, ctx, bullets, walls ,myTank,maxlife} from "./game.js";
import Bullet from "./bullet.js";

const shottingGap = 700;
const rotateAngle = 0.0005;

export default class Tank {
    constructor(x, y, color, size){
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.speed = 0.15;
        this.angle = 0;
        this.flag = false;
        this.life=maxlife;
    }

    draw(){
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, -this.size / 6, this.size, this.size / 3);
        ctx.restore();
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x-this.size/2, this.y+30, this.size/3*this.life, 5);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x+this.size/3*this.life-this.size/2, this.y+30,this.size/3*(maxlife-this.life), 5);
    }

    rotate(ratio,delay) {
        this.angle += rotateAngle * ratio*delay;
    }

    move(ratio,delay) {
        const nextX = this.x + Math.cos(this.angle) * this.speed * ratio*delay;
        const nextY = this.y + Math.sin(this.angle) * this.speed * ratio*delay;
        if (!this.checkCollisionWithWalls(nextX, nextY)) {
            this.x = nextX;
            this.y = nextY;
        }
    }
    
    checkCollisionWithWalls(x, y) {
        for (let wall of walls) {
            if (x + this.size / 2 > wall.x && x - this.size / 2 < wall.x + wall.width &&
                y + this.size / 2 > wall.y && y - this.size / 2 < wall.y + wall.height) {
                return true; // 碰撞检测
            }
        }
        return x > width || x < 0 || y < 0 || y > height;
    }


    shot(){
        if (!this.flag) {
            const x = this.x + Math.cos(this.angle) * (this.size + 10) / 2;
            const y = this.y + Math.sin(this.angle) * (this.size + 10) / 2;
            this.bullet = {x: x, y: y, angle: this.angle};
            bullets.push(new Bullet(x, y, this.angle));
            this.move(-2,20);

            this.flag = true;
            setTimeout(() => {
                this.flag = false;
            }, shottingGap);
        }   
    }
     
    beshot(){
        this.life--;
        if(this.life<=0){
            this.color='black';
            socket.send(JSON.stringify({
                type: 'player_hit',
                id: myTank.id // 发送玩家 ID 给服务器
            })); 
        }
    }

    sendState() {
        socket.send(JSON.stringify({
            x: this.x,
            y: this.y,
            angle: this.angle,
            life:this.life,
            bullet: this.bullet
        }));
        this.bullet = null;
    }
}
