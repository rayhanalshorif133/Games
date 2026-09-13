const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg'
};

// Static HTTP Server
const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';

    let safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

// WebSocket Server for Multiplayer Matchmaking
const wss = new WebSocketServer({ server });

// Active Rooms Map: roomCode -> Room Object
const rooms = new Map();

function generateRoomCode() {
    let code;
    do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms.has(code));
    return code;
}

function send(ws, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

function broadcastToRoom(room, data, excludeWs = null) {
    if (room.host && room.host !== excludeWs) send(room.host, data);
    if (room.guest && room.guest !== excludeWs) send(room.guest, data);
}

function getAvailableRooms() {
    const list = [];
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
        if (!room.guest && room.state === 'waiting' && (now - room.createdAt < 3600000)) {
            list.push({
                code: room.code,
                hostName: room.hostName || 'Player 1',
                playerCount: 1,
                createdAt: room.createdAt
            });
        }
    }
    return list;
}

wss.on('connection', (ws) => {
    ws.roomCode = null;
    ws.role = 0; // 1 = Host, 2 = Guest
    ws.playerName = 'Player';

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case 'create_room': {
                    const roomCode = generateRoomCode();
                    const playerName = (data.playerName || 'Player 1').trim().slice(0, 16);
                    
                    const room = {
                        code: roomCode,
                        host: ws,
                        hostName: playerName,
                        guest: null,
                        guestName: '',
                        hostReady: false,
                        guestReady: false,
                        state: 'waiting',
                        score: [0, 0],
                        createdAt: Date.now()
                    };

                    rooms.set(roomCode, room);
                    ws.roomCode = roomCode;
                    ws.role = 1;
                    ws.playerName = playerName;

                    send(ws, {
                        type: 'room_created',
                        roomCode: roomCode,
                        role: 1,
                        playerName: playerName
                    });
                    break;
                }

                case 'join_room': {
                    const roomCode = (data.roomCode || '').trim();
                    const playerName = (data.playerName || 'Player 2').trim().slice(0, 16);
                    const room = rooms.get(roomCode);

                    if (!room) {
                        send(ws, { type: 'join_error', message: 'Room not found! Check your 4-digit code.' });
                        return;
                    }

                    if (room.guest && room.guest.readyState === WebSocket.OPEN) {
                        send(ws, { type: 'join_error', message: 'Room is already full!' });
                        return;
                    }

                    room.guest = ws;
                    room.guestName = playerName;
                    room.guestReady = false;
                    room.state = 'lobby';

                    ws.roomCode = roomCode;
                    ws.role = 2;
                    ws.playerName = playerName;

                    // Notify Guest
                    send(ws, {
                        type: 'room_joined',
                        roomCode: roomCode,
                        role: 2,
                        playerName: playerName,
                        hostName: room.hostName,
                        guestName: playerName,
                        hostReady: room.hostReady,
                        guestReady: room.guestReady
                    });

                    // Notify Host
                    send(room.host, {
                        type: 'opponent_joined',
                        guestName: playerName,
                        hostReady: room.hostReady,
                        guestReady: room.guestReady
                    });
                    break;
                }

                case 'get_rooms': {
                    send(ws, {
                        type: 'room_list',
                        rooms: getAvailableRooms()
                    });
                    break;
                }

                case 'set_ready': {
                    if (!ws.roomCode) return;
                    const room = rooms.get(ws.roomCode);
                    if (!room) return;

                    const isReady = !!data.ready;
                    if (ws.role === 1) {
                        room.hostReady = isReady;
                    } else if (ws.role === 2) {
                        room.guestReady = isReady;
                    }

                    broadcastToRoom(room, {
                        type: 'ready_update',
                        hostReady: room.hostReady,
                        guestReady: room.guestReady
                    });

                    // If both players are present and ready, initiate match countdown!
                    if (room.host && room.guest && room.hostReady && room.guestReady) {
                        room.state = 'playing';
                        room.score = [0, 0];
                        broadcastToRoom(room, {
                            type: 'match_start_countdown',
                            countdownSeconds: 3,
                            hostName: room.hostName,
                            guestName: room.guestName
                        });
                    }
                    break;
                }

                case 'paddle_move': {
                    if (!ws.roomCode) return;
                    const room = rooms.get(ws.roomCode);
                    if (!room || room.state !== 'playing') return;

                    const opponent = (ws.role === 1) ? room.guest : room.host;
                    if (opponent) {
                        send(opponent, {
                            type: 'opponent_paddle',
                            role: ws.role,
                            x: data.x,
                            y: data.y,
                            vx: data.vx || 0,
                            vy: data.vy || 0
                        });
                    }
                    break;
                }

                case 'ball_sync': {
                    // Host is authoritative for ball physics
                    if (!ws.roomCode || ws.role !== 1) return;
                    const room = rooms.get(ws.roomCode);
                    if (!room || room.state !== 'playing') return;

                    if (room.guest) {
                        send(room.guest, {
                            type: 'ball_state',
                            x: data.x,
                            y: data.y,
                            vx: data.vx,
                            vy: data.vy,
                            rotation: data.rotation,
                            lastHitBy: data.lastHitBy
                        });
                    }
                    break;
                }

                case 'goal_scored': {
                    if (!ws.roomCode) return;
                    const room = rooms.get(ws.roomCode);
                    if (!room) return;

                    const scorerRole = data.scorerRole; // 1 or 2
                    if (scorerRole === 1) room.score[0]++;
                    if (scorerRole === 2) room.score[1]++;

                    broadcastToRoom(room, {
                        type: 'goal_event',
                        scorerRole: scorerRole,
                        score: room.score,
                        ballX: data.ballX,
                        ballY: data.ballY
                    });

                    // Match ends at 5 goals
                    const WINNING_SCORE = 5;
                    if (room.score[0] >= WINNING_SCORE || room.score[1] >= WINNING_SCORE) {
                        room.state = 'game_over';
                        const winnerRole = room.score[0] >= WINNING_SCORE ? 1 : 2;
                        const winnerName = winnerRole === 1 ? room.hostName : room.guestName;
                        broadcastToRoom(room, {
                            type: 'game_over',
                            winnerRole: winnerRole,
                            winnerName: winnerName,
                            finalScore: room.score
                        });
                    }
                    break;
                }

                case 'rematch_request': {
                    if (!ws.roomCode) return;
                    const room = rooms.get(ws.roomCode);
                    if (!room) return;

                    broadcastToRoom(room, {
                        type: 'rematch_requested',
                        requesterRole: ws.role
                    }, ws);
                    break;
                }

                case 'rematch_accept': {
                    if (!ws.roomCode) return;
                    const room = rooms.get(ws.roomCode);
                    if (!room) return;

                    room.score = [0, 0];
                    room.hostReady = true;
                    room.guestReady = true;
                    room.state = 'playing';

                    broadcastToRoom(room, {
                        type: 'match_start_countdown',
                        countdownSeconds: 3,
                        hostName: room.hostName,
                        guestName: room.guestName
                    });
                    break;
                }

                case 'leave_room': {
                    handleLeave(ws);
                    break;
                }

                case 'ping': {
                    send(ws, { type: 'pong', time: data.time });
                    break;
                }
            }
        } catch (e) {
            console.error('Error handling WebSocket message:', e);
        }
    });

    ws.on('close', () => {
        handleLeave(ws);
    });

    ws.on('error', () => {
        handleLeave(ws);
    });
});

