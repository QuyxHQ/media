import express, { Request, Response } from 'express';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import morgan from 'morgan';
import { createCanvas, loadImage } from 'canvas';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 0 });

function trauncate(username: string) {
    if (username.length <= 36) return username;
    return `${username.slice(0, 20)}....${username.slice(-13)}`;
}

const app = express();
const PORT = 3001;

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'OPTIONS'],
    })
);

app.use(helmet());
app.use(express.static(path.join(__dirname, 'static')));

app.use(
    morgan('combined', {
        stream: fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {
            flags: 'a',
        }),
    })
);

app.get('/healthz', (_, res: Response) => res.sendStatus(200));

app.get('/nft/:username', async function (req: Request, res: Response) {
    let { username } = req.params;

    const len = username.length - 3;
    if (len < 1) return res.sendStatus(400);

    const key = `nft_${username}`;
    const cachedBuffer = cache.get<Buffer>(key);

    if (cachedBuffer) {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Content-Type', 'image/png');

        return res.send(cachedBuffer);
    }

    username = trauncate(username);

    const file = 'main.svg';
    let content = fs.readFileSync(path.join(__dirname, 'svg', file), 'utf8');
    content = content.replace('[[USERNAME]]', username);
    content = content.replace('[[LENGTH]]', String(len + 3));

    const canvas = createCanvas(500, 499);
    const ctx = canvas.getContext('2d');

    const image = await loadImage(
        `data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}`
    );

    ctx.drawImage(image, 0, 0);
    const buffer = canvas.toBuffer('image/png');

    cache.set(key, buffer);

    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Content-Type', 'image/png');
    res.send(buffer);
});

const httpServer = http.createServer(app);
httpServer.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
