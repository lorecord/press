import { dev } from "$app/environment";
import { getNativeInteraction, saveNativeInteraction } from "$lib/interaction/handle-native";
import type { NativeMention } from "$lib/interaction/types";
import { findLinkInContent } from "$lib/utils/content";
import crypto from 'crypto';

// src/routes/api/pingback/+server.js
export async function POST({ request, locals }) {
  const { site } = locals as any;
  const xml = await request.text();

  try {
    const [, sourceURI, targetURI] = xml.match(/<string>(.*)<\/string>.*<string>(.*)<\/string>/s) || [];

    // pingback.ping
    if (sourceURI && targetURI) {
      console.log(`[api/v1/pingback] sourceURI: ${sourceURI}, targetURI: ${targetURI}`);
      const id = crypto.createHash('sha256').update(JSON.stringify({ source: sourceURI, target: targetURI })).digest('hex');

      const existed = getNativeInteraction(site, id);

      if (existed?.interaction?.spam) {
        return new Response(createErrorResponse(0, 'Spam'), { status: 400 });
      }

      const headers = new Headers();
      headers.set('User-Agent', "XMLRPC");
      // add accept header
      headers.set('Accept', 'text/html, application/json, text/plain');
      let result = await fetch(sourceURI, { method: 'GET', headers }).then((response) => {
        if (response.ok) {
          // check header is html or json or text
          if (response.headers?.get('Content-Type')?.includes('text/html') || response.headers?.get('Content-Type')?.includes('application/json') || response.headers?.get('Content-Type')?.includes('text/plain')) {
            return response.text().then((content) => {
              return findLinkInContent(content, sourceURI, targetURI, response.headers?.get('Content-Type') || '');
            });
          }
          return {
            contentType: response.headers?.get('Content-Type')
          } as any;
        } else {
          if (response.status >= 400 && response.status < 500) {
            if (dev) {
              response.text().then((text) => {
                console.log(`[api/v1/pingback] valid response status: ${response.status}`, text);
              });
            }
            // delete from the database
            return {
              valid: true,
              contentType: response.headers?.get('Content-Type'),
              deleted: true
            }
          }
        }
      });

      if (!result?.valid) {
        return new Response(createSuccessResponse(), { status: 400 });
      }

      if (!result?.deleted) {
        // TODO author
        let mention: NativeMention = {
          id,
          channel: 'native',
          url: sourceURI,
          published: new Date().toISOString(),
          type: 'mention',
          title: result.title,
        };

        // remove hash from targetURI，`https://example.com/abcd/#comment-1` => `https://example.com/abcd/`
        const targetURIWithoutHash = targetURI.replace(/#.*$/, '');

        let effectedRoute = new URL(targetURIWithoutHash).pathname;
        effectedRoute = effectedRoute.endsWith('/') ? effectedRoute.substring(0, effectedRoute.length - 1) : effectedRoute;
        saveNativeInteraction(site, { route: effectedRoute }, mention);
      }

      return new Response(createSuccessResponse(), { status: 200 });
    } else {
      return new Response(createErrorResponse(0, 'Invalid method name or parameters'), { status: 400 });
    }
  } catch (error) {
    return new Response(createErrorResponse(0, 'Malformed XML'), { status: 400 });
  }
}

function createSuccessResponse() {
  const response = `
      <methodResponse>
        <params>
          <param>
            <value><string></string></value>
          </param>
        </params>
      </methodResponse>
    `;
  return response.trim();
}

function createErrorResponse(code: number | string, message: string) {
  const response = `
      <methodResponse>
        <fault>
          <value>
            <struct>
              <member>
                <name>faultCode</name>
                <value><int>${code}</int></value>
              </member>
              <member>
                <name>faultString</name>
                <value><string>${message}</string></value>
              </member>
            </struct>
          </value>
        </fault>
      </methodResponse>
    `;
  return response.trim();
}
