import localtunnel from 'localtunnel';
import type { AddressInfo } from 'net';
import * as util from 'util';
import { createApp } from '../lib/express/app';

util.inspect.defaultOptions.depth = Infinity;

const particleDeviceId = process.env.PARTICLE_DEVICE_ID;
const particlePassword = process.env.PARTICLE_PASSWORD;
const particleUsername = process.env.PARTICLE_USERNAME;
const zoomClientId = process.env.ZOOM_CLIENT_ID;
if (!particleDeviceId || !particlePassword || !particleUsername || !zoomClientId) {
	throw new Error();
}

const app = createApp({
	particleDeviceId,
	particlePassword,
	particleUsername,
	zoomClientId,
});

const server = app.listen(async () => {
	const address = server.address() as AddressInfo;
	console.info({ address });

	try {
		const tunnel = await localtunnel({
			local_host: address.address,
			port: address.port,
			subdomain: 'on-air-light',
		});
		console.info({ url: tunnel.url });
	} catch (error) {
		console.error({ error });
	}
});
