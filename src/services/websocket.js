import { io } from 'socket.io-client';

// For demo purposes, we'll simulate WebSocket with local state
// In production, connect to your actual WebSocket server
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.listeners = new Map();
        this.mockMessages = [];
    }

    connect(userId) {
        // For demo: simulate connection
        console.log('WebSocket: Simulating connection for', userId);
        this.connected = true;

        // Simulate receiving messages
        this.simulateIncomingMessages();

        /* In production, use real socket:
        this.socket = io(SOCKET_URL, {
          query: { userId }
        });
        
        this.socket.on('connect', () => {
          this.connected = true;
          console.log('Connected to WebSocket');
        });
        
        this.socket.on('message', (data) => {
          this.emit('message', data);
        });
        */
    }

    disconnect() {
        this.connected = false;
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    sendMessage(podId, message) {
        if (this.socket) {
            this.socket.emit('message', { podId, message });
        } else {
            // Demo: simulate sending
            this.mockMessages.push({
                id: Date.now(),
                sender: 'You',
                text: message,
                timestamp: new Date()
            });
            this.emit('message', this.mockMessages[this.mockMessages.length - 1]);
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    simulateIncomingMessages() {
        // Simulate partner messages for demo
        const demoMessages = [
            { sender: 'Sam', text: 'Hey! Ready to code?', delay: 2000 },
            { sender: 'Mila', text: 'I found a great API we can use!', delay: 5000 }
        ];

        demoMessages.forEach(msg => {
            setTimeout(() => {
                const message = {
                    id: Date.now(),
                    sender: msg.sender,
                    text: msg.text,
                    timestamp: new Date()
                };
                this.emit('message', message);
            }, msg.delay);
        });
    }
}

export default new WebSocketService();
