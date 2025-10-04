#!/usr/bin/env node

// Startup script for Railway deployment
const { spawn } = require('child_process');
const http = require('http');

console.log('Starting Typing Game server...');

// Start the server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
});

// Wait for server to be ready
const checkServer = () => {
    const req = http.get('http://localhost:3001/health', (res) => {
        if (res.statusCode === 200) {
            console.log('✅ Server is ready and responding to health checks');
        } else {
            console.log(`⚠️ Server responded with status ${res.statusCode}`);
        }
    });
    
    req.on('error', (err) => {
        console.log('⏳ Server not ready yet, retrying in 2 seconds...');
        setTimeout(checkServer, 2000);
    });
};

// Check server readiness after a short delay
setTimeout(checkServer, 3000);

// Handle process termination
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
});

