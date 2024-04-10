
import { env } from '$env/dynamic/private';

const SITES_DIR = env.SITES_DIR || 'sites';

export { SITES_DIR };