function handleLeave(ws) {
    if (!ws.roomCode) return;
    const room = rooms.get(ws.roomCode);
    if (!room) return;

    if (ws.role === 1) {
        // Host left -> close room
        if (room.guest) {
            send(room.guest, {
                type: 'room_closed',
                message: 'Host has left the room.'
            });
            room.guest.roomCode = null;
            room.guest.role = 0;
        }
        rooms.delete(ws.roomCode);
    } else if (ws.role === 2) {
        // Guest left -> room returns to waiting
        room.guest = null;
        room.guestName = '';
        room.guestReady = false;
        room.state = 'waiting';
        if (room.host) {
            send(room.host, {
                type: 'opponent_left',
                message: 'Opponent has disconnected.'
            });
        }
    }
    ws.roomCode = null;
    ws.role = 0;
}

// Clean up stale empty rooms every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
        const hostDisconnected = !room.host || room.host.readyState !== WebSocket.OPEN;
        const guestDisconnected = !room.guest || room.guest.readyState !== WebSocket.OPEN;
        if ((hostDisconnected && guestDisconnected) || (now - room.createdAt > 3600000 * 3)) {
            rooms.delete(code);
        }
    }
}, 60000);

server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` ⚽ 2D Soccer Multiplayer Server running!`);
    console.log(` Local URL: http://localhost:${PORT}`);
    
    // Print local network IP for testing with mobile or 2nd computer
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(` LAN URL:   http://${iface.address}:${PORT}`);
            }
        }
    }
    console.log(`====================================================`);
});

