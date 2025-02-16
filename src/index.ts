import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import Message from './models/Message';
import { config } from 'dotenv';

config();

const app = express();
const PORT = 5000;

// Create an HTTP server
const server = http.createServer(app);

// Initialize socket.io with the server
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

app.post('/message', async (req: Request, res: Response) => {
    const { message } = req.body;

    // Create a new message document
    const newMessage = new Message({
        message: message,
        date: Date.now(),
    });

    try {
        // Save the message to the database
        const savedMessage = await newMessage.save();
        
        // Emit the new message to all connected clients
        io.emit('newMessage', savedMessage);
        
        res.json(savedMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

app.get('/', async (req: Request, res: Response) => {
    try {
        // Fetch all messages from the database
        const messages = await Message.find();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

app.delete('/message/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndDelete(id);
        
        // Emit the delete event to all connected clients
        io.emit('deleteMessage', id);
        
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
});

app.put('/message/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const updatedMessage = await Message.findByIdAndUpdate(id, { message }, { new: true });
        
        // Emit the update event to all connected clients
        io.emit('updateMessage', updatedMessage);
        
        res.json(updatedMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error updating message' });
    }
});

const connectToDatabaseAndPort = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL || '');
        console.log('Connected to the database');
        
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Listening on Port: ${PORT}`);
        });
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
};

connectToDatabaseAndPort();

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});
