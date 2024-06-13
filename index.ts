import express, { Request, Response } from 'express';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import morgan from 'morgan';

function trauncate(username: string) {
    if (username.length <= 17) return username;
    return `${username.slice(0, 10)}....${username.slice(-6)}`;
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

    const BG_COLOR =
        username.length == 4
            ? '#EFF2F8'
            : username.length == 5
            ? '#FCEDED'
            : username.length == 6
            ? '#F2FCED'
            : username.length == 7
            ? '#EDFCFB'
            : username.length == 8
            ? '#EFEDFC'
            : username.length == 9
            ? '#D1CDF3'
            : username.length == 10
            ? '#EDF3CD'
            : '#E9D2E6';

    username = trauncate(username);

    const file = 'main.svg';
    let content = fs.readFileSync(path.join(__dirname, 'svg', file), 'utf8');

    const ele = `<text dx="0" dy="0" font-family="&quot;eDqPEmTwIRa1:::Montserrat Alternates&quot;" font-size="28" font-weight="500" transform="translate(112.86081 456.69521)" stroke-width="0" textLength="323" lengthAdjust="spacingAndGlyphs"><tspan y="0" font-weight="500" stroke-width="0"><![CDATA[@${username}]]></tspan><tspan x="0" y="28" font-weight="500" stroke-width="0"><![CDATA[ ]]></tspan></text>`;
    content = content.replace(/<text.*?<\/text>/s, ele);
    content = content.replace('BG_COLOR', BG_COLOR);

    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Content-Type', 'image/svg+xml');
    res.send(content);
});

const httpServer = http.createServer(app);
httpServer.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
