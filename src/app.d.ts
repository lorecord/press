// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

declare namespace App {
	// interface Error {}
	interface Locals {
		localeContext: {
			pathLocale?: string;
			pathLocaleParam?: string;
			cookieLocale?: string;
			preferedLanguage?: string;
			acceptLanguages?: string[],
			uiLocale?: string;
			contentLocale?: string;
		},
		site?: any;
	}
	// interface PageData {}
	// interface Platform {}
}
