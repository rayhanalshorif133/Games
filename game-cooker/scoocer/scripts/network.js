/**
 * Hybrid Multiplayer Networking Manager
 * Supports:
 * 1. WebRTC Cloud (PeerJS) - Works everywhere directly in browser with 4-digit codes!
 * 2. Local WebSocket Server - Ultra-low ping when server.js is running.
 */
class NetworkManager {
    constructor() {
        this.mode = 'webrtc'; // 'webrtc' or 'websocket'
        this.ws = null;
        this.peer = null;
        this.conn = null;
        this.connected = false;
        this.roomCode = null;
        this.role = 0; // 0 = None, 1 = Host (Bottom/Red), 2 = Guest (Top/Yellow)
        this.playerName = 'Player';
        this.opponentName = '';
        this.pingMs = 12;
        this.callbacks = {};
        this.lastPingSent = 0;

        // Try detecting if local WebSocket server is available
        this.tryConnectWebSocket();
    }

    on(event, cb) {
        this.callbacks[event] = cb;
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    tryConnectWebSocket() {
        if (window.location.protocol === 'file:') return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        if (!host) return;

        try {
            const socket = new WebSocket(`${protocol}//${host}`);
            socket.onopen = () => {
                this.ws = socket;
                this.mode = 'websocket';
                this.connected = true;
                this.emit('connected');
                this.startPing();
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {}
            };

            socket.onerror = () => {
                // Silently fallback to WebRTC Cloud
                this.mode = 'webrtc';
            };

            socket.onclose = () => {
                if (this.mode === 'websocket') {
                    this.connected = false;
                    this.mode = 'webrtc';
                }
            };
        } catch (e) {
            this.mode = 'webrtc';
        }
    }

    startPing() {
        setInterval(() => {
            if (this.mode === 'websocket' && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.lastPingSent = performance.now();
                this.ws.send(JSON.stringify({ type: 'ping', time: this.lastPingSent }));
            }
        }, 3000);
    }

    // CREATE ROOM
    createRoom(name) {
        this.playerName = name || 'Player 1';

        if (this.mode === 'websocket' && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'create_room',
                playerName: this.playerName
            }));
            return;
        }

        // WebRTC Cloud (PeerJS) Room Creation
        this.mode = 'webrtc';
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        this.roomCode = code;
        this.role = 1;

        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
        }

        const peerId = `c3-soccer-${code}`;
        try {
            if (typeof Peer === 'undefined') {
                this.emit('join_error', 'WebRTC Peer library loading failed.');
                return;
            }

            this.peer = new Peer(peerId, { debug: 0 });

            this.peer.on('open', (id) => {
                this.connected = true;
                this.emit('room_created', {
                    roomCode: code,
                    role: 1,
                    playerName: this.playerName
                });
            });

            this.peer.on('connection', (conn) => {
                this.conn = conn;
                this.setupDataConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.warn('PeerJS error:', err.type);
                if (err.type === 'unavailable-id') {
                    // Try another code if collided
                    this.createRoom(name);
                } else {
                    this.emit('join_error', 'Cloud network error. Please try again.');
                }
            });
        } catch (e) {
            console.error('Peer init error:', e);
            this.emit('join_error', 'Failed to initialize WebRTC connection.');
        }
    }

    // JOIN WITH 4-DIGIT CODE
    joinRoom(code, name) {
        this.playerName = name || 'Player 2';
        const cleanCode = (code || '').trim();

        if (this.mode === 'websocket' && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'join_room',
                roomCode: cleanCode,
                playerName: this.playerName
            }));
            return;
        }

        // WebRTC Cloud Join
        this.mode = 'webrtc';
        this.roomCode = cleanCode;
        this.role = 2;

        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
        }

        try {
            if (typeof Peer === 'undefined') {
                this.emit('join_error', 'WebRTC Peer library loading failed.');
                return;
            }

            this.peer = new Peer({ debug: 0 });

            this.peer.on('open', () => {
                const targetPeerId = `c3-soccer-${cleanCode}`;
                const conn = this.peer.connect(targetPeerId, { reliable: true });
                this.conn = conn;

                let connectedTimeout = setTimeout(() => {
                    if (!this.connected) {
                        this.emit('join_error', 'Room not found! Check your 4-digit code.');
                    }
                }, 7000);

                conn.on('open', () => {
                    clearTimeout(connectedTimeout);
                    this.connected = true;
                    this.setupDataConnection(conn);

                    // Send Guest introduction
                    conn.send({
                        type: 'guest_hello',
                        guestName: this.playerName
                    });

                    this.emit('room_joined', {
                        roomCode: cleanCode,
                        role: 2,
                        playerName: this.playerName,
                        hostName: 'Host'
                    });
                });

                conn.on('error', (err) => {
                    clearTimeout(connectedTimeout);
                    this.emit('join_error', 'Could not connect to room ' + cleanCode);
                });
            });

            this.peer.on('error', (err) => {
                this.emit('join_error', 'Connection error: ' + (err.type || 'unknown'));
            });
        } catch (e) {
            this.emit('join_error', 'Failed to connect via WebRTC.');
        }
    }

    setupDataConnection(conn) {
        conn.on('data', (data) => {
            this.handleMessage(data);
        });

        conn.on('close', () => {
            this.emit('opponent_left', 'Opponent has disconnected.');
        });

        conn.on('error', () => {
            this.emit('opponent_left', 'Connection lost with opponent.');
        });
    }

    send(data) {
        if (this.mode === 'websocket' && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else if (this.conn && this.conn.open) {
            this.conn.send(data);
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'pong':
                this.pingMs = Math.round(performance.now() - this.lastPingSent);
                this.emit('ping_update', this.pingMs);
                break;

            case 'guest_hello':
                // Host receives guest hello in WebRTC
                this.opponentName = data.guestName;
                this.emit('opponent_joined', { guestName: data.guestName });
                // Reply with host hello
                this.send({
                    type: 'host_welcome',
                    hostName: this.playerName
                });
                break;

            case 'host_welcome':
                // Guest receives host welcome in WebRTC
                this.opponentName = data.hostName;
                this.emit('ready_update', {
                    hostName: data.hostName,
                    guestName: this.playerName,
                    hostReady: false,
                    guestReady: false
                });
                break;

            case 'room_created':
                this.roomCode = data.roomCode;
                this.role = data.role;
                this.playerName = data.playerName;
                this.emit('room_created', data);
                break;

            case 'room_joined':
                this.roomCode = data.roomCode;
                this.role = data.role;
                this.playerName = data.playerName;
                this.opponentName = data.hostName;
                this.emit('room_joined', data);
                break;

            case 'join_error':
                this.emit('join_error', data.message);
                break;

            case 'opponent_joined':
                this.opponentName = data.guestName;
                this.emit('opponent_joined', data);
                break;

            case 'opponent_left':
                this.emit('opponent_left', data.message);
                break;

            case 'room_closed':
                this.roomCode = null;
                this.role = 0;
                this.emit('room_closed', data.message);
                break;

            case 'room_list':
                this.emit('room_list', data.rooms);
                break;

            case 'ready_update':
                this.emit('ready_update', data);
                break;

            case 'webrtc_ready_toggle':
                // In WebRTC mode, peer sends ready state
                if (data.role === 1) this.hostReadyState = data.ready;
                if (data.role === 2) this.guestReadyState = data.ready;
                
                this.emit('ready_update', {
                    hostReady: this.role === 1 ? this.myReadyState : data.ready,
                    guestReady: this.role === 2 ? this.myReadyState : data.ready
                });

                // If host sees both ready, start match!
                if (this.role === 1 && this.myReadyState && data.ready) {
                    const startMsg = {
                        type: 'match_start_countdown',
                        countdownSeconds: 3,
                        hostName: this.playerName,
                        guestName: this.opponentName
                    };
                    this.send(startMsg);
                    this.emit('match_start_countdown', startMsg);
                }
                break;

            case 'match_start_countdown':
                this.emit('match_start_countdown', data);
                break;

            case 'opponent_paddle':
                this.emit('opponent_paddle', data);
                break;

            case 'ball_state':
                this.emit('ball_state', data);
                break;

            case 'goal_event':
                this.emit('goal_event', data);
                break;

            case 'game_over':
                this.emit('game_over', data);
                break;

            case 'rematch_requested':
                this.emit('rematch_requested', data);
                break;
        }
    }

    setReady(isReady) {
        this.myReadyState = isReady;
        if (this.mode === 'websocket') {
            this.send({ type: 'set_ready', ready: isReady });
        } else {
            // WebRTC Mode
            this.send({
                type: 'webrtc_ready_toggle',
                role: this.role,
                ready: isReady
            });
            this.emit('ready_update', {
                hostReady: this.role === 1 ? isReady : false,
                guestReady: this.role === 2 ? isReady : false
            });
        }
    }

    sendPaddle(x, y, vx = 0, vy = 0) {
        this.send({
            type: 'opponent_paddle',
            role: this.role,
            x: Math.round(x),
            y: Math.round(y),
            vx: Math.round(vx),
            vy: Math.round(vy)
        });
    }

    sendBall(ball) {
        if (this.role !== 1) return;
        this.send({
            type: 'ball_state',
            x: Math.round(ball.x * 10) / 10,
            y: Math.round(ball.y * 10) / 10,
            vx: Math.round(ball.vx * 100) / 100,
            vy: Math.round(ball.vy * 100) / 100,
            rotation: Math.round(ball.rotation * 100) / 100,
            lastHitBy: ball.lastHitRole
        });
    }

    sendGoal(scorerRole, ballX, ballY) {
        if (this.role !== 1) return;
        const newScore = [
            scorerRole === 1 ? window.gameController.p1Score + 1 : window.gameController.p1Score,
            scorerRole === 2 ? window.gameController.p2Score + 1 : window.gameController.p2Score
        ];

        const goalMsg = {
            type: 'goal_event',
            scorerRole: scorerRole,
            score: newScore,
            ballX: ballX,
            ballY: ballY
        };

        this.send(goalMsg);
        this.emit('goal_event', goalMsg);

        if (newScore[0] >= 5 || newScore[1] >= 5) {
            const winnerRole = newScore[0] >= 5 ? 1 : 2;
            const winnerName = winnerRole === 1 ? this.playerName : this.opponentName;
            const overMsg = {
                type: 'game_over',
                winnerRole: winnerRole,
                winnerName: winnerName,
                finalScore: newScore
            };
            this.send(overMsg);
            this.emit('game_over', overMsg);
        }
    }

    requestRematch() {
        this.send({ type: 'rematch_requested', role: this.role });
    }

    acceptRematch() {
        const startMsg = {
            type: 'match_start_countdown',
            countdownSeconds: 3,
            hostName: this.role === 1 ? this.playerName : this.opponentName,
            guestName: this.role === 2 ? this.playerName : this.opponentName
        };
        this.send(startMsg);
        this.emit('match_start_countdown', startMsg);
    }

    leaveRoom() {
        if (this.mode === 'websocket') {
            this.send({ type: 'leave_room' });
        } else if (this.conn) {
            try { this.conn.close(); } catch (e) {}
        }
        this.roomCode = null;
        this.role = 0;
    }

    connect() {
        // Ready for action
    }

    getRooms() {
        if (this.mode === 'websocket') {
            this.send({ type: 'get_rooms' });
        } else {
            // WebRTC Mode: direct code matching is primary
            this.emit('room_list', []);
        }
    }
}

window.networkManager = new NetworkManager();
