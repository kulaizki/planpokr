import type { Handle } from '@sveltejs/kit';

console.log('Server hook initializing...');

export const handle: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);
    return response;
};

console.log('Server hook initialized.'); 