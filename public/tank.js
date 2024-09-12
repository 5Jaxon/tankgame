const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const width = 2560;
const height =1118;
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
const scaleX =  window.innerWidth/width ;
const scaleY = window.innerHeight/height ;
const scale = Math.min(scaleX, scaleY); // 确保地图能够完整显示

const socket = new WebSocket('ws://8.138.94.211:8000');

const walls=[];
const state={};
let myTank = null;
const shottingGap = 700;
const rotateAngle = 0.01;
const otherTanks = {};

const bullets=[];
const bulletMaxRebound = 1;

socket.onopen = () => {
    console.log('Connected to WebSocket server');
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'new_player') {
        console.log(`New player joined: ${message.id}`);
    } else if (message.type === 'update') {
        const playerId = message.id;
        const state = message.state;
        const bullet=state.bullet;

        if (!otherTanks[playerId]) {
            otherTanks[playerId] = new Tank(state.x, state.y, 'red', 30); // 添加新玩家的坦克
        }
        if(bullet){
            bullets.push(new Bullet(bullet.x,bullet.y,bullet.angle));
        }
        
        otherTanks[playerId].x = state.x;
        otherTanks[playerId].y = state.y;
        otherTanks[playerId].angle = state.angle;
    } else if (message.type === 'player_left') {
        console.log(`Player ${message.id} left`);
        delete otherTanks[message.id]; // 移除离开的玩家坦克
    } else if (message.type === 'map_data') {
        for(const wall of message.map){
            walls.push(new Wall(wall.x,wall.y,wall.width,wall.height));
        }
        console.log('Map data received:', walls);
        aftermap();
    }
};


class Tank{    
    constructor(x,y,color,size){
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.speed = 2;
        this.angle = 0;
        this.flag = false;
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
    }

    rotate(ratio) {
        this.angle += rotateAngle * ratio;
    }

    move(ratio) {
        const nextX = this.x + Math.cos(this.angle) * this.speed * ratio;
        const nextY = this.y + Math.sin(this.angle) * this.speed * ratio;

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
            this.move(-2);
            
            this.flag = true;
            setTimeout(() => {
                this.flag = false;
            }, shottingGap);
        }   
    }

    sendState() {
        socket.send(JSON.stringify({
            x: this.x,
            y: this.y,
            angle: this.angle,
            bullet: this.bullet
        }));
        this.bullet = null;
    }
}

class Bullet{
    constructor(x, y, angle){
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 24;
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
        this.checkCollisionWithTank(myTank);        
    

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
                if (this.y - this.size < wall.y || this.y + this.size > wall.y + wall.height) {
                    this.velocityY = -this.velocityY;
                }
            }
        }
    }

    checkCollisionWithTank(tank) {
        if (this.x + this.size > tank.x - tank.size / 2 &&
            this.x - this.size < tank.x + tank.size / 2 &&
            this.y + this.size > tank.y - tank.size / 2 &&
            this.y - this.size < tank.y + tank.size / 2) {
            tank.color='black';
            socket.send(JSON.stringify({
                type: 'player_hit',
                id: myTank.id // 发送玩家 ID 给服务器
            }));                
        }
    }
}

class Wall {
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
        return bullet.x + bullet.size > this.x && 
               bullet.x - bullet.size < this.x + this.width &&
               bullet.y + bullet.size > this.y && 
               bullet.y - bullet.size < this.y + this.height;
    }
}


function isTankInWall(tank, walls) {
    for (let wall of walls) {
        if (
            tank.x + tank.size / 2 > wall.x && 
            tank.x - tank.size / 2 < wall.x + wall.width &&
            tank.y + tank.size / 2 > wall.y && 
            tank.y - tank.size / 2 < wall.y + wall.height
        ) {
            return true; // 坦克与墙壁重叠
        }
    }
    return false; // 坦克位置合法
}

// 随机生成坦克位置，确保不与墙壁重叠
function generateRandomTankPosition(walls, tankSize) {
    let x, y;
    let validPosition = false;

    while (!validPosition) {
        x = Math.random() * (width - tankSize) + tankSize / 2;
        y = Math.random() * (height - tankSize) + tankSize / 2;
        
        const tempTank = { x: x, y: y, size: tankSize };

        if (!isTankInWall(tempTank, walls)) {
            validPosition = true;
        }
    }

    return { x, y };
}

const keyMap = {};

function handleTankMovement() {
    change = false;

    let r = 1.0;
    if (keyMap['KeyW']) {
        myTank.move(r);
        change = true;
    }
    if (keyMap['KeyS']) {
        myTank.move(-r);
        change = true;
    }
    if (keyMap['KeyA']) {
        r *= 3;
        myTank.rotate(-r);
        change = true;
    }
    if (keyMap['KeyQ']) {
        myTank.rotate(-r);
        change = true;
    }
    if (keyMap['KeyD']) {
        r *= 3;
        myTank.rotate(r);
        change = true;
    }
    if (keyMap['KeyE']) {
        myTank.rotate(r);
        change = true;
    }
    if (keyMap['Space']) {
        myTank.shot();
        change = true;
    }

    if (change) myTank.sendState();
}

function loop(){
    // ctx.save();
    // ctx.scale(scale,scale);
    ctx.fillStyle='rgba(255,255,255,1)';
    ctx.fillRect(0,0,width,height);    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2; // 边界线宽度
    ctx.strokeRect(0, 0, width, height); // 画出地图的边界线
    handleTankMovement();
    myTank.draw();    
    for(const key in otherTanks){
        otherTanks[key].draw();
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        bullet.update();
        if(bullet.timer > 500 || bullet.reboundTime > bulletMaxRebound){
            bullets.splice(i, 1);
            continue;
        }
        bullet.draw();
    }
    for(const wall of walls){
        wall.draw();
    }
    // ctx.restore();
    requestAnimationFrame(loop);
}

function aftermap(){
    // console.log(window.innerWidth);
    // console.log(window.innerHeight);
    
    const tankPosition = generateRandomTankPosition(walls, 30);
    myTank = new Tank(tankPosition.x, tankPosition.y, 'blue', 30);

    window.onkeydown = (event) => {
        keyMap[event.code] = true;
    };
    
    // 键盘松开事件，更新按键状态
    window.onkeyup = (event) => {
        keyMap[event.code] = false;
    };
    ctx.scale(scale,scale);
    myTank.sendState();
    loop();
}
