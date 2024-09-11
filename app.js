// 安装 ws 库: npm install ws
const WebSocket = require('ws');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8000 });

const width=2560;
const height=1118;
let clients = [];
let walls=[];

function generateRandomWalls(numWalls, minWidth, maxWidth, minHeight, maxHeight) {
    const walls = [];
    for (let i = 0; i < numWalls; i++) {
        const wallWidth = Math.random() * (maxWidth - minWidth) + minWidth;
        const wallHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        const wallX = Math.random() * (width - wallWidth);
        const wallY = Math.random() * (height - wallHeight);
        walls.push({x:wallX, y:wallY, width:wallWidth, height:wallHeight});
    }
    return walls;
}

walls=generateRandomWalls(25,50, 150, 20, 100);

wss.on('connection', (ws) => {
    // 新玩家连接时，给玩家分配一个唯一 ID
    const playerId = Math.random().toString(36).substring(7);
    clients.push({ id: playerId, ws: ws });
    ws.send(JSON.stringify({ type: 'map_data', map:walls }));
    console.log(`Player ${playerId} connected`);

    // 通知其他玩家有新玩家加入
    clients.forEach(client => {
        if (client.id !== playerId) {
            client.ws.send(JSON.stringify({ type: 'new_player', id: playerId }));
        }
    });

    // 处理来自玩家的消息
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'player_hit') {
            // 找到被击中的玩家并断开连接                    
            ws.close(); // 关闭该玩家的 WebSocket 连接
            clients = clients.filter(client => client.id !== data.id); // 从客户端列表中移除

            // 通知其他玩家该玩家已下线
            clients.forEach(client => {
                client.ws.send(JSON.stringify({ 
                    type: 'player_left', 
                    id: data.id 
                }));
            });        
        }else{
            // 广播消息给所有玩家（更新坦克位置、角度、子弹信息）
            clients.forEach(client => {
                if (client.id !== playerId) {
                    client.ws.send(JSON.stringify({ 
                        type: 'update', 
                        id: playerId, 
                        state: data 
                    }));
                }
            });
        }
        
    });

    // 玩家断开连接时移除玩家
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        clients = clients.filter(client => client.id !== playerId);

        // 通知其他玩家该玩家离开
        clients.forEach(client => {
            client.ws.send(JSON.stringify({ type: 'player_left', id: playerId }));
        });
    });
});
