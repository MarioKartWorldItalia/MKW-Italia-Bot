import crypto from 'crypto';
import { Request, Response } from 'express';
import { Globals } from './globals';

export function onWebhooks(req: Request, res: Response, next: Function): boolean {
    const method = req.method;

    if (method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const verifyToken = Globals.META_VERIFY_TOKEN;
        if (!verifyToken) {
            console.error('META_VERIFY_TOKEN environment variable not set');
            res.status(500).send('Server configuration error');
            return false;
        }

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
            return true;
        } else {
            res.status(403).send('Forbidden');
            return false;
        }
    } else if (method === 'POST') {
        const signature = req.get('X-Hub-Signature-256');
        const appSecret = process.env.META_APP_SECRET;

        if (!appSecret) {
            console.error('META_APP_SECRET environment variable not set');
            res.status(500).send('Server configuration error');
            return false;
        }

        if (!signature) {
            console.error('No signature provided');
            res.status(401).send('Unauthorized');
            return false;
        }

        // Get the raw body
        const body = req.body.toString('utf8');

        // Create expected signature
        const expectedSignature = crypto
            .createHmac('sha256', appSecret)
            .update(body, 'utf8')
            .digest('hex');

        const signatureHash = signature.split('=')[1];

        if (!crypto.timingSafeEqual(Buffer.from(signatureHash, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
            console.error('Signature verification failed');
            res.status(401).send('Unauthorized');
            return false;
        }

        // Signature is valid, proceed
        next();
        return true;
    } else {
        res.status(405).send('Method Not Allowed');
        return false;
    }
}